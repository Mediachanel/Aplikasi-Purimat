import express from 'express';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ENV } from './config/env.js';
import { pool, query, sync } from './config/db.js';
import { initializeDatabase } from './database/initDb.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { portal } from './portal.js';
const app = express();
// Middlewares
app.disable('x-powered-by');
app.disable('etag');
app.use((_req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Strict-Transport-Security': 'max-age=15552000', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; frame-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" }); next(); });
app.use(express.json({ limit: '256kb' }));
// Health Check Endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbRes = await query('SELECT NOW() as current_time');
        res.json({
            status: 'OK',
            message: 'Aplikasi RT Purimas API Server Running',
            dbConnected: true,
            database: ENV.DB_MODE === 'sheets' ? 'Google Spreadsheet' : `${ENV.DB_MODE} (pengujian)`,
            sync: sync ? { pending: sync.pending, lastSyncAt: sync.lastSyncAt, lastLoadedAt: sync.lastLoadedAt, lastError: sync.lastError } : null,
            serverTime: new Date().toISOString(),
            dbTime: dbRes.rows[0].current_time
        });
    }
    catch (err: any) {
        res.status(500).json({
            status: 'DEGRADED',
            message: 'Server berjalan tetapi database (Google Spreadsheet) bermasalah',
            dbConnected: false,
            error: err.message
        });
    }
});
// API authentication and authorization are enforced inside the portal router.
app.use('/api', portal);
// Every deployment gets content-derived asset versions, including inside Android WebView.
let clientShell = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
for (const asset of ['app.js', 'style.css']) {
    const version = createHash('sha256').update(readFileSync(new URL('../public/' + asset, import.meta.url))).digest('hex').slice(0, 12);
    const pattern = asset === 'app.js' ? /\/app\.js(?:\?v=[^"\s]*)?/g : /\/style\.css(?:\?v=[^"\s]*)?/g;
    clientShell = clientShell.replace(pattern, '/' + asset + '?v=' + version);
}
app.get(['/', '/index.html'], (_req, res) => {
    res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    res.type('html').send(clientShell);
});
// Serve the web application on the same origin as the REST API.
app.use(express.static(fileURLToPath(new URL('../public/', import.meta.url))));
// Error Handler
app.use(errorHandler);
// Server Startup
async function startServer() {
    try {
        console.log('🚀 Menyiapkan database dari Google Spreadsheet...');
        // Coba migrasi database & buat tabel jika belum ada
        try {
            await initializeDatabase();
        }
        catch (dbErr: any) {
            console.warn('⚠️ Gagal inisialisasi skema DB saat startup:', dbErr.message);
            console.warn('   Pastikan kredensial Google & GOOGLE_SPREADSHEET_ID di file .env sudah benar.');
            throw dbErr;
        }
        app.listen(ENV.PORT, () => {
            console.log(`====================================================`);
            console.log(`🏠 Server RT Purimas Tirtajaya Aktif!`);
            console.log(`🌐 URL     : http://localhost:${ENV.PORT}`);
            console.log(`🩺 Health  : http://localhost:${ENV.PORT}/api/health`);
            console.log(`⚙️ Mode    : ${ENV.NODE_ENV}`);
            console.log(`====================================================`);
        });
    }
    catch (error) {
        console.error('Fatal error starting server:', error);
        process.exit(1);
    }
}
// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Menghentikan server, menyimpan perubahan terakhir ke spreadsheet...');
    await pool.end();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM diterima. Menyimpan perubahan terakhir ke spreadsheet...');
    await pool.end();
    process.exit(0);
});
startServer();
