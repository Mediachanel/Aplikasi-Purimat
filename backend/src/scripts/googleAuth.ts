// =============================================================================
// Ambil GOOGLE_OAUTH_REFRESH_TOKEN untuk akun Gmail pengurus RT.
// Jalankan: npm run google:auth  (butuh GOOGLE_OAUTH_CLIENT_ID & _SECRET di .env)
// OAuth client harus bertipe "Desktop app" di Google Cloud Console.
// =============================================================================
import fs from 'fs';
import path from 'path';
import http from 'http';
import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../config/env.js';
import { GOOGLE_SCOPES } from '../config/google.js';

const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;

if (!ENV.GOOGLE_OAUTH_CLIENT_ID || !ENV.GOOGLE_OAUTH_CLIENT_SECRET) {
  console.error('❌ Isi GOOGLE_OAUTH_CLIENT_ID dan GOOGLE_OAUTH_CLIENT_SECRET di file .env terlebih dahulu.');
  process.exit(1);
}

const client = new OAuth2Client(ENV.GOOGLE_OAUTH_CLIENT_ID, ENV.GOOGLE_OAUTH_CLIENT_SECRET, REDIRECT_URI);
const authUrl = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: GOOGLE_SCOPES });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', REDIRECT_URI);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`Gagal: ${url.searchParams.get('error')}`);
    return;
  }

  try {
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) throw new Error('Google tidak mengirim refresh token. Cabut akses aplikasi di myaccount.google.com/permissions lalu ulangi.');
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Berhasil! Silakan kembali ke terminal.');

    const envPath = path.resolve('.env');
    const line = `GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`;
    if (fs.existsSync(envPath)) {
      const text = fs.readFileSync(envPath, 'utf8');
      const next = /^GOOGLE_OAUTH_REFRESH_TOKEN=.*$/m.test(text)
        ? text.replace(/^GOOGLE_OAUTH_REFRESH_TOKEN=.*$/m, line)
        : `${text.trimEnd()}\n${line}\n`;
      fs.writeFileSync(envPath, next);
      console.log(`\n✅ Refresh token tersimpan otomatis di ${envPath}\n`);
    } else {
      console.log('\n✅ Tambahkan baris berikut ke file backend/.env:\n');
      console.log(`${line}\n`);
    }
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`Gagal menukar kode: ${err.message}`);
    console.error('❌', err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('🔐 Buka URL berikut di browser, login dengan akun Google pemilik spreadsheet & folder Drive:\n');
  console.log(authUrl);
  console.log('\n⏳ Menunggu persetujuan...');
});
