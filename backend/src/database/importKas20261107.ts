import { pool } from '../config/db.js';
// Rincian "Update Laporan Keuangan Purimas Tirtajaya Periode Tahun 2026" per 07 November 2026.
// Tanggal transaksi historis tidak tersedia di laporan, sehingga dicatat pada tanggal laporan
// (saldo awal: 1 Januari 2026); periode/tanggal catatan bendahara disimpan di deskripsi.
type Row = [type: 'MASUK' | 'KELUAR', category: string, amount: number, title: string, note?: string];
const report = 'Laporan Keuangan Purimas Tirtajaya per 07 November 2026';
const months2 = ['Desember 2025/ Januari 2026', 'Januari/ Februari 2026', 'Februari/ Maret 2026', 'Maret/ April 2026', 'April/ Mei 2026', 'Mei/ Juni 2026', 'Juni/ Juli 2026', 'Juli/ Agustus 2026', 'Agustus/ September 2026', 'September/ Oktober 2026', 'Oktober/ November 2026'];
const listrik = [219108, 210094, 198073, 226366, 225119, 246153, 270193, 289726, 288473, 280711, 297487];
const rwMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const rows: Row[] = [
    // A. UANG MASUK
    ['MASUK', 'Saldo Awal', 4163976, 'Sisa saldo kas 2025', 'Update 17 Januari 2026'],
    ['MASUK', 'Iuran Warga', 36600000, 'Iuran Purimas periode tahun 2026', 'Rekap iuran warga s.d. 07 November 2026'],
    ['MASUK', 'Tunggakan 2025', 1050000, 'Tunggakan iuran tahun 2025'],
    ['MASUK', 'Sampah Ranting', 1200000, 'Iuran buang sampah ranting'],
    ['MASUK', 'Kegiatan 17 Agustus', 2300000, 'Iuran 17-an'],
    ['MASUK', 'Lain-lain', 300000, 'Parkir Bus A8', 'Catatan bendahara: 24 Februari 2026'],
    ['MASUK', 'Lain-lain', 300000, 'Parkir Bus A8', 'Catatan bendahara: 10 April 2026'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 05 April 2026'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 02 Mei 2026'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 09 Juni 2026'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 01 Juli 2026'],
    ['MASUK', 'Lain-lain', 1361000, 'Uang Pembangunan', 'Catatan bendahara: 22 Juli 2026'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 01 Agustus 2026'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 01 Agustus 2026'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 01 September 2025 (tertulis di laporan)'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 01 Oktober 2025 (tertulis di laporan)'],
    ['MASUK', 'Lain-lain', 100000, 'Parkir Mobil B2', 'Catatan bendahara: 01 November 2025 (tertulis di laporan)'],
    // B. UANG KELUAR
    ...months2.map((m): Row => ['KELUAR', 'Keamanan', 2500000, `Iuran keamanan ${m}`]),
    ...months2.map((m): Row => ['KELUAR', 'Sampah', 575000, `Iuran sampah ${m}`]),
    ...months2.map((m, i): Row => ['KELUAR', 'Listrik', listrik[i], `Tagihan listrik ${m}`, 'ID pelanggan 538712426073 - Ny. Minarsih']),
    ...rwMonths.map((m): Row => ['KELUAR', 'RW 03', 90000, `Iuran RW 03 ${m} 2026`]),
    ['KELUAR', 'Pengeluaran Lain', 200000, 'Februari 2026, service TV pos'],
    ['KELUAR', 'Pengeluaran Lain', 340000, 'Maret 2026, arisan ibu-ibu RW + service gerbang (28 Maret)'],
    ['KELUAR', 'Pengeluaran Lain', 1520000, 'Mei 2026, PKK RW April/Mei, buang sampah ranting, konsumsi pengaspalan', 'Catatan bendahara: pengerjaan tanggal 24 Mei 2026'],
    ['KELUAR', 'Pengeluaran Lain', 350000, 'Juni 2026, biaya jasa dan konsumsi install CCTV'],
    ['KELUAR', 'Pengeluaran Lain', 2011000, 'Agustus 2026, biaya fogging, kegiatan 17-an dan pemilihan RT', 'Catatan bendahara: transfer via Pak RT 01 Agustus Rp1.000.000; 15 Agustus Rp221.000 (beli bendera hias); 16 Agustus Rp500.000; 16 Agustus Rp300.000 (tambahan konsumsi)'],
    ['KELUAR', 'Pengeluaran Lain', 330000, 'September 2026, biaya maintenance CCTV, iuran PKK 3 bulan @30.000']
];
// Subtotal per kategori harus sama dengan laporan.
const expected: Record<string, number> = { 'Saldo Awal': 4163976, 'Iuran Warga': 36600000, 'Tunggakan 2025': 1050000, 'Sampah Ranting': 1200000, 'Kegiatan 17 Agustus': 2300000, 'Lain-lain': 2861000, Keamanan: 27500000, Sampah: 6325000, Listrik: 2751503, 'RW 03': 1080000, 'Pengeluaran Lain': 4751000 };
const c = await pool.connect();
try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(13006)');
    if ((await c.query("SELECT 1 FROM portal_settings WHERE key='kas_2026_11_07_imported'")).rows.length)
        throw Error('Laporan kas 07 November sudah diimpor; tidak mengulang.');
    if (Number((await c.query('SELECT COUNT(*) FROM cash_transactions')).rows[0].count))
        throw Error('Buku kas harus kosong sebelum impor laporan pertama.');
    const totals: Record<string, number> = {};
    for (const [, category, amount] of rows) totals[category] = (totals[category] || 0) + amount;
    for (const [k, v] of Object.entries(expected))
        if (totals[k] !== v) throw Error(`Subtotal ${k} ${totals[k]} tidak sama dengan laporan ${v}.`);
    let income = 0, expense = 0;
    for (const [i, [type, category, amount, title, note]] of rows.entries()) {
        if (type === 'MASUK') income += amount; else expense += amount;
        const opening = category === 'Saldo Awal';
        await c.query(`INSERT INTO cash_transactions(type,category,amount,title,description,date,month_year,recorded_by,receipt_code) VALUES($1,$2,$3,$4,$5,$6,$7,'Laporan bendahara',$8)`,
            [type, category, amount, title, `${report}.${note ? ' ' + note + '.' : ''} Tanggal transaksi belum tersedia; dicatat pada tanggal laporan.`, opening ? '2026-01-01' : '2026-11-07', opening ? 'Januari 2026' : 'November 2026', `LAP-20261107-${String(i + 1).padStart(3, '0')}`]);
    }
    if (income !== 48174976 || expense !== 42407503 || income - expense !== 5767473)
        throw Error('Total kas tidak cocok dengan laporan.');
    await c.query("INSERT INTO portal_settings(key,value) VALUES('kas_2026_11_07_imported','true'),('finance_as_of','\"2026-11-07\"') ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value");
    await c.query("INSERT INTO portal_settings(key,value) VALUES('finance_initialized','true') ON CONFLICT(key) DO UPDATE SET value='true'");
    await c.query('COMMIT');
    console.log(JSON.stringify({ transactions: rows.length, income, expense, balance: income - expense }));
}
catch (e) {
    await c.query('ROLLBACK');
    throw e;
}
finally {
    c.release();
    await pool.end();
}
