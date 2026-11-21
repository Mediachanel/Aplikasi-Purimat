# Proposal aplikasi Purimas Tirtajaya

Versi 14 November 2026, 26 slide, format widescreen 16:9.

- `Proposal-Aplikasi-Purimas-Tirtajaya.pptx`: PowerPoint dengan teks, bentuk, diagram, dan angka yang dapat diedit.
- `Proposal-Aplikasi-Purimas-Tirtajaya.pdf`: salinan untuk ditinjau.
- `proposal-purimas.html`: sumber pratinjau visual.
- `build-proposal.cjs`: pembuat PowerPoint dan HTML dari susunan slide.
- `render-proposal.cjs`: pemeriksaan overflow dan pembuat PDF/pratinjau.
- `assets/`: screenshot aplikasi produksi; tidak ada pembayaran atau pengajuan baru dibuat ketika mengambil screenshot.
- `preview/contact-sheet.png`: tinjauan seluruh slide.

Rekening resmi tersimpan melalui API bendahara: Bank Mandiri, 1570007190136, Nugraheni K. Widi. Pemasangan rekening tidak mengubah saldo kas.

Presentasi Canva hasil impor: `DAHa2Kdeby8`.
Pratinjau: https://www.canva.com/d/NkK81B_D6nMLWNq
Editor: https://www.canva.com/d/JOhyDycZMWkqF5V

Desain tujuan awal pengguna: `DAHa2BpPjpE`, semula satu slide kosong. Perubahan susunan halaman telah disetujui dan diselesaikan pada desain native Canva final; lihat bagian hasil akhir di bawah.

Pemeriksaan: 26 slide PowerPoint valid; teks tidak terpotong pada pratinjau; impor Canva menghasilkan 26 halaman; nomor rekening, pemilik rekening, dan tiga angka utama kas cocok setelah impor. Angka keuangan bersumber dari laporan 7 November 2026. Target implementasi dan KPI adopsi ditandai sebagai usulan. Biaya yang belum disepakati tidak diberi angka fiktif. Password dan salinan dokumen identitas tidak disertakan.

Build memakai `pptxgenjs` di lingkungan tool `/tmp/purimas-proposal-tools`. Render memakai Playwright dan Chromium yang tersedia di lingkungan, dengan pustaka browser pada `/tmp/catsiasn-browser-libs/root/usr/lib/x86_64-linux-gnu`.

## Hasil akhir Canva native

Proposal dibuat native di Canva (sumber `DAHa2XZXn6s`), dikoreksi langsung melalui transaksi editor, lalu disimpan setelah persetujuan pratinjau. Seluruh 26 halaman dipasang ke desain awal `DAHa2BpPjpE`; slide kosong telah dihapus. Jumlah akhir 26 halaman.

Tautan awal pengguna tetap berlaku: https://canva.link/7ml4qwzftg8pny0
Editor hasil akhir: https://www.canva.com/d/JdetP9_m3y8SPjQ

File PPTX/PDF lokal adalah versi proposal sebelumnya yang dibuat lokal, bukan ekspor desain native Canva final.
