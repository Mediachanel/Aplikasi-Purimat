import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function getAllDocuments(req: Request, res: Response) {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY issue_date DESC, id DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createDocument(req: AuthRequest, res: Response) {
  try {
    const { title, category, fileNumber, description, issueDate, officialSignatory, contentBody } = req.body;

    if (!title || !category || !fileNumber || !contentBody) {
      return res.status(400).json({ success: false, message: 'Judul, kategori, nomor surat, dan isi dokumen wajib diisi.' });
    }

    const insertSql = `
      INSERT INTO documents (title, category, file_number, description, issue_date, official_signatory, content_body)
      VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7)
      RETURNING *
    `;

    const result = await query(insertSql, [
      title,
      category,
      fileNumber,
      description || '',
      issueDate || null,
      officialSignatory || 'Ketua RT 013 / RW 003',
      contentBody
    ]);

    res.status(201).json({
      success: true,
      message: 'Dokumen arsip RT berhasil dibuat.',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
