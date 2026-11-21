// =============================================================================
// Database Purimas: PostgreSQL tertanam (PGlite) + penyimpanan permanen di
// Google Spreadsheet. Antarmuka `pool`/`query` sama dengan driver `pg`, sehingga
// seluruh SQL di portal.ts tetap dipakai apa adanya.
//
// - Saat start: schema.sql dijalankan, lalu isi setiap tab spreadsheet dimuat.
// - Setiap transaksi yang selesai (COMMIT) menandai tabel yang berubah; tabel
//   tersebut kemudian ditulis ulang ke tab spreadsheet-nya (sinkron otomatis).
// - DB_MODE=memory / file: tanpa spreadsheet (untuk pengujian terisolasi).
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AsyncLocalStorage } from 'node:async_hooks';
import { PGlite } from '@electric-sql/pglite';
import { ENV } from './env.js';
import { SheetSync } from '../database/sheetSync.js';

// Samakan hasil tipe data dengan driver `pg` (node-postgres) yang dipakai sebelumnya.
const pgCompatibleParsers = {
  20: (v: string) => v, // BIGINT / COUNT(*) -> string, seperti pg
  1082: (v: string) => {
    // DATE -> Date tengah malam waktu lokal, seperti pg-types
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : v;
  }
};

class Lock {
  private queue: (() => void)[] = [];
  private held = false;
  acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const grant = () => {
        this.held = true;
        let released = false;
        resolve(() => {
          if (released) return;
          released = true;
          const next = this.queue.shift();
          if (next) next();
          else this.held = false;
        });
      };
      if (this.held) this.queue.push(grant);
      else grant();
    });
  }
}

const lock = new Lock();
const holder = new AsyncLocalStorage<boolean>();
let db: PGlite | null = null;
let ready: Promise<void> | null = null;
export let sync: SheetSync | null = null;

function findSchema(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const p of [path.join(here, '..', 'database', 'schema.sql'), path.join(here, '..', '..', 'src', 'database', 'schema.sql')])
    if (fs.existsSync(p)) return p;
  throw new Error('schema.sql tidak ditemukan.');
}

async function boot() {
  db = await PGlite.create(ENV.DB_MODE === 'file' ? { dataDir: ENV.DB_FILE_DIR, parsers: pgCompatibleParsers } : { parsers: pgCompatibleParsers });
  await db.exec(fs.readFileSync(findSchema(), 'utf8'));
  if (ENV.DB_MODE === 'sheets') {
    sync = new SheetSync(db, withLock);
    await sync.start();
  }
}

/** Siapkan database (skema + muat data spreadsheet). Aman dipanggil berulang. */
export function ensureReady(): Promise<void> {
  if (!ready) ready = boot().catch((e) => { ready = null; throw e; });
  return ready;
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (holder.getStore()) return fn(); // sudah memegang kunci (mis. di dalam transaksi)
  const release = await lock.acquire();
  try {
    return await holder.run(true, fn);
  } finally {
    release();
  }
}

async function run(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number; fields: any[]; affectedRows?: number }> {
  const res = await db!.query<any>(text, params ?? []);
  return { ...res, rowCount: res.affectedRows ?? res.rows.length };
}

async function afterWrite() {
  if (sync && db && !db.isInTransaction()) await sync.collectDirty();
}

export const query = async (text: string, params?: any[]) => {
  await ensureReady();
  return withLock(async () => {
    const res = await run(text, params);
    await afterWrite();
    return res;
  });
};

/** Pengganti pg.Pool: satu koneksi tertanam, transaksi diserialkan. */
export const pool = {
  query,
  async connect() {
    await ensureReady();
    if (holder.getStore()) {
      // Dipanggil dari dalam konteks yang sudah memegang kunci.
      return { query: run, release: () => undefined };
    }
    const release = await lock.acquire();
    let done = false;
    return {
      query: (text: string, params?: any[]) => holder.run(true, () => run(text, params)),
      release: () => {
        if (done) return;
        done = true;
        (async () => {
          try {
            if (db!.isInTransaction()) await db!.query('ROLLBACK');
            await holder.run(true, afterWrite);
          } catch (e) {
            console.error('[DB] Gagal merapikan transaksi:', e);
          } finally {
            release();
          }
        })();
      }
    };
  },
  /** Tutup database setelah semua transaksi selesai dan perubahan tersimpan ke spreadsheet. */
  async end() {
    if (!db) return;
    // 1) Tunggu transaksi/release yang masih berjalan (mis. tepat setelah c.release()) dan catat tabel yang berubah.
    await withLock(afterWrite);
    // 2) Simpan semua perubahan ke spreadsheet (flush mengambil kunci sendiri).
    if (sync) await sync.stop();
    // 3) Tutup database.
    const release = await lock.acquire();
    try {
      if (!db) return;
      await db.close();
      db = null;
      ready = null;
      sync = null;
    } finally {
      release();
    }
  }
};
