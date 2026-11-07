import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findSqlFile(filename: string): string {
  const inCurrentDir = path.join(__dirname, filename);
  if (fs.existsSync(inCurrentDir)) return inCurrentDir;

  const inSrcDir = path.join(__dirname, '..', '..', 'src', 'database', filename);
  if (fs.existsSync(inSrcDir)) return inSrcDir;

  return inCurrentDir;
}

export async function initializeDatabase() {
  console.log('🔄 Memulai inisialisasi database PostgreSQL...');

  try {
    // 1. Eksekusi skema tabel (schema.sql)
    const schemaPath = findSqlFile('schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await query(schemaSql);
    console.log('✅ Skema tabel berhasil dibuat / diverifikasi.');

    // 2. Cek apakah data warga sudah ada
    const residentCheck = await query('SELECT COUNT(*) as count FROM residents');
    const count = parseInt(residentCheck.rows[0].count, 10);

    if (count === 0) {
      console.log('🌱 Database kosong, menginjeksi data awal (seed data)...');
      const seedPath = findSqlFile('seed.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await query(seedSql);

      // Perbarui password hash user default agar valid dengan bcrypt ('purimas123')
      const salt = await bcrypt.genSalt(10);
      const defaultPasswordHash = await bcrypt.hash('purimas123', salt);
      await query('UPDATE users SET password_hash = $1', [defaultPasswordHash]);

      console.log('✅ Seed data berhasil dimasukkan. Akun default:');
      console.log('   - Pengurus / RT: username "ketua_rt", password: "purimas123"');
      console.log('   - Bendahara    : username "bendahara_rt", password: "purimas123"');
      console.log('   - Warga        : username "sri_wahyuni", password: "purimas123"');
    } else {
      console.log(`ℹ️ Database sudah memiliki ${count} data warga. Lewati proses seeding.`);
    }

    console.log('🎉 Inisialisasi database PostgreSQL selesai!');
  } catch (error) {
    console.error('❌ Gagal menginisialisasi database:', error);
    throw error;
  }
}

// Jika dijalankan langsung via CLI: npm run db:init
if (process.argv[1] && process.argv[1].endsWith('initDb.ts')) {
  initializeDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
