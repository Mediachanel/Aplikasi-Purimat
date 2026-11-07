import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { pool, query } from './config/db.js';
import { initializeDatabase } from './database/initDb.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import residentRoutes from './routes/residentRoutes.js';
import billRoutes from './routes/billRoutes.js';
import cashRoutes from './routes/cashRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW() as current_time');
    res.json({
      status: 'OK',
      message: 'Aplikasi RT Purimas API Server Running',
      dbConnected: true,
      serverTime: new Date().toISOString(),
      dbTime: dbRes.rows[0].current_time
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DEGRADED',
      message: 'Server berjalan tetapi koneksi PostgreSQL bermasalah',
      dbConnected: false,
      error: err.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/documents', documentRoutes);

// Error Handler
app.use(errorHandler);

// Server Startup
async function startServer() {
  try {
    console.log('🚀 Menghubungkan ke PostgreSQL...');
    // Coba migrasi database & buat tabel jika belum ada
    try {
      await initializeDatabase();
    } catch (dbErr: any) {
      console.warn('⚠️ Gagal inisialisasi skema DB saat startup:', dbErr.message);
      console.warn('   Pastikan PostgreSQL sudah menyala dan kredensial di file .env sesuai.');
    }

    app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`🏠 Server RT Purimas Tirtajaya Aktif!`);
      console.log(`🌐 URL     : http://localhost:${ENV.PORT}`);
      console.log(`🩺 Health  : http://localhost:${ENV.PORT}/api/health`);
      console.log(`⚙️ Mode    : ${ENV.NODE_ENV}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Menghentikan server dan menutup koneksi database...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM diterima. Menutup koneksi database...');
  await pool.end();
  process.exit(0);
});

startServer();
