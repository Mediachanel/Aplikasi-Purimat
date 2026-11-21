# Backend/API Purimas

Basis URL: `https://purimas.infotamadygital.com/api`. Sumber kontrak: `backend/src/portal.ts` dan health check pada `backend/src/index.ts`.

## Konvensi

Gunakan `Authorization: Bearer <token>` untuk endpoint terlindungi. Login mengembalikan `{success, token, user}`; endpoint data umumnya `{success:true,data,message?}` dan kesalahan `{success:false,message}`. Nilai `BIGINT` dapat berupa string pada JSON, termasuk nominal/jumlah tertentu. Konsumen harus mengonversi secara eksplisit bila perlu.

JSON maksimal 256 KB. Unggahan berkas memakai body biner, bukan multipart atau base64. Token sesi berlaku 12 jam. Tautan unduhan bertiket berlaku dua menit dan tetap memeriksa akun/peran/sesi. `session_version` dibandingkan dengan database setiap permintaan; role dari token bukan sumber otorisasi.

| Status HTTP | Makna umum |
|---|---|
| 400 | Payload/format tidak valid |
| 401 | Belum login atau sesi berakhir |
| 403 | Hak akses/kepemilikan tidak sesuai |
| 404 | Data/layanan tidak ditemukan |
| 409 | Konflik: sudah diproses, revisi lama, atau pengajuan aktif |
| 413 | Body melebihi batas |
| 429 | Percobaan login berlebihan |
| 500 | Gangguan layanan |

Beberapa error middleware Express dapat memakai bentuk respons berbeda dari handler portal. Login dibatasi 10 kegagalan per kombinasi IP dan username selama 15 menit dalam memori proses; restart mereset penghitung ini.

## Autentikasi dan akun

| Metode | Endpoint | Akses | Isi / hasil |
|---|---|---|---|
| GET | `/health` | Publik | Status API dan koneksi database |
| POST | `/auth/login` | Publik | `{username,password}` → token dan user |
| GET | `/auth/me` | Login | User aktif, role, residentId, mustChangePassword dan token sesi 90 hari yang diperbarui |
| POST | `/auth/password` | Login | `{currentPassword,newPassword}` → token baru; minimal 12 karakter, maksimal 72 byte, berbeda dari lama dan tidak mudah ditebak |
| GET | `/users` | KETUA / SEKRETARIS | Ketua: seluruh akun; sekretaris: akun WARGA; tanpa password_hash |
| POST | `/users/:id/reset-password` | KETUA / SEKRETARIS | `{}` → reset akun WARGA aktif ke `purimas`; wajib ganti password, sesi lama dicabut, lockout dibersihkan, audit dicatat |
| POST | `/auth/logout` | Login | Mencabut semua sesi akun |
| GET | `/audit` | KETUA | Maksimum 200 aktivitas terbaru |

`mustChangePassword` mewajibkan penggantian password di UI/API; hanya `/auth/me`, `/auth/password`, dan `/auth/logout` dapat diakses sampai password diganti. Token sesi berlaku 90 hari dan diperbarui oleh `/auth/me` saat aplikasi dibuka kembali. Tidak tersedia endpoint registrasi publik, reset password mandiri, atau perubahan role.

## Rumah, pengajuan, dan dokumen

| Metode | Endpoint | Akses |
|---|---|---|
| GET | `/residents/me` | Profil lengkap rumah sendiri |
| GET | `/residents` | Ketua/sekretaris; bendahara hanya daftar ID/nama/unit |
| GET | `/residents/:id` | Ketua, sekretaris atau rumah sendiri |
| POST | `/residents/export-link` | Sekretaris: tiket unduhan Excel data KK dan perumahan |
| GET | `/exports/residents?ticket=…` | Sekretaris: Excel data warga; sesi dan peran diperiksa ulang, ekspor diaudit |
| POST | `/residents/:id/profile` | Sekretaris menyimpan data keluarga, kendaraan, dan lampiran dengan `baseRevision`; perubahan tertunda harus diverifikasi lebih dulu |
| POST | `/submissions` | Rumah sendiri, seluruh akun login |
| GET | `/submissions` | Ketua/sekretaris semua; lainnya sendiri |
| GET | `/submissions/:id` | Ketua/sekretaris atau pemilik; termasuk snapshot, pembanding, lampiran |
| POST | `/submissions/:id/review` | SEKRETARIS |
| GET | `/documents` | Ketua/sekretaris semua; lainnya milik rumah sendiri |
| GET | `/announcements` | Login |
| POST | `/announcements` | KETUA |

