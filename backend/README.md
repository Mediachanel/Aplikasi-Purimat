# Purimas RT 013 RW 003

Satu aplikasi web dan API, dengan APK Android 2.1 yang menampilkan portal yang sama. Database disimpan di **Google Spreadsheet**, berkas privat (KTP, KK, bukti bayar, bukti kas) di **Google Drive**. Tidak perlu server PostgreSQL.

- Web: https://purimas.infotamadygital.com/
- APK: https://purimas.infotamadygital.com/download/
- [Frontend](../docs/FRONTEND.md)
- [Backend/API](../docs/BACKEND-API.md)
- [ERD](../docs/ERD.md)

24 akun rumah: A1–A13 dan B1–B11. Ketua `blok_a8`, sekretaris `blok_b10`, bendahara `blok_b1`; lainnya warga. Password awal sesuai kesepakatan pemilik; ganti melalui pengaturan akun. Password disimpan sebagai hash bcrypt.

## Cara kerja database

Server memakai PostgreSQL tertanam ([PGlite](https://pglite.dev), berjalan di dalam proses Node) sebagai mesin query, sehingga seluruh SQL di `src/portal.ts` tetap sama dengan versi PostgreSQL. Penyimpanan permanennya adalah Google Spreadsheet:

- Saat start, `schema.sql` dijalankan lalu isi setiap tab spreadsheet dimuat (1 tabel = 1 tab, baris 1 = nama kolom).
- Setiap transaksi yang selesai ditulis ulang ke tab tabel yang berubah dalam satu permintaan atomik (jeda `SHEETS_FLUSH_DELAY_MS`, default 1,5 detik). `GET /api/health` menampilkan status sinkronisasi (`sync.pending`, `sync.lastSyncAt`, `sync.lastError`).
- Edit manual di spreadsheet terdeteksi (cek tiap `SHEETS_POLL_MS`, default 30 detik) lalu dimuat ulang. Lakukan edit manual saat aplikasi sepi; jangan ubah nama tab/kolom dan jangan menambah kolom (kolom di luar skema diabaikan dan tertimpa).
- Jalankan **satu** instance server saja.
- Spreadsheet berisi data pribadi warga (NIK, KK, nomor HP): jangan bagikan tautannya.

## Setup Google

1. Buat Google Spreadsheet kosong dan folder Google Drive; salin ID-nya ke `.env` (`GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`).
2. Di Google Cloud Console aktifkan **Google Sheets API** dan **Google Drive API**, buat OAuth client, isi `GOOGLE_OAUTH_CLIENT_ID`/`GOOGLE_OAUTH_CLIENT_SECRET`, lalu jalankan `npm run google:auth` (refresh token tersimpan otomatis di `.env`). Publish OAuth consent screen agar token tidak kedaluwarsa setelah 7 hari.
3. Lihat `.env.example` untuk semua variabel. Jangan menulis kredensial di file selain `.env`.

## Menjalankan

Jalankan `npm ci`, `npm run build`, lalu `docker compose up -d --build` (atau `npm start`). Startup hanya membuat/memperbarui skema dan tidak mengisi data contoh. Untuk instalasi baru, sekali saja dan berurutan:

```bash
npm run db:provision                # 24 akun rumah
npm run db:import-2026-11-07        # laporan bendahara 07-11-2026 (288 tagihan + rekap kas)
npm run db:import-iuran-2026-11-16  # rekap iuran 16-11-2026 (254 bulan lunas)
```

Cadangan: unduh spreadsheet (File → Download → .xlsx) dan salin folder Drive `berkas-privat`; riwayat versi Google Sheets dapat dipakai untuk pemulihan.

## Pengujian

Test integrasi di `tests/` menulis fixture, jadi hanya boleh dijalankan pada server uji port 8302 dengan database terisolasi tanpa Google: `DB_MODE=file DB_FILE_DIR=./.pglite-test UPLOAD_DIR=./.pglite-test/uploads`, setelah provisioning dan impor laporan pada folder tersebut.
