import { ensureReady, pool } from '../config/db.js';

export async function initializeDatabase() {
  console.log('🔄 Memulai inisialisasi database (PGlite + Google Spreadsheet)...');
  try {
    // Menjalankan schema.sql lalu memuat seluruh data dari spreadsheet.
    await ensureReady();
    // No demo data or automatic default accounts in production.
    console.log('🎉 Inisialisasi database selesai!');
  } catch (error) {
    console.error('❌ Gagal menginisialisasi database:', error);
    throw error;
  }
}

// Jika dijalankan langsung via CLI: npm run db:init
if (process.argv[1] && /initDb\.(ts|js)$/.test(process.argv[1])) {
  initializeDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
