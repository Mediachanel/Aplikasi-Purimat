// =============================================================================
// Sinkronisasi PGlite <-> Google Spreadsheet
// - 1 tabel database = 1 tab spreadsheet, baris 1 = nama kolom.
// - Muat: semua tab dibaca sekaligus (1x batchGet) saat server start.
// - Simpan: trigger per-statement menandai tabel yang berubah; setelah COMMIT,
//   tabel tersebut ditulis ulang utuh ke tab-nya dalam SATU batchUpdate atomik
//   (data lama di tab tidak pernah terhapus sebelum data baru tertulis).
// - Edit manual di spreadsheet terdeteksi lewat modifiedTime (Drive) lalu dimuat ulang.
// =============================================================================
import type { PGlite } from '@electric-sql/pglite';
import { google, spreadsheetId } from '../config/google.js';
import { ENV } from '../config/env.js';
import { SHEET_LAYOUTS, LayoutEntry, TableLayout } from './sheetLayout.js';

interface Column {
  name: string;
  type: string; // udt_name, mis. int4, int8, text, varchar, date, timestamptz, jsonb, bool, uuid
  nullable: boolean;
  defaultEmptyText: boolean; // DEFAULT '' -> sel kosong dibaca sebagai ''
}
interface Table {
  name: string;
  columns: Column[];
  orderBy: string;
  sequences: { column: string; sequence: string }[];
  entries: LayoutEntry[]; // kolom tab spreadsheet (urutan & label)
  layout: TableLayout;
}

