import { Request, Response } from 'express';
import { query } from '../config/db.js';

export async function getAllResidents(req: Request, res: Response) {
  try {
    const { block, search } = req.query;
    let sql = `SELECT id, full_name, block_number, house_number, phone_number,
                      occupancy_status, family_members_count, vehicle_count,
                      role, join_date, is_active, created_at
               FROM residents WHERE 1=1`;
    const params: any[] = [];

    if (block) {
      params.push(block);
      sql += ` AND block_number = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (full_name ILIKE $${params.length} OR house_number ILIKE $${params.length})`;
    }

    sql += ' ORDER BY block_number ASC, house_number ASC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getResidentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, full_name, block_number, house_number, phone_number,
              occupancy_status, family_members_count, vehicle_count,
              role, join_date, is_active, created_at
       FROM residents WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data warga tidak ditemukan.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createResident(req: Request, res: Response) {
  try {
    const {
      fullName,
      blockNumber,
      houseNumber,
      phoneNumber,
      encryptedNik,
      occupancyStatus = 'Pemilik Tetap',
      familyMembersCount = 3,
      vehicleCount = 2,
      role = 'WARGA'
    } = req.body;

    if (!fullName || !blockNumber || !houseNumber || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Nama, blok, nomor rumah, dan no HP wajib diisi.' });
    }

    const insertSql = `
      INSERT INTO residents (full_name, block_number, house_number, phone_number, encrypted_nik, occupancy_status, family_members_count, vehicle_count, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await query(insertSql, [
      fullName,
      blockNumber,
      houseNumber,
      phoneNumber,
      encryptedNik || '',
      occupancyStatus,
      familyMembersCount,
      vehicleCount,
      role
    ]);

    res.status(201).json({ success: true, message: 'Warga berhasil ditambahkan.', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateResident(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      fullName,
      blockNumber,
      houseNumber,
      phoneNumber,
      occupancyStatus,
      familyMembersCount,
      vehicleCount,
      role,
      isActive
    } = req.body;

    const updateSql = `
      UPDATE residents
      SET full_name = COALESCE($1, full_name),
          block_number = COALESCE($2, block_number),
          house_number = COALESCE($3, house_number),
          phone_number = COALESCE($4, phone_number),
          occupancy_status = COALESCE($5, occupancy_status),
          family_members_count = COALESCE($6, family_members_count),
          vehicle_count = COALESCE($7, vehicle_count),
          role = COALESCE($8, role),
          is_active = COALESCE($9, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const result = await query(updateSql, [
      fullName,
      blockNumber,
      houseNumber,
      phoneNumber,
      occupancyStatus,
      familyMembersCount,
      vehicleCount,
      role,
      isActive,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Warga tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data warga berhasil diperbarui.', data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteResident(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM residents WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Warga tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data warga berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
