import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { ENV } from '../config/env.js';
import { AuthRequest } from '../middlewares/auth.js';

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    const userRes = await query(
      `SELECT u.id, u.username, u.password_hash, u.role, u.is_active, u.resident_id,
              r.full_name, r.block_number, r.house_number, r.phone_number
       FROM users u
       LEFT JOIN residents r ON u.resident_id = r.id
       WHERE u.username = $1`,
      [username.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Akun Anda dinonaktifkan oleh pengurus RT.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      residentId: user.resident_id
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        residentId: user.resident_id,
        fullName: user.full_name || user.username,
        blockNumber: user.block_number || '',
        houseNumber: user.house_number || '',
        phoneNumber: user.phone_number || ''
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { username, password, fullName, blockNumber, houseNumber, phoneNumber, encryptedNik } = req.body;

    if (!username || !password || !fullName || !blockNumber || !houseNumber || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi.' });
    }

    const existUser = await query('SELECT id FROM users WHERE username = $1', [username.trim()]);
    if (existUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
    }

    // 1. Simpan data warga (Resident)
    const resResident = await query(
      `INSERT INTO residents (full_name, block_number, house_number, phone_number, encrypted_nik, occupancy_status, role)
       VALUES ($1, $2, $3, $4, $5, 'Pemilik Tetap', 'WARGA')
       RETURNING id`,
      [fullName, blockNumber, houseNumber, phoneNumber, encryptedNik || '']
    );

    const residentId = resResident.rows[0].id;

    // 2. Simpan kredensial akun
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const resUser = await query(
      `INSERT INTO users (resident_id, username, password_hash, role)
       VALUES ($1, $2, $3, 'WARGA')
       RETURNING id, username, role`,
      [residentId, username.trim(), passwordHash]
    );

    const newUser = resUser.rows[0];
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role, residentId },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Pendaftaran warga berhasil.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        residentId,
        fullName,
        blockNumber,
        houseNumber,
        phoneNumber
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const userRes = await query(
      `SELECT u.id, u.username, u.role, u.resident_id,
              r.full_name, r.block_number, r.house_number, r.phone_number,
              r.occupancy_status, r.family_members_count, r.vehicle_count, r.join_date
       FROM users u
       LEFT JOIN residents r ON u.resident_id = r.id
       WHERE u.id = $1`,
      [req.user?.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    res.json({ success: true, data: userRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