Contoh bentuk perubahan profil (placeholder, tidak untuk dijalankan langsung ke produksi):

```json
{
  "type": "PERUBAHAN_DATA",
  "baseRevision": 0,
  "payload": {
    "fullName": "<nama kepala keluarga>",
    "phoneNumber": "<nomor telepon atau kosong>",
    "nik": "",
    "occupancyStatus": "Pemilik Tetap",
    "family": [],
    "vehicles": []
  },
  "attachmentIds": []
}
```

Anggota `family`: `id` UUID opsional untuk baru, `fullName`, `nik` opsional 16 digit, `relationship`, `gender`, `birthPlace`, `birthDate` ISO opsional, `occupation`. Kendaraan: `id` UUID opsional, `plateNumber`, `vehicleType`, `brand`, `color`. Maksimal 30 anggota, 30 kendaraan, 40 ID lampiran; UUID dalam snapshot tidak boleh ganda. Profil dikirim sebagai snapshot lengkap: anggota/kendaraan yang tidak dicantumkan akan dihapus dari data terverifikasi jika disetujui.

Administrasi: `{type:"ADMINISTRASI",title,payload:{category,purpose},attachmentIds:[]}`. Pemeriksaan: `{status:"DISETUJUI"|"DITOLAK",reviewNote}`. Administrasi disetujui juga memerlukan `fileNumber` dan `contentBody`. `reviewNote` wajib pada keputusan pengajuan. Pengumuman: `{title,content,category,isPinned?}`.

## Berkas privat

| Metode | Endpoint | Isi / akses |
|---|---|---|
| POST | `/attachments` | Body JPG/PNG/PDF mentah, maksimal 8 MB; rumah sendiri |
| POST | `/attachments/:id/link` | `{}` → `{url,mimeType}` tiket dua menit |
| GET | `/attachments/:id` | Unduh dengan Bearer dan pemeriksaan kepemilikan |
| GET | `/files/:id?ticket=…` | Unduh dengan tiket khusus berkas |

Header upload: `Content-Type: image/jpeg`, `image/png`, atau `application/pdf`; `X-File-Kind: KTP|KK|BUKTI|KAS`; `X-File-Name` menggunakan nama yang di-URL-encode; `X-Member-Ref` UUID anggota opsional. Isi awal berkas diperiksa, bukan pemindaian malware menyeluruh.

Pemilik dan ketua dapat mengakses berkas rumah. Sekretaris mendapat akses KTP/KK yang terkait pengajuan. Bendahara mendapat akses BUKTI yang terkait konfirmasi pembayaran; bukan KTP/KK rumah lain. BUKTI dan KAS ditolak sebagai lampiran pengajuan identitas. Jenis KAS hanya boleh diunggah Bendahara dalam format JPG/PDF, maksimal 8 MB, tanpa memberRef atau rumah tujuan lain; berkasnya hanya boleh dibuka Ketua dan Bendahara, termasuk melalui tiket unduhan. URL bertiket bersifat sensitif selama masih berlaku dan tidak boleh dimasukkan log publik.

## Iuran dan pembayaran

