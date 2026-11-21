import { pool } from '../config/db.js';
// Rekap status iuran bendahara per 16 November 2026: Rp 150.000/bulan, bulan 1..N lunas per rumah.
// Membuat 288 tagihan 2026 (24 rumah x 12 bulan). Buku kas TIDAK diubah: saldo dan transaksi kas
// dicatat terpisah oleh bendahara agar tidak terjadi pencatatan ganda.
const paid: Record<string, number> = { a1: 12, a2: 12, a3: 8, a4: 10, a5: 12, a6: 11, a7: 12, a8: 11, a9: 10, a10: 12, a11: 11, a12: 10, a13: 7, b1: 11, b2: 11, b3: 12, b4: 10, b5: 12, b6: 10, b7: 11, b8: 10, b9: 10, b10: 11, b11: 8 };
const report = 'Rekap iuran RT 013/RW 003 per 16 November 2026';
const amount = 150000;
const c = await pool.connect();
try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(13005)');
    if ((await c.query("SELECT 1 FROM portal_settings WHERE key='iuran_2026_11_16_imported'")).rows.length)
        throw Error('Rekap 16 November sudah diimpor; tidak mengulang.');
    if (Number((await c.query('SELECT COUNT(*) FROM bills WHERE year=2026')).rows[0].count))
        throw Error('Sudah ada tagihan 2026. Periksa data sebelum mengimpor rekap.');
    let paidAmount = 0, pendingAmount = 0, paidMonths = 0;
    for (const [unit, months] of Object.entries(paid)) {
        const r = (await c.query('SELECT r.* FROM residents r JOIN users u ON u.resident_id=r.id WHERE u.username=$1', ['blok_' + unit])).rows[0];
        if (!r)
            throw Error('Rumah tidak ditemukan: ' + unit + ' (jalankan provisionReal.ts dulu)');
        for (let m = 1; m <= 12; m++) {
            const lunas = m <= months;
            if (lunas) { paidAmount += amount; paidMonths++; }
            else pendingAmount += amount;
            await c.query(`INSERT INTO bills(resident_id,resident_name,house_unit,month_name,month_index,year,amount,status,due_date,paid_at,transaction_ref,payment_channel,bank_name,source_report) VALUES($1,$2,$2,$3,$4,2026,$5,$6,NULL,NULL,$7,$8,'',$9)`,
                [r.id, `${r.block_number} No. ${r.house_number}`, new Date(2026, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), m, amount, lunas ? 'LUNAS' : 'BELUM_BAYAR', lunas ? 'REKAP-20261116' : null, lunas ? 'Rekap laporan bendahara' : null, report]);
        }
    }
    if (paidMonths !== 254 || paidAmount !== 38100000 || pendingAmount !== 5100000)
        throw Error('Total tidak cocok dengan rekap 16 November 2026.');
    await c.query("INSERT INTO portal_settings VALUES('iuran_2026_11_16_imported','true')");
    await c.query('COMMIT');
    console.log(JSON.stringify({ households: 24, bills: 288, paidMonths, pendingMonths: 288 - paidMonths, paidAmount, pendingAmount }));
}
catch (e) {
    await c.query('ROLLBACK');
    throw e;
}
finally {
    c.release();
    await pool.end();
}
