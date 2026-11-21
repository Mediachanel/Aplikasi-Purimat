# Operasional Purimas

Panduan lengkap berada di [Operasional dan pemulihan](../docs/BACKEND-API.md). Mulai dari [pusat dokumentasi](../docs/FRONTEND.md) untuk panduan peran, API, ERD, KPI, pembayaran dan batas implementasi.

Dari direktori backend:

```bash
docker compose build purimas-api
docker compose up -d --no-deps purimas-api
curl --fail http://127.0.0.1:3000/api/health
```

Cadangkan database dan volume berkas privat sebelum pembaruan penting. Jangan menjalankan ulang provisioning atau impor laporan pada database operasional. Android 2.1 memakai portal yang sama dan memerlukan Internet; kemampuan cetak fisik masih perlu diuji.
