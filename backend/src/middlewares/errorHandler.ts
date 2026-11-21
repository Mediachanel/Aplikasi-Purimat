import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const code = Number(err.status || err.statusCode) || 500;
  const status = code >= 400 && code <= 599 ? code : 500;
  console.error('[Request error]:', status, err.type || err.name || 'Error');
  const message = status === 413 ? 'Ukuran permintaan terlalu besar.' : status === 400 ? 'Format permintaan tidak valid.' : status >= 500 ? 'Layanan sedang mengalami gangguan. Silakan coba kembali.' : 'Permintaan tidak dapat diproses.';
  res.status(status).json({ success: false, message });
}
