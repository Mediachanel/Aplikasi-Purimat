import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface UserTokenPayload {
  id: number;
  username: string;
  role: 'WARGA' | 'PENGURUS';
  residentId: number | null;
}

export interface AuthRequest extends Request {
  user?: UserTokenPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as UserTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Sesi kedaluwarsa atau token tidak valid.' });
  }
}

export function requireRole(allowedRoles: Array<'WARGA' | 'PENGURUS'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses dibatasi. Anda tidak memiliki izin untuk tindakan ini.'
      });
    }
    next();
  };
}