| Metode | Endpoint | Akses / payload |
|---|---|---|
| GET | `/bills` | Ketua/bendahara semua; warga dan sekretaris hanya rumah sendiri |
| GET | `/bills/reminders` | Bendahara: tagihan lewat jatuh tempo, tanpa tagihan dengan konfirmasi aktif |
| GET/POST | `/bills/reminder-settings` | Bendahara: baca/ubah tanggal jatuh tempo bulanan untuk tagihan tanpa tanggal |
| GET | `/payment-notifications` | Bendahara: jumlah dan ID terbaru pembayaran menunggu |
| GET | `/bills/advance-options` | Bulan mendatang yang belum diterbitkan untuk rumah sendiri, hingga 12 bulan, berdasarkan nominal yang ditetapkan bendahara |
| GET/POST | `/bills/advance-settings` | Bendahara melihat/mengubah nominal per bulan untuk tagihan di muka yang belum diterbitkan |
| POST | `/bills/generate-year` | Bendahara: `{year,amount}`; buat Januari–Desember untuk rumah aktif dalam satu transaksi, abaikan duplikat |
| POST | `/bills/generate-monthly` | Bendahara: `{monthIndex,year,amount}`; abaikan duplikat rumah/bulan |
| POST | `/bills/:id/pay` | Bendahara: `{paidAt,paymentChannel,transactionRef}`; pembayaran manual satu tagihan, dicatat dalam riwayat dan kas |
| POST | `/payments/manual` | Bendahara: `{residentId,billIds,futureMonths,channel,paidDate,reference}`; simpan pembayaran terverifikasi beberapa bulan secara atomik |
| POST | `/bills/import` | Bendahara: `{rows:[…]}`; impor historis, tanpa kas baru |
| GET | `/payments` | Ketua/bendahara semua; warga dan sekretaris hanya rumah sendiri |
| POST | `/payments` | Warga/sekretaris/ketua/bendahara, hanya tagihan rumah sendiri |
| POST | `/payments/:id/review` | Bendahara: `{status,note?}`; note wajib jika ditolak |
| GET | `/payment-settings` | Login; rekening tujuan atau null |
| POST | `/payment-settings` | Bendahara: `{bankName,accountNumber,accountName}` |

Konfirmasi pembayaran:

```json
{
  "billIds": [123],
  "channel": "TRANSFER",
  "paidDate": "2026-11-14",
  "reference": "<referensi dari bukti>",
  "attachmentId": "<UUID bukti milik pemohon>"
}
```

Nilai `channel`: TRANSFER atau TUNAI. Transfer wajib rekening resmi dan lampiran BUKTI. Total dihitung server; 1–36 tagihan dalam permintaan, milik satu rumah, belum lunas dan tidak memiliki konfirmasi aktif. `paidDate` tidak boleh masa depan pada jalur konfirmasi warga. Persetujuan atomik mengubah tagihan, menulis satu kas per tagihan, menutup item aktif, dan mencatat audit. Duplikat ditolak.

Impor: 1–2000 baris berisi `username,year,month,amount,status,paidAt,reference`; status LUNAS/BELUM_BAYAR, referensi wajib untuk LUNAS. `paidAt` historis dapat kosong. Tagihan sudah ada menyebabkan seluruh impor rollback. CSV UI memakai tujuh kolom tersebut, dipisah koma, tanpa koma dalam nilai; bukan parser CSV ber-quote penuh.

## Kas, laporan, dan dashboard

| Metode | Endpoint | Akses / fungsi |
|---|---|---|
| GET | `/cash` | Ketua/bendahara; seluruh transaksi |
| GET | `/cash/summary` | Ketua/bendahara; total dan saldo |
| POST | `/cash` | Bendahara: `{type,category,amount,title,description?,date,attachmentId}`; bukti KAS JPG/PDF yang diunggah sendiri wajib untuk kas selain iuran |
| POST | `/cash/:id/proof` | Bendahara: `{attachmentId}`; tambah/ganti bukti kas selain iuran, tanpa mengubah nominal/saldo; satu berkas per transaksi, perubahan diaudit |
| POST | `/cash/opening-balance` | Bendahara: `{amount,date,reference,description?}`; sekali, tabel kas harus kosong |
| GET | `/transparency` | Login; saldo agregat dan kategori pengeluaran |
| GET | `/dashboard` | Login; agregat dan KPI sesuai role |
| GET | `/reports/cash?from=…&to=…&type=…` | Ketua/bendahara; laporan periode |
| POST | `/reports/cash/export-link` | Ketua/bendahara: `{from,to,type?}` → URL Excel (.xlsx) |
| POST | `/cash/export-link` | Ketua/bendahara: `{}` → URL seluruh kas |
| GET | `/exports/report?ticket=…` | Tiket laporan; Excel periode |
| GET | `/exports/cash?ticket=…` | Tiket kas; Excel seluruh transaksi |

