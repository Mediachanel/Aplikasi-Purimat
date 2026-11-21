# Purimas Tirtajaya

Aplikasi pengelolaan RT 013 / RW 003, Kota Depok, untuk 24 rumah: A1–A13 dan B1–B11. Portal web dan Android memakai layanan dan database yang sama.

- [Aplikasi web](https://purimas.infotamadygital.com/)
- [Unduh Android](https://purimas.infotamadygital.com/download/)
- [Frontend](docs/FRONTEND.md)
- [Proposal Canva final](https://canva.link/7ml4qwzftg8pny0)

## Struktur proyek

| Lokasi | Isi |
|---|---|
| `backend/src/portal.ts` | API, autentikasi, otorisasi, pengajuan, pembayaran, laporan |
| `backend/src/database/` | Skema, inisialisasi, provisioning dan impor sumber historis |
| `backend/public/` | UI web, aset, halaman unduh dan APK distribusi |
| `backend/tests/` | Pengujian integrasi dan browser pada database terisolasi |
| `app/` | Android WebView, pemilih berkas dan layanan cetak |
| `docs/` | Panduan pengguna, API, operasional, ERD, sumber data dan proposal |

## Menjalankan layanan

Dari `backend/`, siapkan `.env` dengan kredensial deployment, lalu:

```bash
docker compose up -d --build
curl --fail http://127.0.0.1:3000/api/health
```

Startup memeriksa skema tanpa mengisi data contoh. Jangan menjalankan provisioning atau impor historis pada database yang sudah operasional. Ikuti [Backend/API](docs/BACKEND-API.md) untuk instalasi baru, backup, pembaruan dan pemulihan.

## Status

Android 2.1 (`versionCode 3`, Android 7.0+) mengakses portal HTTPS yang sama. Transaksi keuangan dikelola bendahara; transfer dikonfirmasi manual setelah dana diperiksa. Tidak ada gateway bank otomatis atau mode offline. [Batas implementasi](docs/BACKEND-API.md) memisahkan fitur tersedia dari pekerjaan lanjutan.
