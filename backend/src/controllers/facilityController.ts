import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function getAllBookings(req: Request, res: Response) {
  try {
    const { status, date, facility } = req.query;
    let sql = 'SELECT * FROM facility_bookings WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND date = $${params.length}`;
    }

    if (facility) {
      params.push(facility);
      sql += ` AND facility_name ILIKE $${params.length}`;
    }

    sql += ' ORDER BY date DESC, id DESC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createBooking(req: AuthRequest, res: Response) {
  try {
    const { facilityName, date, timeSlot, purpose, notes = '' } = req.body;

    if (!facilityName || !date || !timeSlot || !purpose) {
      return res.status(400).json({ success: false, message: 'Fasilitas, tanggal, jam, dan keperluan wajib diisi.' });
    }

    // Ambil data pemohon
    let residentId = req.user?.residentId || null;
    let residentName = req.user?.username || 'Warga Purimas';
    let houseUnit = 'Purimas Tirtajaya';

    if (residentId) {
      const resWarga = await query('SELECT full_name, block_number, house_number FROM residents WHERE id = $1', [residentId]);
      if (resWarga.rows.length > 0) {
        residentName = resWarga.rows[0].full_name;
        houseUnit = `${resWarga.rows[0].block_number} No. ${resWarga.rows[0].house_number}`;
      }
    }

    // Cek bentrok jadwal
    const conflictCheck = await query(
      `SELECT id FROM facility_bookings
       WHERE facility_name = $1 AND date = $2 AND time_slot = $3 AND status = 'DISETUJUI'`,
      [facilityName, date, timeSlot]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Jadwal fasilitas pada jam tersebut sudah disetujui untuk warga lain. Silakan pilih jam lain.'
      });
    }

    const insertSql = `
      INSERT INTO facility_bookings (facility_name, resident_id, resident_name, house_unit, date, time_slot, purpose, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await query(insertSql, [
      facilityName,
      residentId,
      residentName,
      houseUnit,
      date,
      timeSlot,
      purpose,
      notes
    ]);

    res.status(201).json({
      success: true,
      message: 'Pengajuan booking fasilitas berhasil diajukan. Menunggu konfirmasi pengurus.',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateBookingStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // 'DISETUJUI' atau 'DITOLAK'

    if (!['DISETUJUI', 'DITOLAK', 'MENUNGGU_PERSETUJUAN'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }

    const result = await query(
      `UPDATE facility_bookings
       SET status = $1, notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data booking tidak ditemukan.' });
    }

    res.json({ success: true, message: `Status booking diubah menjadi ${status}.`, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
