import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function getAllCashTransactions(req: Request, res: Response) {
  try {
    const { type, category, monthYear } = req.query;
    let sql = 'SELECT * FROM cash_transactions WHERE 1=1';
    const params: any[] = [];

    if (type) {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    if (monthYear) {
      params.push(monthYear);
      sql += ` AND month_year = $${params.length}`;
    }

    sql += ' ORDER BY date DESC, id DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCashSummary(req: Request, res: Response) {
  try {
    const incomeRes = await query("SELECT COALESCE(SUM(amount), 0) as total_income FROM cash_transactions WHERE type = 'MASUK'");
    const expenseRes = await query("SELECT COALESCE(SUM(amount), 0) as total_expense FROM cash_transactions WHERE type = 'KELUAR'");

    const totalIncome = parseInt(incomeRes.rows[0].total_income, 10);
    const totalExpense = parseInt(expenseRes.rows[0].total_expense, 10);
    const currentBalance = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        currentBalance
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCashTransaction(req: AuthRequest, res: Response) {
  try {
    const { type, category, amount, title, description, date, monthYear, receiptCode } = req.body;

    if (!type || !category || !amount || !title) {
      return res.status(400).json({ success: false, message: 'Tipe, kategori, jumlah, dan judul wajib diisi.' });
    }

    const recordedBy = req.user?.username ? `Pengurus (${req.user.username})` : 'Bendahara RT 013';

    const insertSql = `
      INSERT INTO cash_transactions (type, category, amount, title, description, date, month_year, recorded_by, receipt_code)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9)
      RETURNING *
    `;

    const result = await query(insertSql, [
      type,
      category,
      amount,
      title,
      description || '',
      date || null,
      monthYear || 'November 2026',
      recordedBy,
      receiptCode || `KAS-${Date.now()}`
    ]);

    res.status(201).json({ success: true, message: 'Transaksi kas berhasil dicatat.', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