/** Susun kolom tab: tata letak khusus (sheetLayout.ts) atau 1 kolom tabel = 1 kolom tab. */
function buildEntries(t: Table): LayoutEntry[] {
  const L = t.layout;
  const entries: LayoutEntry[] = [
    ...(L.prepend ?? []),
    ...(L.entries
      ? L.entries
      : t.columns.flatMap((c): LayoutEntry[] =>
          L.expandJson?.[c.name] ? L.expandJson[c.name].map((j) => ({ label: j.label, json: c.name, key: j.key, format: j.format })) : [{ label: c.name, column: c.name }]
        ))
  ];
  // Pengaman: kolom tabel yang tidak tercakup tetap ikut disimpan (tidak ada data hilang).
  const covered = new Set(entries.flatMap((e) => ('column' in e ? [e.column] : 'json' in e ? [e.json] : [])));
  for (const c of t.columns) if (!covered.has(c.name)) entries.push({ label: c.name, column: c.name });
  return entries;
}
const DMY = /^(\d{2})-(\d{2})-(\d{4})$/;
const toIsoDate = (v: string) => {
  const m = DMY.exec(v.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : v;
};

type WithLock = <T>(fn: () => Promise<T>) => Promise<T>;

const TEXT_TYPES = new Set(['text', 'varchar', 'bpchar', 'uuid']);
const quoteTab = (t: string) => `'${t.replace(/'/g, "''")}'`;
const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;
const serialToDate = (n: number) => new Date(Math.round((n - 25569) * 86400000));

export class SheetSync {
  private tables: Table[] = [];
  private sheetIds = new Map<string, number>();
  private dirty = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private chain: Promise<void> = Promise.resolve();
  private knownModified = '';
  private retryDelay = 0;
  private stopped = false;
  public lastSyncAt: string | null = null;
  public lastError: string | null = null;
  public lastLoadedAt: string | null = null;

  constructor(private db: PGlite, private withLock: WithLock) {}

  get pending() {
    return this.dirty.size;
  }

  async start() {
    this.tables = await this.readMeta();
    await this.ensureTabs();
    await this.withLock(() => this.loadAll());
    await this.installTriggers();
    if (this.dirty.size) await this.flushNow();
    this.knownModified = await this.modifiedTime();
    if (ENV.SHEETS_POLL_MS > 0) {
      this.pollTimer = setInterval(() => this.checkExternalEdits().catch((e) => console.warn('[Sheets] Cek perubahan gagal:', e.message)), ENV.SHEETS_POLL_MS);
      this.pollTimer.unref();
    }
  }

  async stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    await this.flushNow();
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.dirty.size)
      throw new Error(`Perubahan tabel ${[...this.dirty].join(', ')} GAGAL disimpan ke spreadsheet: ${this.lastError}`);
  }

  // ------------------------------------------------------------- metadata
  private async readMeta(): Promise<Table[]> {
    const cols = await this.db.query<any>(`
      SELECT c.table_name, c.column_name, c.udt_name, c.is_nullable = 'YES' AS nullable, COALESCE(c.column_default,'') AS def
      FROM information_schema.columns c
      JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE' AND c.table_name NOT LIKE '\\_%'
      ORDER BY c.table_name, c.ordinal_position`);
    const pks = await this.db.query<any>(`
      SELECT tc.table_name, string_agg(quote_ident(k.column_name), ',' ORDER BY k.ordinal_position) AS cols
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage k ON k.constraint_name = tc.constraint_name AND k.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY' GROUP BY tc.table_name`);
    const pkMap = new Map(pks.rows.map((r: any) => [r.table_name, r.cols]));
    const map = new Map<string, Table>();
    for (const r of cols.rows) {
      const t: Table = map.get(r.table_name) ?? { name: r.table_name, columns: [], orderBy: '', sequences: [], entries: [], layout: SHEET_LAYOUTS[r.table_name] ?? {} };
      t.columns.push({ name: r.column_name, type: r.udt_name, nullable: r.nullable, defaultEmptyText: /^''::/.test(r.def) });
      const seq = /^nextval\('([^']+)'/.exec(r.def);
      if (seq) t.sequences.push({ column: r.column_name, sequence: seq[1] });
      map.set(r.table_name, t);
    }
    for (const t of map.values()) {
      t.orderBy = t.layout.orderBy || (pkMap.get(t.name) || t.columns.map((c) => ident(c.name)).join(',')).split(',').map((c: string) => 't.' + c).join(',');
      t.entries = buildEntries(t);
    }
    return [...map.values()];
  }

  private async ensureTabs() {
    const { sheets } = google();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId(), fields: 'sheets(properties(sheetId,title))' });
    this.sheetIds = new Map((meta.data.sheets || []).map((s) => [s.properties!.title!, s.properties!.sheetId!]));
    const missing = this.tables.filter((t) => !this.sheetIds.has(t.name));
    if (!missing.length) return;
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId(),
      requestBody: {
        requests: missing.map((t) => ({ addSheet: { properties: { title: t.name, gridProperties: { frozenRowCount: 1 } } } }))
      }
    });
    res.data.replies?.forEach((r, i) => this.sheetIds.set(missing[i].name, r.addSheet!.properties!.sheetId!));
    console.log(`📄 Tab baru di spreadsheet: ${missing.map((t) => t.name).join(', ')}`);
  }

  private async installTriggers() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS _sync_dirty (table_name text PRIMARY KEY);
      CREATE OR REPLACE FUNCTION _sync_mark() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN INSERT INTO _sync_dirty VALUES (TG_TABLE_NAME) ON CONFLICT DO NOTHING; RETURN NULL; END $$;
      ${this.tables
        .map((t) => `DROP TRIGGER IF EXISTS _sync_${t.name} ON ${ident(t.name)};
        CREATE TRIGGER _sync_${t.name} AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON ${ident(t.name)} FOR EACH STATEMENT EXECUTE FUNCTION _sync_mark();`)
        .join('\n')}`);
  }

  // ------------------------------------------------------------- load (Sheets -> DB)
  private fromCell(col: Column, v: any): any {
    if (v === undefined || v === null || v === '') {
      if (TEXT_TYPES.has(col.type) && col.type !== 'uuid' && (!col.nullable || col.defaultEmptyText)) return '';
      return null;
    }
    switch (col.type) {
      case 'json':
      case 'jsonb':
        if (typeof v !== 'string') return v;
        try {
          return JSON.parse(v);
        } catch {
          throw new Error(`Isi JSON tidak valid pada kolom ${col.name}: ${String(v).slice(0, 60)}`);
        }
      case 'bool':
        return typeof v === 'boolean' ? v : ['true', 't', '1', 'ya', 'yes'].includes(String(v).trim().toLowerCase());
      case 'date':
        return typeof v === 'number' ? serialToDate(v).toISOString().slice(0, 10) : toIsoDate(String(v));
      case 'timestamp':
      case 'timestamptz':
        return typeof v === 'number' ? serialToDate(v).toISOString() : String(v);
      default:
        return TEXT_TYPES.has(col.type) ? String(v) : v;
    }
  }

  private async loadAll() {
    const { sheets } = google();
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId(),
      ranges: this.tables.map((t) => quoteTab(t.name)),
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'SERIAL_NUMBER'
    });

    const counts: string[] = [];
    await this.db.exec("BEGIN; SET LOCAL session_replication_role = replica;");
    try {
      // Kosongkan semua tabel sekaligus (urutan relasi tidak berpengaruh dalam mode replica).
      await this.db.exec(`TRUNCATE ${this.tables.map((t) => ident(t.name)).join(',')}`);
      for (const [i, t] of this.tables.entries()) {
        const values = res.data.valueRanges?.[i]?.values || [];
        const header = (values[0] || []).map((h: any) => String(h).trim());
        // Tab baru/kosong atau kolom tidak sesuai tata letak: tulis ulang tab saat start.
        if (header.join('|') !== t.entries.map((e) => e.label).join('|')) this.dirty.add(t.name);
        // Cocokkan kolom tab dengan label tata letak; tab lama berjudul nama kolom asli juga terbaca.
        const pos = (label: string) => header.indexOf(label);
        const colEntries = t.columns
          .map((c) => {
            const e = t.entries.find((x) => 'column' in x && x.column === c.name);
            const i = e ? pos(e.label) : -1;
            return { c, i: i >= 0 ? i : pos(c.name) };
          })
          .filter((x) => x.i >= 0);
        const jsonEntries = t.entries.filter((e): e is Extract<LayoutEntry, { json: string }> => 'json' in e && pos(e.label) >= 0);
        const jsonCols = t.columns.filter((c) => jsonEntries.some((e) => e.json === c.name) && !colEntries.some((x) => x.c.name === c.name));
        const cols = [...colEntries.map((x) => x.c), ...jsonCols];
        const rows: Record<string, any>[] = [];
        for (const raw of values.slice(1)) {
          if (!raw || raw.every((v: any) => v === '' || v === undefined || v === null)) continue;
          const obj: Record<string, any> = {};
          for (const { c, i } of colEntries) obj[c.name] = this.fromCell(c, raw[i]);
          for (const c of jsonCols) {
            const o: Record<string, any> = {};
            for (const e of jsonEntries.filter((x) => x.json === c.name)) {
              let v: any = raw[pos(e.label)];
              v = v === undefined || v === null ? '' : typeof v === 'number' && e.format === 'dmy' ? serialToDate(v).toISOString().slice(0, 10) : String(v);
              o[e.key] = e.format === 'dmy' ? (v ? toIsoDate(v) : null) : v;
            }
            // Semua kosong -> {} (sama seperti nilai bawaan kolom), bukan objek berisi kunci kosong.
            obj[c.name] = Object.values(o).every((v) => v === '' || v === null) ? {} : o;
          }
          rows.push(obj);
        }
        if (rows.length && cols.length) {
          const list = cols.map((c) => ident(c.name)).join(',');
          await this.db.query(`INSERT INTO ${ident(t.name)} (${list}) SELECT ${list} FROM jsonb_populate_recordset(NULL::${ident(t.name)}, $1::jsonb)`, [JSON.stringify(rows)]);
        }
        for (const s of t.sequences)
          await this.db.query(`SELECT setval($1, GREATEST(COALESCE((SELECT MAX(${ident(s.column)}) FROM ${ident(t.name)}), 0), 1), (SELECT COUNT(*) > 0 FROM ${ident(t.name)}))`, [s.sequence]);
        if (rows.length) counts.push(`${t.name}=${rows.length}`);
      }
      await this.db.exec('COMMIT');
    } catch (e) {
      await this.db.exec('ROLLBACK');
      throw e;
    }
    await this.db.exec('DELETE FROM _sync_dirty').catch(() => undefined);
    this.lastLoadedAt = new Date().toISOString();
    console.log(`📊 Data dimuat dari Google Spreadsheet${counts.length ? ': ' + counts.join(', ') : ' (masih kosong)'}`);
  }

  // ------------------------------------------------------------- save (DB -> Sheets)
  /** Dipanggil setelah setiap COMMIT / autocommit. Murah: hanya membaca tabel penanda. */
  async collectDirty() {
    const r = await this.db.query<{ table_name: string }>('DELETE FROM _sync_dirty RETURNING table_name');
    if (!r.rows.length) return;
    for (const row of r.rows) this.dirty.add(row.table_name);
    this.schedule(ENV.SHEETS_FLUSH_DELAY_MS);
  }

  private schedule(delay: number) {
    if (this.timer || this.stopped) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flushNow().catch(() => undefined);
    }, delay);
  }

  /** Tulis semua perubahan tertunda sekarang (berurutan, tidak tumpang tindih). */
  flushNow(): Promise<void> {
    this.chain = this.chain.then(() => this.flush());
    return this.chain;
  }

  private toCell(col: Column, v: any): any {
    if (v === null || v === undefined) return {};
    if (typeof v === 'boolean') return { userEnteredValue: { boolValue: v } };
    if (typeof v === 'number') return { userEnteredValue: { numberValue: v } };
    if ((col.type === 'int8' || col.type === 'numeric') && /^-?\d+(\.\d+)?$/.test(v) && Number.isSafeInteger(Math.trunc(Number(v))))
      return { userEnteredValue: { numberValue: Number(v) } };
    return { userEnteredValue: { stringValue: String(v) } };
  }

  private async exportTable(t: Table) {
    const textCol: Column = { name: '', type: 'text', nullable: true, defaultEmptyText: false };
    const select = t.entries
      .map((e, i) => {
        let expr: string;
        if ('derived' in e) expr = e.derived;
        else if ('json' in e) {
          const v = `(t.${ident(e.json)}->>'${e.key.replace(/'/g, "''")}')`;
          expr = e.format === 'dmy' ? `CASE WHEN ${v} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN to_char(${v}::date,'DD-MM-YYYY') ELSE ${v} END` : v;
        } else {
          const c = t.columns.find((x) => x.name === e.column)!;
          if (e.format === 'dmy' && c.type === 'date') expr = `to_char(t.${ident(c.name)},'DD-MM-YYYY')`;
          else expr = ['date', 'timestamp', 'timestamptz', 'json', 'jsonb', 'int8', 'numeric'].includes(c.type) ? `t.${ident(c.name)}::text` : `t.${ident(c.name)}`;
        }
        return `${expr} AS e${i}`;
      })
      .join(',');
    const { rows } = await this.db.query<any>(`SELECT ${select} FROM ${ident(t.name)} t ORDER BY ${t.orderBy}`);
    const types = t.entries.map((e) => ('column' in e && !e.format ? t.columns.find((x) => x.name === e.column)! : textCol));
    const header = { values: t.entries.map((e) => ({ userEnteredValue: { stringValue: e.label }, userEnteredFormat: { textFormat: { bold: true } } })) };
    return [header, ...rows.map((r: any) => ({ values: t.entries.map((_, i) => this.toCell(types[i], r['e' + i])) }))];
  }

  private async flush() {
    if (!this.dirty.size) return;
    const names = [...this.dirty];
    this.dirty.clear();
    try {
      // Ambil potret data yang konsisten (di dalam kunci), lalu kirim ke Google di luar kunci.
      const snapshot = await this.withLock(async () => {
        const out: { table: Table; rows: any[] }[] = [];
        for (const name of names) {
          const table = this.tables.find((t) => t.name === name);
          if (table) out.push({ table, rows: await this.exportTable(table) });
        }
        return out;
      });
      const requests: any[] = [];
      for (const { table, rows } of snapshot) {
        const sheetId = this.sheetIds.get(table.name);
        if (sheetId === undefined) throw new Error(`Tab "${table.name}" tidak ditemukan di spreadsheet.`);
        requests.push({
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { rowCount: Math.max(rows.length + 50, 100), columnCount: Math.max(table.entries.length, 26), frozenRowCount: 1 } },
            fields: 'gridProperties(rowCount,columnCount,frozenRowCount)'
          }
        });
        // Range = seluruh tab: sel di luar baris baru ikut dikosongkan (atomik dengan penulisan).
        requests.push({ updateCells: { range: { sheetId }, rows, fields: 'userEnteredValue,userEnteredFormat.textFormat.bold' } });
        if (table.layout.autoResize)
          requests.push({ autoResizeDimensions: { dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: table.entries.length } } });
      }
      await google().sheets.spreadsheets.batchUpdate({ spreadsheetId: spreadsheetId(), requestBody: { requests } });
      this.lastSyncAt = new Date().toISOString();
      this.lastError = null;
      this.retryDelay = 0;
      this.knownModified = await this.modifiedTime();
    } catch (e: any) {
      for (const n of names) this.dirty.add(n);
      this.lastError = e.message;
      this.retryDelay = Math.min((this.retryDelay || 2000) * 2, 60000);
      console.error(`[Sheets] Gagal menyimpan (${names.join(', ')}), dicoba lagi dalam ${this.retryDelay / 1000} detik:`, e.message);
      if (/not found|Unable to parse range|tidak ditemukan/i.test(e.message)) await this.ensureTabs().catch(() => undefined);
      this.schedule(this.retryDelay);
    }
  }

  // ------------------------------------------------------------- edit manual
  private async modifiedTime(): Promise<string> {
    try {
      const r = await google().drive.files.get({ fileId: spreadsheetId(), fields: 'modifiedTime', supportsAllDrives: true });
      return r.data.modifiedTime || '';
    } catch {
      return '';
    }
  }

  private async checkExternalEdits() {
    if (this.dirty.size || this.timer) return;
    const current = await this.modifiedTime();
    if (!current || !this.knownModified || current <= this.knownModified) return;
    await this.withLock(async () => {
      if (this.dirty.size) return;
      console.log('🔄 Spreadsheet diubah di luar aplikasi, memuat ulang data...');
      await this.loadAll();
    });
    this.knownModified = current;
  }
}
