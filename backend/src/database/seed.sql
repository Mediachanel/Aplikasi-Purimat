-- =============================================================================
-- Data Awal (Seed Data) untuk Aplikasi RT Purimas Tirtajaya (RT 013 RW 003)
-- =============================================================================

-- 1. Seed Warga
INSERT INTO residents (id, full_name, block_number, house_number, phone_number, encrypted_nik, occupancy_status, family_members_count, vehicle_count, role, join_date, is_active)
VALUES 
(1, 'Bpk. Hendra Gunawan', 'Blok A', '01', '081289123456', 'ENC_NIK_3276021203800001', 'Pemilik Tetap', 4, 2, 'PENGURUS', '2022-01-10', true),
(2, 'Ibu Sri Wahyuni', 'Blok A', '02', '081311223344', 'ENC_NIK_3276025508820002', 'Pemilik Tetap', 3, 1, 'WARGA', '2022-03-15', true),
(3, 'Bpk. Bambang Sutrisno', 'Blok B', '05', '081577889900', 'ENC_NIK_3276020511780003', 'Pemilik Tetap', 5, 2, 'WARGA', '2022-06-20', true),
(4, 'Bpk. Rizky Ramadhan', 'Blok B', '06', '085712345678', 'ENC_NIK_3276021804900004', 'Pengontrak / Penyewa', 2, 1, 'WARGA', '2023-08-01', true),
(5, 'Bpk. Agung Prasetyo', 'Blok C', '10', '081899887766', 'ENC_NIK_3276022209850005', 'Pemilik Tetap', 4, 3, 'PENGURUS', '2022-02-12', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('residents_id_seq', (SELECT MAX(id) FROM residents));

-- 2. Seed Akun Pengguna (Password default: 'purimas123', hash bcrypt: $2a$10$rCvqQ21831zV1o0Qz4hV2.lA8p8V4m9Z/2bI1aIu7oH2m2Y9xIe/a)
INSERT INTO users (id, resident_id, username, password_hash, role, is_active)
VALUES
(1, 1, 'ketua_rt', '$2a$10$wKqC9J5nC36G2eY0lA5b3u7e8k8f4j9Z2bI1aIu7oH2m2Y9xIe123', 'PENGURUS', true),
(2, 2, 'sri_wahyuni', '$2a$10$wKqC9J5nC36G2eY0lA5b3u7e8k8f4j9Z2bI1aIu7oH2m2Y9xIe123', 'WARGA', true),
(3, 5, 'bendahara_rt', '$2a$10$wKqC9J5nC36G2eY0lA5b3u7e8k8f4j9Z2bI1aIu7oH2m2Y9xIe123', 'PENGURUS', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 3. Seed Tagihan & Iuran (Rp 140.000 / bulan)
INSERT INTO bills (id, resident_id, resident_name, house_unit, month_name, month_index, year, amount, status, due_date, va_number, bank_name, paid_at, transaction_ref, payment_channel)
VALUES
(1, 1, 'Bpk. Hendra Gunawan', 'Blok A No. 01', 'November 2026', 11, 2026, 140000, 'LUNAS', '25', '128081289123456', 'BCA Virtual Account', '2026-11-02 08:30:00+07', 'TRX-20261102-001', 'Virtual Account'),
(2, 2, 'Ibu Sri Wahyuni', 'Blok A No. 02', 'November 2026', 11, 2026, 140000, 'LUNAS', '25', '128081311223344', 'BCA Virtual Account', '2026-11-04 14:15:00+07', 'TRX-20261104-012', 'QRIS'),
(3, 3, 'Bpk. Bambang Sutrisno', 'Blok B No. 05', 'November 2026', 11, 2026, 140000, 'MENUNGGAK', '25', '128081577889900', 'BCA Virtual Account', NULL, NULL, NULL),
(4, 4, 'Bpk. Rizky Ramadhan', 'Blok B No. 06', 'November 2026', 11, 2026, 140000, 'PENDING_VERIFIKASI', '25', '128085712345678', 'BCA Virtual Account', NULL, 'TRX-MTR-99812', 'Transfer Bank Manual'),
(5, 5, 'Bpk. Agung Prasetyo', 'Blok C No. 10', 'November 2026', 11, 2026, 140000, 'LUNAS', '25', '128081899887766', 'BCA Virtual Account', '2026-11-01 10:00:00+07', 'TRX-20261101-003', 'Virtual Account')
ON CONFLICT (id) DO NOTHING;

SELECT setval('bills_id_seq', (SELECT MAX(id) FROM bills));

-- 4. Seed Buku Kas Lingkungan
INSERT INTO cash_transactions (id, type, category, amount, title, description, date, month_year, recorded_by, receipt_code)
VALUES
(1, 'MASUK', 'Saldo Awal', 18500000, 'Saldo Kas Awal Bulan November 2026', 'Sisa saldo kas RT bulan Oktober yang dialihkan ke November', '2026-11-01', 'November 2026', 'Bendahara RT 013', 'KAS-IN-001'),
(2, 'MASUK', 'Iuran Warga', 420000, 'Penerimaan Iuran Warga (3 Unit)', 'Pembayaran iuran Blok A01, A02, dan C10', '2026-11-04', 'November 2026', 'Bendahara RT 013', 'KAS-IN-002'),
(3, 'KELUAR', 'Honor Satpam', 3500000, 'Honor Keamanan Satpam Lingkungan Shift Malam & Pagi', 'Pembayaran honor 2 petugas satpam lingkungan RT 013', '2026-11-03', 'November 2026', 'Bendahara RT 013', 'KAS-OUT-001'),
(4, 'KELUAR', 'Pengangkutan Sampah', 1200000, 'Iuran Pengangkutan Sampah DLHK Depok', 'Biaya retribusi kebersihan dan armada sampah lingkungan', '2026-11-04', 'November 2026', 'Bendahara RT 013', 'KAS-OUT-002'),
(5, 'KELUAR', 'Perbaikan Fasum', 450000, 'Penggantian Lampu PJU Blok B & Balai RT', 'Pembelian 3 unit LED Philips 40W outdoor dan kabel pelindung', '2026-11-05', 'November 2026', 'Bendahara RT 013', 'KAS-OUT-003')
ON CONFLICT (id) DO NOTHING;

SELECT setval('cash_transactions_id_seq', (SELECT MAX(id) FROM cash_transactions));

-- 5. Seed Booking Fasum
INSERT INTO facility_bookings (id, facility_name, resident_id, resident_name, house_unit, date, time_slot, purpose, status, booking_fee, notes)
VALUES
(1, 'Lapangan Badminton Purimas', 2, 'Ibu Sri Wahyuni', 'Blok A No. 02', '2026-11-10', '19:00 - 22:00 WIB', 'Latihan Bulutangkis Warga Ibu-Ibu RT 013', 'DISETUJUI', 0, 'Disetujui. Harap jaga kebersihan shuttlecock bekas.'),
(2, 'Balai Pertemuan Warga RT 13', 3, 'Bpk. Bambang Sutrisno', 'Blok B No. 05', '2026-11-15', '13:00 - 17:00 WIB', 'Syukuran Khitanan Keluarga', 'DISETUJUI', 50000, 'Kontribusi kebersihan balai RT Rp 50.000'),
(3, 'Lapangan Badminton Purimas', 4, 'Bpk. Rizky Ramadhan', 'Blok B No. 06', '2026-11-12', '16:00 - 18:00 WIB', 'Main Santai Pemuda Blok B', 'MENUNGGU_PERSETUJUAN', 0, 'Menunggu konfirmasi jadwal ketua seksi pemuda')
ON CONFLICT (id) DO NOTHING;

SELECT setval('facility_bookings_id_seq', (SELECT MAX(id) FROM facility_bookings));

-- 6. Seed Forum Posts & Comments
INSERT INTO forum_posts (id, author_name, author_unit, author_role, title, content, category, likes_count)
VALUES
(1, 'Bpk. Hendra Gunawan', 'Blok A No. 01', 'Ketua RT', 'Rencana Kerja Bakti Saluran Air Menyambut Musim Hujan', 'Bapak/Ibu sekalian, Minggu 15 November pagi kita jadwalkan kerja bakti membersihkan got saluran utama depan gerbang barat. Mohon partisipasi tiap rumah perwakilan 1 orang.', 'Gotong Royong', 12),
(2, 'Bpk. Agung Prasetyo', 'Blok C No. 10', 'Pengurus RT', 'Laporan Penerangan PJU Blok B yang Selesai Diperbaiki', 'Alhamdulillah 3 lampu sorot PJU yang sempat redup di tikungan Blok B sudah diganti baru hari ini. Terima kasih kepada tim kebersihan.', 'Info Warga', 8)
ON CONFLICT (id) DO NOTHING;

SELECT setval('forum_posts_id_seq', (SELECT MAX(id) FROM forum_posts));

INSERT INTO forum_comments (id, post_id, author_name, author_unit, comment_text)
VALUES
(1, 1, 'Bpk. Bambang Sutrisno', 'Blok B No. 05', 'Siap Pak RT, insya Allah saya hadir bawa cangkul dan karung sampah.'),
(2, 1, 'Ibu Sri Wahyuni', 'Blok A No. 02', 'Ibu-ibu siap bantu konsumsi kopi, teh, dan gorengan pagi.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('forum_comments_id_seq', (SELECT MAX(id) FROM forum_comments));

-- 7. Seed Pengumuman Lingkungan
INSERT INTO announcements (id, title, content, category, author, is_pinned)
VALUES
(1, 'Jatuh Tempo Pembayaran Iuran Warga Bulan November', 'Mengingatkan kembali batas jatuh tempo pembayaran iuran bulanan RT 013 (Rp 140.000) adalah tanggal 25 November. Pembayaran dapat dilakukan via Virtual Account atau QRIS di aplikasi.', 'IURAN', 'Bendahara RT 013', true),
(2, 'Peningkatan Kewaspadaan & Patroli Ronda Malam', 'Mengingat menjelang akhir tahun, jadwal ronda malam satpam dan warga ditingkatkan. Portal timur ditutup mulai pukul 23:00 WIB.', 'DARURAT', 'Seksi Keamanan RT 013', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('announcements_id_seq', (SELECT MAX(id) FROM announcements));

-- 8. Seed Dokumen RT
INSERT INTO documents (id, title, category, file_number, description, issue_date, official_signatory, content_body)
VALUES
(1, 'Tata Tertib Kehidupan Bertetangga Lingkungan Purimas RT 013', 'Tata Tertib', '001/SK-TT/RT013/2026', 'Panduan kerukunan, jam tenang, renovasi bangunan, dan hewan peliharaan di perumahan.', '2026-01-05', 'Ketua RT 013 / RW 003', '1. Jam tenang lingkungan berlaku pukul 22:00 - 05:00 WIB. 2. Renovasi yang menimbulkan kebisingan hanya diperbolehkan Senin - Sabtu pukul 08:00 - 17:00 WIB.'),
(2, 'Surat Pengantar Pembuatan / Perpanjangan KTP-el', 'Surat Pengantar', '042/SP-RT013/TRJ/XI/2026', 'Format template surat pengantar warga untuk keperluan administrasi kependudukan di Kelurahan Tirtajaya.', '2026-11-01', 'Ketua RT 013 / RW 003', 'Menerangkan bahwa pemohon adalah benar warga sah berdomisili di RT 013 RW 003 Purimas Tirtajaya.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));
