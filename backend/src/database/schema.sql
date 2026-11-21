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

-- Purimas portal: real households, review workflow and private identity files.
ALTER TABLE residents ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS nik VARCHAR(16) DEFAULT '';
ALTER TABLE residents ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;
CREATE TABLE IF NOT EXISTS portal_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY,
  resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  nik VARCHAR(16) NOT NULL DEFAULT '',
  relationship VARCHAR(50) NOT NULL,
  gender VARCHAR(30) NOT NULL DEFAULT '',
  birth_place VARCHAR(100) NOT NULL DEFAULT '',
  birth_date DATE,
  occupation VARCHAR(100) NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY,
  resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  brand VARCHAR(100) NOT NULL DEFAULT '',
  color VARCHAR(50) NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS private_attachments (
  id UUID PRIMARY KEY,
  resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  kind VARCHAR(10) NOT NULL CHECK (kind IN ('KTP','KK')),
  member_ref UUID,
  original_name VARCHAR(200) NOT NULL,
  storage_name TEXT NOT NULL UNIQUE,
  mime_type VARCHAR(60) NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 8388608),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(30) NOT NULL CHECK (type IN ('PERUBAHAN_DATA','ADMINISTRASI')),
  title VARCHAR(200) NOT NULL,
  payload JSONB NOT NULL,
  base_revision INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'MENUNGGU' CHECK (status IN ('MENUNGGU','DISETUJUI','DITOLAK')),
  reviewer_id INTEGER REFERENCES users(id),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_profile_change ON submissions(resident_id)
  WHERE type = 'PERUBAHAN_DATA' AND status = 'MENUNGGU';
CREATE TABLE IF NOT EXISTS submission_files (
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES private_attachments(id),
  PRIMARY KEY(submission_id, attachment_id)
);
CREATE TABLE IF NOT EXISTS verified_attachments (
  resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES private_attachments(id),
  PRIMARY KEY(resident_id, attachment_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_id INTEGER REFERENCES users(id),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_submissions_resident ON submissions(resident_id, status);
CREATE INDEX IF NOT EXISTS idx_attachments_resident ON private_attachments(resident_id);
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS bill_id INTEGER REFERENCES bills(id);
CREATE UNIQUE INDEX IF NOT EXISTS one_cash_entry_per_bill ON cash_transactions(bill_id) WHERE bill_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_monthly_bill ON bills(resident_id,year,month_index);
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS resident_id INTEGER REFERENCES residents(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS submission_id BIGINT REFERENCES submissions(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS source_report VARCHAR(200);
CREATE UNIQUE INDEX IF NOT EXISTS one_account_per_household ON users(resident_id) WHERE resident_id IS NOT NULL;
ALTER TABLE bills ALTER COLUMN due_date DROP DEFAULT;

-- Citizen payment confirmations; only the treasurer can post the resulting cash.
ALTER TABLE private_attachments DROP CONSTRAINT IF EXISTS private_attachments_kind_check;
ALTER TABLE private_attachments ADD CONSTRAINT private_attachments_kind_check CHECK(kind IN ('KTP','KK','BUKTI','KAS'));
CREATE TABLE IF NOT EXISTS payment_requests (
  id BIGSERIAL PRIMARY KEY,
  resident_id INTEGER NOT NULL REFERENCES residents(id),
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL CHECK(amount>0),
  channel VARCHAR(20) NOT NULL CHECK(channel IN ('TRANSFER','TUNAI')),
  paid_date DATE NOT NULL,
  reference VARCHAR(100) NOT NULL DEFAULT '',
  attachment_id UUID REFERENCES private_attachments(id),
  status VARCHAR(20) NOT NULL DEFAULT 'MENUNGGU' CHECK(status IN ('MENUNGGU','DISETUJUI','DITOLAK')),
  note TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payment_request_items (
  payment_request_id BIGINT NOT NULL REFERENCES payment_requests(id),
  bill_id INTEGER NOT NULL REFERENCES bills(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY(payment_request_id,bill_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_payment_per_bill ON payment_request_items(bill_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_payment_requests_resident ON payment_requests(resident_id,status);

-- Data tambahan pada kartu keluarga; data lama tetap tersedia.
ALTER TABLE residents ADD COLUMN IF NOT EXISTS kk_number VARCHAR(16) NOT NULL DEFAULT '';
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS kk_details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS kk_address JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Persistent account-level login throttling; only a one-way username digest is stored.
CREATE TABLE IF NOT EXISTS security_login_attempts (
    account_digest CHAR(64) PRIMARY KEY,
    attempts INTEGER NOT NULL,
    window_until TIMESTAMPTZ NOT NULL,
    locked_until TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS security_login_attempts_expiry ON security_login_attempts(window_until);

-- Tanggal penerbitan KK; kosong jika belum diketahui.
ALTER TABLE residents ADD COLUMN IF NOT EXISTS kk_issue_date DATE;

-- Preserve the submitted comparison baseline and link corrected submissions.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS base_profile JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS retry_of BIGINT REFERENCES submissions(id);
CREATE INDEX IF NOT EXISTS idx_submissions_retry_of ON submissions(retry_of);

-- Private evidence for non-dues cash movements; historical entries remain valid.
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS attachment_id UUID REFERENCES private_attachments(id);
CREATE UNIQUE INDEX IF NOT EXISTS one_cash_transaction_per_proof ON cash_transactions(attachment_id) WHERE attachment_id IS NOT NULL;
