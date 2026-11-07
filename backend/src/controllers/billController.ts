import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function getAllBills(req: Request, res: Response) {
  try {
    const { status, month, year, search } = req.query;
    let sql = 'SELECT * FROM bills WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (month) {
      params.push(month);
      sql += ` AND month_name ILIKE $${params.length}`;
    }

    if (year) {
      params.push(year);
      sql += ` AND year = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (resident_name ILIKE $${params.length} OR house_unit ILIKE $${params.length})`;
    }

    sql += ' ORDER BY year DESC, month_index DESC, id DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBillsByResident(req: Request, res: Response) {
  try {
    const { residentId } = req.params;
    const result = await query(
      'SELECT * FROM bills WHERE resident_id = $1 ORDER BY year DESC, month_index DESC',
      [residentId]
    );

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBillsSummary(req: Request, res: Response) {
  try {
    const totalCountRes = await query('SELECT COUNT(*) as total_bills FROM bills');
    const lunasRes = await query("SELECT COUNT(*) as total_lunas, COALESCE(SUM(amount), 0) as amount_lunas FROM bills WHERE status = 'LUNAS'");
    const menunggakRes = await query("SELECT COUNT(*) as total_menunggak, COALESCE(SUM(amount), 0) as amount_menunggak FROM bills WHERE status = 'MENUNGGAK'");
    const pendingRes = await query("SELECT COUNT(*) as total_pending FROM bills WHERE status = 'PENDING_VERIFIKASI'");

    res.json({
      success: true,
      data: {
        totalBills: parseInt(totalCountRes.rows[0].total_bills, 10),
        totalLunas: parseInt(lunasRes.rows[0].total_lunas, 10),
        amountLunas: parseInt(lunasRes.rows[0].amount_lunas, 10),
        totalMenunggak: parseInt(menunggakRes.rows[0].total_menunggak, 10),
        amountMenunggak: parseInt(menunggakRes.rows[0].amount_menunggak, 10),
        totalPending: parseInt(pendingRes.rows[0].total_pending, 10)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function payBill(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { paymentChannel = 'QRIS', transactionRef } = req.body;

    const ref = transactionRef || `PAY-${Date.now()}`;
    const result = await query(
      `UPDATE bills
       SET status = 'LUNAS',
           paid_at = CURRENT_TIMESTAMP,
           payment_channel = $1,
           transaction_ref = $2
       WHERE id = $3
       RETURNING *`,
      [paymentChannel, ref, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tagihan tidak ditemukan.' });
    }

    const paidBill = result.rows[0];

    // Otomatis catat ke kas masuk (Buku Kas)
    await query(
      `INSERT INTO cash_transactions (type, category, amount, title, description, month_year, recorded_by, receipt_code)
       VALUES ('MASUK', 'Iuran Warga', $1, $2, $3, $4, 'Sistem Pembayaran Otomatis', $5)`,
      [
        paidBill.amount,
        `Iuran ${paidBill.month_name} - ${paidBill.resident_name}`,
        `Pembayaran via ${paymentChannel} unit ${paidBill.house_unit}`,
        paidBill.month_name,
        ref
      ]
    );

    res.json({
      success: true,
      message: 'Pembayaran iuran berhasil diproses dan dicatat ke kas RT.',
      data: paidBill
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function generateMonthlyBills(req: Request, res: Response) {
  try {
    const { monthName, monthIndex, year = 2026, amount = 140000 } = req.body;

    if (!monthName || !monthIndex) {
      return res.status(400).json({ success: false, message: 'monthName dan monthIndex wajib diisi.' });
    }

    const residentsRes = await query('SELECT id, full_name, block_number, house_number, phone_number FROM residents WHERE is_active = true');
    const residents = residentsRes.rows;

    let generatedCount = 0;

    for (const resident of residents) {
      const houseUnit = `${resident.block_number} No. ${resident.house_number}`;
      const vaNumber = `1280${resident.phone_number.replace(/\D/g, '')}`;

      const exist = await query(
        'SELECT id FROM bills WHERE resident_id = $1 AND month_index = $2 AND year = $3',
        [resident.id, monthIndex, year]
      );

      if (exist.rows.length === 0) {
        await query(
          `INSERT INTO bills (resident_id, resident_name, house_unit, month_name, month_index, year, amount, status, va_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'MENUNGGAK', $8)`,
          [resident.id, resident.full_name, houseUnit, monthName, monthIndex, year, amount, vaNumber]
        );
        generatedCount++;
      }
    }

    res.json({
      success: true,
      message: `Tagihan bulan ${monthName} berhasil dibuat untuk ${generatedCount} warga.`,
      generatedCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
