# Frontend Purimas

Web dan Android untuk RT 013 / RW 003 Purimas Tirtajaya. Cakupan: 24 rumah A1–A13 dan B1–B11.

- Web: https://purimas.infotamadygital.com/
- APK: https://purimas.infotamadygital.com/download/
- Versi Android: 2.2 / versionCode 4, minimal Android 7.0.
- [Backend/API](BACKEND-API.md) · [ERD](ERD.md)

## Struktur dan teknologi

UI menggunakan HTML, CSS dan JavaScript tanpa framework: `backend/public/index.html`, `style.css`, `app.js`. Aset di `assets/`, halaman APK di `download/`, dan APK di `downloads/purimas.apk`.

Android `app/src/main/java/com/example/MainActivity.kt` membuka portal HTTPS yang sama melalui WebView. Pemilih berkas mendukung upload; PrintManager mendukung cetak/PDF. Tidak ada database lokal aktif atau mode offline. Perubahan UI berlaku pada web dan Android; perubahan kemampuan Android memerlukan APK baru. HTML memuat hash aset agar browser mengambil versi terbaru.

## Menu dan peran

| Peran | Akun utama | Layanan |
|---|---|---|
| Ketua RT | `blok_a8` | Baca seluruh data, kas, iuran, laporan dan akun; terbitkan pengumuman |
| Sekretaris | `blok_b10` | Seluruh layanan warga untuk rumah sendiri (iuran, pembayaran, saldo, keluarga, pengajuan, dokumen, pengumuman), reset password warga; kelola data warga dan lampiran KTP/KK; verifikasi perubahan keluarga/kendaraan dan pengajuan administrasi; terbitkan surat |
| Bendahara | `blok_b1` | Kelola rekening, tagihan, debit/kredit, pembayaran dan laporan |
| Warga | Rumah masing-masing | Data keluarga sendiri, pengajuan, pembayaran, dokumen dan saldo agregat |

Ketua tidak mengubah transaksi kas; bendahara tidak membuka KTP/KK rumah lain. Tampilan mengadopsi pola Smart SDMK dengan identitas oranye Purimas: sidebar desktop berwarna oranye gelap, profil singkat dan menu aktif, kartu KPI, formulir login responsif, tabel dan dialog konsisten. HP memakai lima tombol navigasi bawah: empat menu utama sesuai peran dan Lainnya. Warga: Beranda/Iuran/Bayar/Keluarga; Sekretaris: Beranda/Pengajuan/Warga/Iuran; Ketua: Beranda/Iuran/Laporan/Pengajuan; Bendahara: Beranda/Verifikasi/Kas/Laporan. Layanan Cepat memuat seluruh menu sesuai peran dalam dua baris yang dapat digeser secara horizontal di HP; tombol panah dan keyboard juga dapat digunakan. Dashboard HP menampilkan kartu ringkas dan layanan cepat di bagian atas. Otorisasi sebenarnya dilakukan server.

## Login dan pengaturan

Username mengikuti rumah, misalnya `blok_a3`. Gunakan password yang diberikan pengurus. Ikon mata menampilkan/menyembunyikan password; akun dengan password awal wajib mengganti password sebelum mengakses data. Password baru minimal 12 karakter, maksimal 72 byte, dan tidak boleh mudah ditebak atau sama dengan yang lama. Sesi masuk disimpan di localStorage perangkat selama 90 hari dan diperpanjang ketika aplikasi dibuka kembali. Sesi lama di sessionStorage dipindahkan otomatis. Gangguan koneksi tidak menghapus sesi; gunakan Coba lagi. Tombol Keluar mencabut sesi yang masih aktif dan menghapus token perangkat. Ketua RT dan Sekretaris dapat mereset akun warga melalui Akun Rumah → Reset password. Password sementara adalah `purimas`; warga wajib menggantinya saat masuk kembali. Reset mencabut semua sesi lama warga dan dicatat di Riwayat Aktivitas. Tidak tersedia registrasi publik atau reset password mandiri.

## Data keluarga dan administrasi

Buka Data Keluarga → Ajukan perubahan. Lengkapi kepala keluarga, anggota, status hunian dan kendaraan. NIK opsional, tetapi jika diisi harus 16 digit. Upload KTP/KK JPG/PNG/PDF maksimal 8 MB dan pilih lampiran yang disertakan. Snapshot yang disetujui mengganti daftar anggota, kendaraan dan lampiran aktif; periksa sebelum mengirim.

Sekretaris dapat membuka Data Warga → Tambah / ubah (atau Lihat → Kelola data warga) untuk menyimpan data keluarga dan kendaraan serta mengunggah lampiran langsung. Jika ada perubahan warga yang menunggu, sekretaris harus memverifikasinya terlebih dahulu. Tombol Unduh Excel data warga mengekspor satu baris per anggota keluarga yang tersimpan, dengan kolom perumahan, identitas rumah, alamat, tanggal terbit KK dan kolom sesuai KK. Data yang belum diisi ditampilkan kosong. Rumah tanpa anggota belum menghasilkan baris.

