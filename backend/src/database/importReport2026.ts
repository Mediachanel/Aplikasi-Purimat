import { pool } from '../config/db.js';
// Transcribed from the two user-supplied reports dated 07 November 2026.
// Historical bill status and cash recap are imported independently to avoid double counting.
const paid: Record<string, number> = { a1: 12, a2: 12, a3: 8, a4: 10, a5: 6, a6: 10, a7: 12, a8: 11, a9: 10, a10: 10, a11: 11, a12: 10, a13: 7, b1: 10, b2: 11, b3: 12, b4: 10, b5: 12, b6: 10, b7: 11, b8: 10, b9: 10, b10: 11, b11: 8 };
const report = 'Laporan RT 013/RW 003 per 07 November 2026';
const cash: [
    string,
    string,
    number,
    string
][] = [
    ['MASUK', 'Saldo Awal', 4163976, 'Sisa saldo kas 2025'],
    ['MASUK', 'Iuran Warga', 36600000, 'Rekap iuran Purimas tahun 2026'],
    ['MASUK', 'Tunggakan 2025', 1050000, 'Penerimaan tunggakan iuran tahun 2025'],
    ['MASUK', 'Sampah Ranting', 1200000, 'Iuran buang sampah ranting'],
    ['MASUK', 'Kegiatan 17 Agustus', 2300000, 'Iuran 17 Agustus'],
    ['MASUK', 'Lain-lain', 2861000, 'Penerimaan lain-lain'],
    ['KELUAR', 'Keamanan', 27500000, 'Rekap iuran keamanan periode 2026'],
    ['KELUAR', 'Sampah', 6325000, 'Rekap iuran sampah periode 2026'],
    ['KELUAR', 'Listrik', 2751503, 'Rekap iuran listrik periode 2026'],
    ['KELUAR', 'RW 03', 1080000, 'Rekap iuran RW 03 periode 2026'],
    ['KELUAR', 'Pengeluaran Lain', 4751000, 'Rekap pengeluaran lain-lain periode 2026']
];
const c = await pool.connect();
try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(13004)');
    if ((await c.query("SELECT 1 FROM portal_settings WHERE key='report_2026_11_07_imported'")).rows.length)
        throw Error('Report already imported; refusing duplicate entries.');
    if (Number((await c.query('SELECT COUNT(*) FROM bills')).rows[0].count) || Number((await c.query('SELECT COUNT(*) FROM cash_transactions')).rows[0].count))
        throw Error('Finance tables must be empty before the first verified report import.');
    let paidAmount = 0, pendingAmount = 0;
    for (const [unit, months] of Object.entries(paid)) {
        const r = (await c.query('SELECT r.* FROM residents r JOIN users u ON u.resident_id=r.id WHERE u.username=$1', ['blok_' + unit])).rows[0];
        if (!r)
            throw Error('Household missing: ' + unit);
        for (let m = 1; m <= 12; m++) {
            const status = m <= months ? 'LUNAS' : 'BELUM_BAYAR';
            if (status === 'LUNAS')
                paidAmount += 150000;
            else
                pendingAmount += 150000;
            await c.query(`INSERT INTO bills(resident_id,resident_name,house_unit,month_name,month_index,year,amount,status,due_date,paid_at,transaction_ref,payment_channel,bank_name,source_report) VALUES($1,$2,$2,$3,$4,2026,150000,$5,$6,NULL,$7,$8,'',$9)`, [r.id, `${r.block_number} No. ${r.house_number}`, new Date(2026, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), m, status, null, status === 'LUNAS' ? 'REKAP-20261107' : null, status === 'LUNAS' ? 'Rekap laporan bendahara' : null, report]);
        }
    }
    if (paidAmount !== 36600000 || pendingAmount !== 6600000)
        throw Error('Bill totals do not reconcile.');
    let income = 0, expense = 0;
    for (const [i, [type, category, amount, title]] of cash.entries()) {
        if (type === 'MASUK')
            income += amount;
        else
            expense += amount;
        await c.query(`INSERT INTO cash_transactions(type,category,amount,title,description,date,month_year,recorded_by,receipt_code) VALUES($1,$2,$3,$4,$5,$6,$7,'Laporan bendahara',$8)`, [type, category, amount, title, `${report}. Dicatat sebagai rekap; tanggal setiap transaksi belum tersedia.`, category === 'Saldo Awal' ? '2026-01-01' : '2026-11-07', category === 'Saldo Awal' ? 'Januari 2026' : 'November 2026', `REKAP-20261107-${i + 1}`]);
    }
    if (income !== 48174976 || expense !== 42407503 || income - expense !== 5767473)
        throw Error('Cash totals do not reconcile.');
    await c.query("INSERT INTO portal_settings VALUES('report_2026_11_07_imported','true'),('finance_as_of','\"2026-11-07\"')");
    await c.query("UPDATE portal_settings SET value='true' WHERE key='finance_initialized'");
    await c.query('COMMIT');
    console.log(JSON.stringify({ households: 24, bills: 288, paidMonths: 244, pendingMonths: 44, paidAmount, pendingAmount, income, expense, balance: income - expense }));
}
catch (e) {
    await c.query('ROLLBACK');
    throw e;
}
finally {
    c.release();
    await pool.end();
}