Jenis kas: MASUK (debit) atau KELUAR (kredit), nominal integer positif. Laporan memakai tanggal ISO `YYYY-MM-DD`, `from<=to`, maksimum rentang 3660 hari. Parameter `type` opsional MASUK/KELUAR. Laporan mengembalikan `{period,summary:{opening,income,expense,closing},rows}`. Detail rumus ada di [Frontend](FRONTEND.md).

## Operasional

Dari `backend/`, siapkan `.env` dengan nilai deployment khusus, lalu jalankan:

```bash
docker compose build purimas-api
docker compose up -d
curl --fail http://127.0.0.1:3000/api/health
```

Komponen: Node 24, Express/TypeScript, PostgreSQL tertanam (PGlite) dengan penyimpanan permanen Google Spreadsheet dan berkas privat di Google Drive; tidak ada server/container PostgreSQL. Konfigurasi utama: PORT, NODE_ENV, JWT_SECRET, GOOGLE_SPREADSHEET_ID, GOOGLE_DRIVE_FOLDER_ID dan kredensial Google (`GOOGLE_OAUTH_*` atau `GOOGLE_SERVICE_ACCOUNT_*`); lihat `backend/.env.example`. Setiap tabel adalah satu tab spreadsheet; perubahan yang sudah COMMIT ditulis ulang ke tab terkait secara atomik dalam ±1,5 detik, dan `/api/health` menampilkan `sync.pending`/`sync.lastError`. Berkas privat disimpan di subfolder Drive `berkas-privat` (tanpa `GOOGLE_DRIVE_FOLDER_ID`: disk `UPLOAD_DIR`). JWT_EXPIRES_IN lama tidak mengubah durasi sesi aktif 12 jam.

Startup hanya memeriksa skema dan memuat data spreadsheet; tidak memasukkan demo. `dist/database/provisionReal.js` khusus database baru, membuat 24 akun kosong dan menolak reset. `importReport2026.js` khusus impor sumber 7 November satu kali pada tabel keuangan kosong; `importIuran20261116.js` sesudahnya memperbarui status tagihan sesuai rekap iuran 16 November 2026 (254 bulan lunas, Rp38.100.000) tanpa mengubah buku kas. Jangan menjalankan provisioning/impor setiap deploy. Flag penggantian demo hanya untuk dataset awal yang diperiksa persis.

Sebelum pembaruan, backup dan tag image lama. Pembaruan rutin: build lalu `docker compose up -d --no-deps purimas-api`. Periksa health, login/peran, angka saldo, berkas dan unduhan; jangan menulis fixture ke produksi. Cloudflare Tunnel menuju API port 3000 menyajikan web dan API pada origin yang sama.

### Backup dan pemulihan

Data berada di Google Spreadsheet (tab per tabel) dan berkas privat di subfolder Drive `berkas-privat`. Cadangkan keduanya pada waktu yang sama:

1. Pastikan `/api/health` menunjukkan `sync.pending: 0` (semua perubahan sudah tersimpan).
2. Spreadsheet: File → Download → Microsoft Excel (.xlsx), atau File → Buat salinan.
3. Berkas privat: unduh folder Drive `berkas-privat` (klik kanan → Download).

Simpan cadangan di lokasi privat; `.env` dan signing key dikelola terpisah. Pemulihan: hentikan API, pulihkan isi tab spreadsheet (riwayat versi Google Sheets: File → Riwayat versi, atau salin dari cadangan .xlsx dengan nama tab dan baris judul kolom yang sama) serta berkas Drive, lalu nyalakan API dan periksa jumlah rumah, tagihan, saldo, role dan lampiran. Jangan menjalankan provisioning/impor ulang pada spreadsheet yang sudah berisi data.

### Android dan distribusi

Android 2.1/code 3, applicationId `com.aistudio.purimas.tirtajaya`, min API 24, target 36. Build dari root memakai Gradle 9.3.1 dan SDK compile 36 minor 1, dengan toolchain JDK sesuai lingkungan build. Checkout tidak menyediakan wrapper script. Signing melalui KEYSTORE_PATH, STORE_PASSWORD, KEY_ALIAS dan KEY_PASSWORD.

```bash
gradle :app:assembleRelease
```