Perubahan masuk ke Pengajuan dan belum mengubah data aktif sampai disetujui sekretaris. Hanya satu perubahan profil tertunda per rumah. Rincian usulan perubahan keluarga hanya menampilkan nilai yang ditambah, diubah, atau dihapus, termasuk lampiran; anggota dan isian yang tetap sama tidak ditampilkan. Jika ditolak, pilih **Perbaiki dan ajukan lagi** di daftar atau rincian Pengajuan. Formulir memuat data usulan dan lampiran sebelumnya beserta catatan penolakan. Perubahan lain yang sudah terverifikasi tetap dipertahankan; periksa kembali formulir jika data terbaru telah berubah. Pengiriman membuat usulan baru yang terhubung ke usulan ditolak, sehingga catatan lama tetap ada. Usulan yang telah diajukan kembali menampilkan tautan ke pengajuan terbaru. Untuk administrasi, pilih jenis surat dan keperluan; hasil persetujuan muncul di Dokumen. Sekretaris mengisi keputusan, catatan, serta nomor/isi surat jika diterbitkan.

## Pembayaran dan laporan

1. Warga membuka Iuran Warga → Bayar iuran, memilih satu atau beberapa bulan, termasuk hingga 12 bulan mendatang yang belum diterbitkan. Nominal bulan yang sudah memiliki tagihan mengikuti tagihan; bulan baru mengikuti nominal iuran di muka yang diatur bendahara (disepakati Rp150.000 per bulan).
2. Pilih tunai atau transfer. Rekening resmi: **Bank Mandiri 1570007190136 — Nugraheni K. Widi**; gunakan konfigurasi terbaru di aplikasi.
3. Setelah membayar, isi tanggal pembayaran sebenarnya dan referensi. Transfer wajib lampiran bukti. Jika memilih bulan di muka yang belum memiliki tagihan, tagihan untuk rumah tersebut dibuat saat konfirmasi dikirim, dalam transaksi yang sama.
4. Kirim konfirmasi dan pantau Pembayaran. Menunggu tidak menambah saldo atau melunasi tagihan.
5. Bendahara memeriksa dana dan bukti, lalu menyetujui/menolak. Jika disetujui, tagihan dan kas diperbarui bersama.

Jika warga membayar tanpa konfirmasi aplikasi, bendahara membuka Pembayaran atau Iuran Warga → Catat pembayaran warga, memilih rumah dan bulan, lalu mengisi metode, tanggal sebenarnya, serta nomor bukti atau catatan. Setelah bendahara menyimpan, tagihan langsung lunas, penerimaan tercatat di kas dan riwayat pembayaran terlihat oleh warga. Bulan yang sedang menunggu konfirmasi warga harus diproses melalui menu Pembayaran agar tidak tercatat ganda.

Untuk periode baru, pilih tahun pada Iuran Warga. Bendahara dapat memilih Buat tagihan bulanan atau Buat tagihan setahun, lalu menetapkan tahun dan nominal per rumah; tagihan setahun tidak dibuat otomatis dan tagihan yang sudah ada tidak ditimpa. Bendahara dapat mengatur nominal untuk pilihan iuran di muka melalui tombol Nominal iuran di muka. Tahun berjalan dan tahun berikutnya tersedia meski belum ada tagihan.

Bendahara membuka Buku Kas → Catat transaksi untuk debit/kas masuk atau kredit/kas keluar selain iuran warga. Unggah bukti JPG/PDF maksimal 8 MB sebagai pengganti isian nomor bukti. Kolom Bukti di Buku Kas dan Laporan Keuangan menyediakan Lihat bukti, Upload bukti untuk transaksi lama, atau Ganti bukti. Unggah/ganti bukti tidak mengubah tanggal, nominal atau saldo; bukti kas hanya dapat dibuka Ketua dan Bendahara. Iuran warga tetap dicatat melalui Pembayaran. Laporan Keuangan menyediakan pilihan tahun dan filter tanggal/jenis, saldo awal/debit/kredit/akhir, unduhan Excel (.xlsx). Rekening diatur melalui Pembayaran → Rekening penerima. Bukti transfer terkait konfirmasi dapat dibuka bendahara; identitas warga lain tetap privat.

## Pengingat dan notifikasi bendahara

