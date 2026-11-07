# Backend REST API Server - Aplikasi RT Purimas Tirtajaya

Backend server untuk Aplikasi RT Purimas Tirtajaya (RT 013 RW 003) menggunakan **Node.js**, **Express**, **TypeScript**, dan **PostgreSQL**.

---

## 🚀 Fitur Utama

- **Autentikasi & Otorisasi**: Login & Registrasi dengan JWT dan hashing password bcrypt (Role: `WARGA` & `PENGURUS`).
- **Data Warga**: Manajemen direktori warga, filter blok & pencarian.
- **Iuran & Billing**: Tagihan bulanan iuran RT (Rp 140.000/bln), pembayaran QRIS / Virtual Account, generator tagihan bulanan otomatis.
- **Buku Kas Lingkungan**: Pencatatan kas masuk & kas keluar real-time serta kalkulasi saldo kas RT.
- **Fasum Booking**: Pemesanan fasilitas umum (lapangan badminton, balai warga) dengan validasi anti-bentrok jadwal.
- **Forum & Aduan Warga**: Diskusi warga, like, dan sistem komentar.
- **Pengumuman Lingkungan**: Broadcast pengumuman dan info darurat (dengan fitur pin).
- **Arsip Dokumen RT**: Template surat pengantar dan dokumen tata tertib RT.

---

## 🛠️ Persyaratan Sistem

- Node.js v18+ (disarankan v20 atau v24)
- PostgreSQL Server v14+ (lokal atau cloud seperti Supabase / Neon / VPS PostgreSQL)

---

## ⚙️ Konfigurasi Lingkungan (`.env`)

Salin file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Sesuaikan parameter koneksi database PostgreSQL Anda:

```env
PORT=3000
NODE_ENV=production

JWT_SECRET=kunci-rahasia-jwt-server-acak-dan-panjang

# Koneksi Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=purimas_db
DB_USER=postgres
DB_PASSWORD=password_db_anda
DB_SSL=false
```

---

## 📦 Menjalankan Server & Migrasi Database

### 1. Inisialisasi Skema & Data Awal (Auto-Migrate)
Server akan secara otomatis membuat seluruh tabel saat pertama kali dijalankan jika tabel belum ada. Jika ingin menjalankan migrasi secara manual:

```bash
npm run db:init
```

Perintah di atas akan:
1. Mengeksekusi `src/database/schema.sql` untuk membuat tabel-tabel dan indeks.
2. Menginjeksi data awal `src/database/seed.sql` jika database masih kosong.

**Akun Default untuk Uji Coba:**
- **Ketua RT (Pengurus)**: `username: ketua_rt` | `password: purimas123`
- **Bendahara RT (Pengurus)**: `username: bendahara_rt` | `password: purimas123`
- **Warga**: `username: sri_wahyuni` | `password: purimas123`

### 2. Mode Pengembangan (Development)
```bash
npm run dev
```

### 3. Build & Jalankan Produksi
```bash
npm run build
npm start
```

---

## 🐳 Deployment dengan Docker

Jika ingin mendeploy ke server menggunakan Docker:

```bash
# Build dan jalankan container di background
docker compose up -d --build
```

---

## 📡 Daftar Endpoint API

### Autentikasi
- `POST /api/auth/login` - Login pengguna (mengembalikan JWT token)
- `POST /api/auth/register` - Registrasi warga baru
- `GET /api/auth/me` - Ambil profil pengguna yang sedang login

### Data Warga
- `GET /api/residents` - Ambil semua warga (query: `block`, `search`)
- `GET /api/residents/:id` - Detail warga
- `POST /api/residents` - Tambah warga (Pengurus)
- `PUT /api/residents/:id` - Ubah data warga (Pengurus)
- `DELETE /api/residents/:id` - Hapus warga (Pengurus)

### Tagihan & Iuran
- `GET /api/bills` - Semua tagihan (filter: `status`, `month`, `year`)
- `GET /api/bills/summary` - Ringkasan kas iuran (total, lunas, menunggak)
- `GET /api/bills/resident/:residentId` - Tagihan milik warga tertentu
- `POST /api/bills/:id/pay` - Proses pembayaran iuran (otomatis masuk buku kas)
- `POST /api/bills/generate-monthly` - Generate tagihan massal bulanan (Pengurus)

### Kas Lingkungan
- `GET /api/cash` - Riwayat transaksi kas (filter: `type`, `category`)
- `GET /api/cash/summary` - Ringkasan total pemasukan, pengeluaran, dan saldo kas
- `POST /api/cash` - Catat transaksi kas (Pengurus)

### Fasilitas Umum (Fasum)
- `GET /api/facilities` - Daftar booking fasilitas
- `POST /api/facilities` - Ajukan booking fasilitas baru
- `PUT /api/facilities/:id/status` - Persetujuan booking (DISETUJUI / DITOLAK) (Pengurus)

### Forum & Komentar
- `GET /api/forum/posts` - Daftar postingan diskusi & aduan
- `POST /api/forum/posts` - Buat postingan diskusi baru
- `POST /api/forum/posts/:id/like` - Beri like pada postingan
- `GET /api/forum/posts/:id/comments` - Ambil komentar pada postingan
- `POST /api/forum/posts/:id/comments` - Kirim komentar

### Pengumuman & Broadcast
- `GET /api/announcements` - Daftar pengumuman (pinned diprioritaskan)
- `POST /api/announcements` - Buat pengumuman baru (Pengurus)

### Dokumen RT
- `GET /api/documents` - Arsip surat dan tata tertib RT
- `POST /api/documents` - Buat dokumen arsip baru (Pengurus)