Periksa `apksigner verify --verbose`, applicationId/versionCode dan debuggable. Distribusi saat ini menggunakan sertifikat development yang sama dengan versi awal untuk menjaga update; keystore harus diamankan dan distribusi jangka panjang direncanakan. Build terdahulu mengecualikan lint vital saat dependensi offline tidak tersedia; bukan lint release lengkap. Salin APK valid ke `public/downloads/purimas.apk`, perbarui halaman download dan rebuild image. Cocokkan hash unduhan publik.

### Tes, log dan batas implementasi

Tes di `backend/tests/`: portal.integration.mjs, portal.browser.cjs, finance.integration.mjs, finance.browser.cjs. Gunakan database review terisolasi port 8302; tes menulis fixture. Tes mencakup role, privasi, verifikasi, konflik, tepat-satu-kali pembayaran bersamaan, laporan dan CSV. Dokumentasi ini tidak menjalankan ulang transaksi pengujian.

Periksa `docker compose logs --tail 100 purimas-api`, status container dan `/api/health`. Health DB saja bukan bukti semua migrasi/fungsi berhasil: startup dapat tetap listen setelah inisialisasi gagal. Monitoring/alert otomatis belum tersedia.

Batas saat ini: tanpa gateway bank otomatis, MFA/reset mandiri, manajemen role UI, reversal kas, pagination, antivirus upload, retensi/pembersihan orphan otomatis atau audit immutable menyeluruh. NIK bukan kolom terenkripsi aplikasi; password bcrypt. must_change_password belum diwajibkan. Sekretaris belum memiliki mekanisme pemeriksa pengganti untuk pengajuan sendiri. Forum/fasum dari schema lama bukan endpoint/menu aktif. Rincian tanggal/bukti historis tidak boleh dikarang.

## Riwayat singkat

- Android 1.0: data lokal; tidak dipakai sebagai sumber produksi.
- Portal empat peran/Android 2.0: satu layanan, 24 rumah, verifikasi dan impor laporan terverifikasi.
- UI/pembayaran: KPI, saldo warga, konfirmasi multi-bulan, laporan dan CSV; data lama tidak direset.
- Android 2.1: layanan cetak, signature dan unduhan diperiksa; uji fisik masih perlu.
- 14 November 2026: rekening Mandiri resmi dipasang tanpa perubahan saldo; proposal native 26 slide tersimpan di Canva.

## Demografi dan data KK

`GET /demographics` untuk akun login mengembalikan agregat `total`, `houses`, `completedHouses`, `gender`, `ageGroups`, `education`, `occupation` dan `asOf`; dashboard menyertakan objek yang sama sebagai `demographics`. Tidak mengembalikan identitas anggota. Agregat dihitung dari `family_members` terverifikasi pada rumah aktif. Kepala keluarga hanya ikut dihitung jika dicantumkan dalam daftar anggota. `completedHouses` artinya rumah dengan minimal satu anggota terverifikasi, bukan jaminan seluruh anggota KK sudah lengkap.

Snapshot `PERUBAHAN_DATA` menerima `kkNumber`, `kkIssueDate` (tanggal penerbitan KK, opsional), dan `kkAddress` (`address`, `rt`, `rw`, `village`, `district`, `city`, `province`, `postalCode`). Setiap anggota dapat menyertakan `religion`, `education`, `maritalStatus`, `marriageDate`, `citizenship`, `bloodType`, `passportNumber`, `stayPermitNumber`, `fatherName`, dan `motherName`. Nomor KK bila diisi 16 digit; tanggal lahir/perkawinan tidak boleh di masa depan. Persetujuan sekretaris menyimpan data bersama snapshot keluarga. Migrasi hanya menambah `residents.kk_number`, `residents.kk_address`, dan `family_members.kk_details` tanpa mengisi data contoh; pengajuan lama yang belum memiliki field baru mempertahankan field KK yang sudah ada.

Tes terisolasi `backend/tests/demografi.integration.mjs` memeriksa kondisi kosong, penyimpanan dan persetujuan KK, agregat, serta privasi lintas rumah. Angka uji tidak boleh digunakan sebagai data produksi.

