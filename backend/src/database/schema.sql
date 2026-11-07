-- =============================================================================
-- Skema Database PostgreSQL untuk Aplikasi RT Purimas Tirtajaya (RT 013 RW 003)
-- =============================================================================

-- 1. Tabel Warga (Residents)
CREATE TABLE IF NOT EXISTS residents (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    block_number VARCHAR(50) NOT NULL,
    house_number VARCHAR(50) NOT NULL,
    phone_number VARCHAR(30) NOT NULL UNIQUE,
    encrypted_nik TEXT,
    occupancy_status VARCHAR(50) NOT NULL DEFAULT 'Pemilik Tetap',
    family_members_count INT DEFAULT 3,
    vehicle_count INT DEFAULT 2,
    role VARCHAR(30) DEFAULT 'WARGA',
    join_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Akun Pengguna / Autentikasi (Users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    resident_id INT REFERENCES residents(id) ON DELETE SET NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'WARGA', -- 'WARGA' atau 'PENGURUS'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Tagihan & Iuran Warga (Bills)
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    resident_name VARCHAR(150) NOT NULL,
    house_unit VARCHAR(100) NOT NULL,
    month_name VARCHAR(50) NOT NULL,
    month_index INT NOT NULL,
    year INT NOT NULL DEFAULT 2026,
    amount BIGINT NOT NULL DEFAULT 140000,
    status VARCHAR(30) NOT NULL DEFAULT 'MENUNGGAK', -- 'LUNAS', 'MENUNGGAK', 'PENDING_VERIFIKASI'
    due_date VARCHAR(20) DEFAULT '25',
    va_number VARCHAR(50) DEFAULT '',
    bank_name VARCHAR(100) DEFAULT 'BCA Virtual Account',
    paid_at TIMESTAMP WITH TIME ZONE,
    transaction_ref VARCHAR(100),
    payment_channel VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Buku Kas Lingkungan (Cash Transactions)
CREATE TABLE IF NOT EXISTS cash_transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'MASUK' atau 'KELUAR'
    category VARCHAR(100) NOT NULL,
    amount BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    month_year VARCHAR(50) NOT NULL,
    recorded_by VARCHAR(100) NOT NULL DEFAULT 'Bendahara RT 013',
    receipt_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Booking Fasilitas Umum (Facility Bookings)
CREATE TABLE IF NOT EXISTS facility_bookings (
    id SERIAL PRIMARY KEY,
    facility_name VARCHAR(150) NOT NULL,
    resident_id INT REFERENCES residents(id) ON DELETE SET NULL,
    resident_name VARCHAR(150) NOT NULL,
    house_unit VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'MENUNGGU_PERSETUJUAN', -- 'DISETUJUI', 'MENUNGGU_PERSETUJUAN', 'DITOLAK'
    booking_fee BIGINT DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Forum Diskusi & Aduan Warga (Forum Posts)
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    author_name VARCHAR(150) NOT NULL,
    author_unit VARCHAR(100) NOT NULL,
    author_role VARCHAR(50) DEFAULT 'Warga',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Komentar Forum
CREATE TABLE IF NOT EXISTS forum_comments (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_name VARCHAR(150) NOT NULL,
    author_unit VARCHAR(100) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Pengumuman & Broadcast RT (Announcements)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'DARURAT', 'KEGIATAN', 'IURAN', 'INFORMASI'
    author VARCHAR(100) DEFAULT 'Pengurus RT 013 RW 003',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Arsip Dokumen RT (Documents)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_number VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    issue_date DATE DEFAULT CURRENT_DATE,
    official_signatory VARCHAR(150) DEFAULT 'Ketua RT 013 / RW 003',
    content_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_bills_resident_id ON bills(resident_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_cash_type ON cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_date ON cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON facility_bookings(date);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
