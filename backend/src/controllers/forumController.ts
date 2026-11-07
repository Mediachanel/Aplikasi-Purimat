import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function getAllPosts(req: Request, res: Response) {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT p.*, COUNT(c.id) as comment_count
      FROM forum_posts p
      LEFT JOIN forum_comments c ON p.id = c.post_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND p.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.title ILIKE $${params.length} OR p.content ILIKE $${params.length})`;
    }

    sql += ' GROUP BY p.id ORDER BY p.id DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createPost(req: AuthRequest, res: Response) {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Judul, isi diskusi, dan kategori wajib diisi.' });
    }

    let authorName = req.user?.username || 'Warga RT 013';
    let authorUnit = 'Purimas';
    let authorRole = req.user?.role === 'PENGURUS' ? 'Pengurus RT' : 'Warga';

    if (req.user?.residentId) {
      const resWarga = await query('SELECT full_name, block_number, house_number FROM residents WHERE id = $1', [req.user.residentId]);
      if (resWarga.rows.length > 0) {
        authorName = resWarga.rows[0].full_name;
        authorUnit = `${resWarga.rows[0].block_number} No. ${resWarga.rows[0].house_number}`;
      }
    }

    const insertSql = `
      INSERT INTO forum_posts (author_name, author_unit, author_role, title, content, category)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await query(insertSql, [authorName, authorUnit, authorRole, title, content, category]);

    res.status(201).json({
      success: true,
      message: 'Postingan diskusi berhasil diterbitkan.',
      data: { ...result.rows[0], comment_count: 0 }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function likePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Postingan tidak ditemukan.' });
    }

    res.json({ success: true, likesCount: result.rows[0].likes_count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCommentsForPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM forum_comments WHERE post_id = $1 ORDER BY id ASC',
      [id]
    );

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function addComment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { commentText } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ success: false, message: 'Teks komentar tidak boleh kosong.' });
    }

    let authorName = req.user?.username || 'Warga RT 013';
    let authorUnit = 'Purimas';

    if (req.user?.residentId) {
      const resWarga = await query('SELECT full_name, block_number, house_number FROM residents WHERE id = $1', [req.user.residentId]);
      if (resWarga.rows.length > 0) {
        authorName = resWarga.rows[0].full_name;
        authorUnit = `${resWarga.rows[0].block_number} No. ${resWarga.rows[0].house_number}`;
      }
    }

    const insertSql = `
      INSERT INTO forum_comments (post_id, author_name, author_unit, comment_text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await query(insertSql, [id, authorName, authorUnit, commentText.trim()]);

    res.status(201).json({ success: true, message: 'Komentar berhasil ditambahkan.', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