Bendahara membuka Pengingat Iuran untuk melihat tagihan yang sudah lewat tanggal jatuh tempo dan menyiapkan pesan WhatsApp per rumah. Jatuh tempo disepakati tanggal 5; tanggal pada tagihan yang sudah memiliki tanggal sendiri tetap berlaku. Tagihan dianggap terlambat mulai hari berikutnya. Tagihan yang sedang menunggu verifikasi pembayaran dipisahkan dari daftar pengingat. Nomor HP diperoleh dari profil rumah yang diverifikasi sekretaris; nomor yang belum tersedia perlu dilengkapi. Pesan dibuka sebagai draf WhatsApp, dan bendahara memeriksa serta mengirimnya sendiri.

Ikon notifikasi di bagian atas menampilkan jumlah konfirmasi pembayaran yang menunggu. Saat aplikasi terbuka, sistem memeriksa pembaruan secara berkala dan menampilkan pemberitahuan untuk konfirmasi baru. Ini bukan push notification ketika aplikasi ditutup.

## KPI dan status

| Indikator | Definisi |
|---|---|
| Saldo kas | Seluruh MASUK dikurangi KELUAR; termasuk saldo awal |
| Iuran terbayar/belum dibayar | Jumlah nominal tagihan menurut status |
| Tingkat pelunasan | Jumlah tagihan lunas / seluruh tagihan × 100, satu desimal |
| Konfirmasi menunggu | Pembayaran yang belum diputuskan bendahara |
| Grafik pengeluaran | Komposisi nominal per kategori, bukan tren harian |

Ketua/bendahara melihat KPI iuran seluruh rumah; warga melihat iuran rumahnya serta saldo lingkungan. Sekretaris melihat KPI pengajuan. Dashboard memakai seluruh tagihan tersedia; filter tahun halaman Iuran tidak memfilter dashboard. BELUM_BAYAR tidak otomatis berarti lewat jatuh tempo. Status pengajuan/pembayaran: MENUNGGU → DISETUJUI atau DITOLAK.

Saldo awal laporan adalah kas sebelum tanggal awal; saldo akhir = saldo awal + debit − kredit. Filter jenis menyaring rincian, tetapi saldo tetap memperhitungkan semua transaksi periode.

## Kendala umum dan validasi

- Login/tampilan lama: periksa domain/username, refresh atau buka ulang APK terbaru; gunakan ikon mata. Pembatasan kegagalan login dapat meminta menunggu 15 menit.
- Data belum berubah: lihat status dan catatan Pengajuan; muat profil terbaru saat konflik revisi.
- Sudah transfer belum lunas: kirim konfirmasi dan tunggu bendahara; jangan transfer ulang hanya karena status menunggu.
- Unggahan gagal: cek format asli, ukuran dan kepemilikan. Tautan unduh dua menit dapat dibuka ulang dari aplikasi.
- PDF web: izinkan popup; Android menggunakan layanan cetak. Uji langsung PrintManager pada HP fisik belum tercatat.

Navigasi empat peran, layar desktop/390 px, upload, pengajuan, pemeriksaan pembayaran dan unduhan Excel telah diuji pada database terisolasi. Build/signature APK diperiksa. Tidak ada hasil uji perangkat fisik atau klaim audit keamanan eksternal.

## Data KK dan demografi

Formulir keluarga menyediakan nomor KK, alamat, RT/RW, kelurahan, kecamatan, kabupaten/kota, provinsi dan kode pos sesuai KK. Pada setiap anggota tersedia nama, NIK, jenis kelamin, tempat/tanggal lahir, agama/kepercayaan, pendidikan, pekerjaan, status/tanggal perkawinan, hubungan, kewarganegaraan, paspor/izin tinggal, nama orang tua dan golongan darah. Isi berdasarkan KK; bagian yang tidak tersedia boleh kosong. Berkas KK/KTP tetap dilampirkan secara privat.

Masukkan **kepala keluarga juga sebagai anggota KK**, selain identitas kepala keluarga di bagian atas. Dashboard menghitung orang dari daftar anggota yang sudah diverifikasi, bukan jumlah akun atau kolom nama kepala keluarga. Dengan demikian orang yang tidak dimasukkan dalam daftar anggota belum terhitung, dan kepala keluarga tidak dihitung dua kali. Data menunggu atau ditolak tidak masuk KPI.

Dashboard semua peran menampilkan jumlah anggota terdata, laki-laki/perempuan, rumah dengan anggota, dan distribusi usia, pendidikan serta pekerjaan. Kelompok usia dihitung dari tanggal lahir pada tanggal berjalan di Asia/Jakarta. Data kosong tampil “Belum diisi”. Jika belum ada anggota terverifikasi, dashboard menjelaskan bahwa data belum tersedia; nol terdata tidak berarti tidak ada penduduk. Data agregat tidak menampilkan nama, NIK, nomor KK, agama, atau nama orang tua.

Sidebar desktop memakai foto gerbang Purimas dengan lapisan oranye; tampilan HP tetap menggunakan navigasi bawah.
