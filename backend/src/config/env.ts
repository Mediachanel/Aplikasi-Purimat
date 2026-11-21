import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'purimas-rt013-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',

  // Database: 'sheets' = Google Spreadsheet (default)
  //           'memory' = tanpa penyimpanan, 'file' = folder lokal DB_FILE_DIR (khusus pengujian)
  DB_MODE: (process.env.DB_MODE || 'sheets') as 'sheets' | 'memory' | 'file',
  DB_FILE_DIR: process.env.DB_FILE_DIR || './.pglite-test',

  // Google Spreadsheet (database) & Google Drive (berkas privat KTP/KK/bukti)
  GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID || '',
  GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  GOOGLE_SERVICE_ACCOUNT_KEY_FILE: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || '',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  GOOGLE_PRIVATE_KEY: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  GOOGLE_OAUTH_REFRESH_TOKEN: process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '',

  // Jeda sebelum perubahan ditulis ke spreadsheet (ms) & interval cek edit manual di Sheets
  SHEETS_FLUSH_DELAY_MS: process.env.SHEETS_FLUSH_DELAY_MS ? parseInt(process.env.SHEETS_FLUSH_DELAY_MS, 10) : 1500,
  SHEETS_POLL_MS: process.env.SHEETS_POLL_MS ? parseInt(process.env.SHEETS_POLL_MS, 10) : 30000,

};

// Production must not start with a missing, short, or predictable signing key.
if (ENV.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || Buffer.byteLength(ENV.JWT_SECRET, 'utf8') < 32 || /purimas|secret|password/i.test(ENV.JWT_SECRET))
    throw new Error('JWT_SECRET produksi harus berupa kunci acak sekurangnya 32 byte.');
  if (ENV.DB_MODE === 'sheets' && !ENV.GOOGLE_SPREADSHEET_ID)
    throw new Error('GOOGLE_SPREADSHEET_ID wajib diisi di produksi.');
}