Konfirmasi pembayaran dapat menyertakan `futureMonths` berupa `{year,monthIndex,amount}` untuk bulan mendatang yang belum memiliki tagihan. Nominal diverifikasi terhadap pengaturan bendahara dan pembuatan tagihan serta konfirmasi dilakukan dalam satu transaksi. Bila nominal berubah atau tagihan sudah diterbitkan, permintaan ditolak agar warga memuat ulang. Tanggal pembayaran adalah tanggal dana dibayar, bukan bulan iuran. Saldo bertambah setelah persetujuan bendahara.

Pembayaran manual bendahara membutuhkan referensi dan tanggal pembayaran sebenarnya; bulan tidak boleh memiliki konfirmasi aktif. Tagihan, riwayat pembayaran berstatus DISETUJUI, dan kas diperbarui dalam satu transaksi. Pilihan iuran di muka rumah lain hanya tersedia untuk bendahara.


## Perlindungan operasional

Akun yang masih memakai password awal wajib menggantinya sebelum memanggil layanan selain `auth/me`, `auth/password`, dan `auth/logout`. Password baru minimal 12 karakter dan maksimal 72 byte; password mudah ditebak ditolak. `POST /auth/logout` mencabut sesi dengan menaikkan versi sesi. JWT sesi dan tiket memiliki tujuan berbeda, algoritma HS256 dibatasi, dan tiket unduhan hanya berlaku singkat. Setelah beberapa kegagalan login, akun dikunci sementara; catatan pembatasan disimpan dalam database.

Produksi menggunakan kunci JWT acak dan kredensial Google melalui `.env` privat; jangan menyertakan `.env`, file client secret, keystore, cadangan, atau dokumen warga dalam Git maupun image. Spreadsheet dan folder Drive berisi data pribadi: jangan dibagikan. Server berjalan sebagai pengguna non-root dengan root filesystem read-only, tanpa Linux capabilities; lampiran disimpan di Google Drive. Upload dan laporan diuji dengan hak akses tersebut. Semua akun yang masih menggunakan password awal perlu mengganti password saat masuk berikutnya.

## Rincian perubahan dan perbaikan usulan keluarga

Usulan `PERUBAHAN_DATA` baru menyimpan `submissions.base_profile` sebagai acuan tetap. `GET /submissions/:id` menambahkan `changes` (kelompok `added`, `changed`, `removed` dengan field sebelum/sesudah), `canRetry`, `resubmitted_id`, `retryDraft`, `baselineUnavailable`, dan `profileChanged`. Pembandingan memakai ID anggota/kendaraan, sehingga pengurutan ulang tidak dianggap perubahan. Lampiran dibandingkan berdasarkan ID. Untuk usulan lama tanpa snapshot, data terverifikasi boleh menjadi acuan hanya jika revisinya masih sama; selain itu `changes:null` dan UI menjelaskan bahwa acuan historis tidak tersedia.

Pengusul dapat memperbaiki usulan keluarga berstatus `DITOLAK` melalui formulir yang diisi `retryDraft`. `POST /submissions` menerima `retryOf` opsional. Server memeriksa kepemilikan pengusul, jenis, status ditolak, revisi terbaru dan pengajuan ulang terdahulu. Perbaikan disimpan sebagai pengajuan baru dengan `retry_of`, acuan dan catatan audit sendiri; penolakan terdahulu tidak diubah. Draf menerapkan hanya perubahan yang diusulkan pada profil terbaru agar data lain yang baru diverifikasi tidak tertimpa. Pemeriksaan revisi saat mengirim dan menyetujui tetap berlaku. Jika acuan usulan lama tidak tersedia dan revisi sudah berubah, formulir memakai data terbaru dengan pemberitahuan agar pengusul menyesuaikan perbaikan kembali.

Buku Kas dan Laporan Keuangan mengembalikan `attachment_id` dan `attachment_name` untuk bukti kas. Unduhan Excel menuliskan nama berkas pada kolom Bukti, dengan referensi lama sebagai fallback; tidak menyertakan tiket privat yang berumur pendek. `receipt_code` dipertahankan untuk riwayat dan iuran, tetapi formulir kas baru tidak meminta nomor bukti. Lampiran memakai FK `cash_transactions.attachment_id` dan indeks unik parsial untuk mencegah pemakaian ID bukti yang sama pada dua transaksi. Bukti lama yang diganti tidak dihapus dari penyimpanan; audit menyimpan kaitan ID transaksi dan ID lampiran.
