import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function getAllAnnouncements(req: Request, res: Response) {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM announcements WHERE 1=1';
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY is_pinned DESC, id DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createAnnouncement(req: AuthRequest, res: Response) {
  try {
    const { title, content, category, isPinned = false } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Judul, isi pengumuman, dan kategori wajib diisi.' });
    }

    const author = req.user?.username ? `Pengurus RT (${req.user.username})` : 'Pengurus RT 013 RW 003';

    const insertSql = `
      INSERT INTO announcements (title, content, category, author, is_pinned)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(insertSql, [title, content, category, author, isPinned]);

    res.status(201).json({
      success: true,
      message: 'Pengumuman berhasil disebarkan.',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
