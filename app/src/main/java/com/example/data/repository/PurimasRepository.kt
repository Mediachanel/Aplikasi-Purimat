package com.example.data.repository

import com.example.data.local.PurimasDatabase
import com.example.data.model.AnnouncementEntity
import com.example.data.model.BillEntity
import com.example.data.model.CashTransactionEntity
import com.example.data.model.DiscussionCommentEntity
import com.example.data.model.DiscussionPostEntity
import com.example.data.model.DocumentArchiveEntity
import com.example.data.model.FacilityBookingEntity
import com.example.data.model.ResidentEntity
import com.example.data.security.DataEncryptionUtil
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class PurimasRepository(private val db: PurimasDatabase) {

    val residentsFlow: Flow<List<ResidentEntity>> = db.residentDao().getAllResidents()
    val billsFlow: Flow<List<BillEntity>> = db.billDao().getAllBills()
    val overdueBillsFlow: Flow<List<BillEntity>> = db.billDao().getOverdueBills()
    val cashTransactionsFlow: Flow<List<CashTransactionEntity>> = db.cashDao().getAllTransactions()
    val bookingsFlow: Flow<List<FacilityBookingEntity>> = db.bookingDao().getAllBookings()
    val forumPostsFlow: Flow<List<DiscussionPostEntity>> = db.forumDao().getAllPosts()
    val announcementsFlow: Flow<List<AnnouncementEntity>> = db.announcementDao().getAllAnnouncements()
    val documentsFlow: Flow<List<DocumentArchiveEntity>> = db.documentDao().getAllDocuments()

    val totalIncomeFlow: Flow<Long> = db.cashDao().getTotalIncomeFlow()
    val totalExpenseFlow: Flow<Long> = db.cashDao().getTotalExpenseFlow()

    suspend fun getResidentBills(residentId: Long): Flow<List<BillEntity>> {
        return db.billDao().getBillsByResident(residentId)
    }

    suspend fun getCommentsForPost(postId: Long): Flow<List<DiscussionCommentEntity>> {
        return db.forumDao().getCommentsForPost(postId)
    }

    /**
     * Inisialisasi Data Default Purimas Tirtajaya jika database baru
     */
    suspend fun initializeSeedDataIfNeeded() = withContext(Dispatchers.IO) {
        if (db.residentDao().getResidentCount() > 0) return@withContext

        // 1. Seed Warga RT 013 RW 003 Purimas Tirtajaya
        val initialResidents = listOf(
            ResidentEntity(
                fullName = "Bpk. Hendra Gunawan",
                blockNumber = "Blok A",
                houseNumber = "01",
                phoneNumber = "081289123456",
                encryptedNik = DataEncryptionUtil.encrypt("3276021203800001"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 4,
                vehicleCount = 2,
                role = "WARGA"
            ),
            ResidentEntity(
                fullName = "Bpk. Bambang Sulistyo (Ketua RT 013)",
                blockNumber = "Blok A",
                houseNumber = "05",
                phoneNumber = "081377889900",
                encryptedNik = DataEncryptionUtil.encrypt("3276021508750002"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 3,
                vehicleCount = 2,
                role = "PENGURUS"
            ),
            ResidentEntity(
                fullName = "Ibu Siti Rahmawati (Bendahara RT)",
                blockNumber = "Blok B",
                houseNumber = "03",
                phoneNumber = "085611223344",
                encryptedNik = DataEncryptionUtil.encrypt("3276025211820003"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 4,
                vehicleCount = 1,
                role = "PENGURUS"
            ),
            ResidentEntity(
                fullName = "Bpk. Ahmad Fauzan (Sekretaris RT)",
                blockNumber = "Blok B",
                houseNumber = "12",
                phoneNumber = "081900112233",
                encryptedNik = DataEncryptionUtil.encrypt("3276020904870004"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 3,
                vehicleCount = 2,
                role = "PENGURUS"
            ),
            ResidentEntity(
                fullName = "Bpk. Denny Hermawan",
                blockNumber = "Blok B",
                houseNumber = "14",
                phoneNumber = "081299887766",
                encryptedNik = DataEncryptionUtil.encrypt("3276021706850005"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 5,
                vehicleCount = 2,
                role = "WARGA"
            ),
            ResidentEntity(
                fullName = "Ibu Maya Kartika",
                blockNumber = "Blok C",
                houseNumber = "02",
                phoneNumber = "081822334455",
                encryptedNik = DataEncryptionUtil.encrypt("3276026401900006"),
                occupancyStatus = "Pengontrak / Penyewa",
                familyMembersCount = 2,
                vehicleCount = 1,
                role = "WARGA"
            ),
            ResidentEntity(
                fullName = "Bpk. Rian Pratama",
                blockNumber = "Blok C",
                houseNumber = "08",
                phoneNumber = "085712349876",
                encryptedNik = DataEncryptionUtil.encrypt("3276022005880007"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 3,
                vehicleCount = 1,
                role = "WARGA"
            ),
            ResidentEntity(
                fullName = "Bpk. Gunawan Wibisono",
                blockNumber = "Blok D",
                houseNumber = "04",
                phoneNumber = "081234567890",
                encryptedNik = DataEncryptionUtil.encrypt("3276021112830008"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 4,
                vehicleCount = 3,
                role = "WARGA"
            ),
            ResidentEntity(
                fullName = "Ibu Linda Kusuma",
                blockNumber = "Blok D",
                houseNumber = "11",
                phoneNumber = "087812983476",
                encryptedNik = DataEncryptionUtil.encrypt("3276024507890009"),
                occupancyStatus = "Pemilik Tetap",
                familyMembersCount = 2,
                vehicleCount = 1,
                role = "WARGA"
            ),
            ResidentEntity(
                fullName = "Bpk. Eko Prasetyo",
                blockNumber = "Blok D",
                houseNumber = "15",
                phoneNumber = "081399001122",
                encryptedNik = DataEncryptionUtil.encrypt("3276020509920010"),
                occupancyStatus = "Pengontrak / Penyewa",
                familyMembersCount = 2,
                vehicleCount = 1,
                role = "WARGA"
            )
        )
        db.residentDao().insertAll(initialResidents)

        // 2. Seed Tagihan Iuran Warga (Bulan November 2026 - Rp 140.000)
        // Sebagian lunas, sebagian menunggak untuk simulasi real-time dashboard
        val initialBills = listOf(
            BillEntity(
                residentId = 1,
                residentName = "Bpk. Hendra Gunawan",
                houseUnit = "Blok A No. 01",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "MENUNGGAK",
                dueDate = "25 November 2026",
                vaNumber = "880130001001",
                bankName = "BCA Virtual Account"
            ),
            BillEntity(
                residentId = 1,
                residentName = "Bpk. Hendra Gunawan",
                houseUnit = "Blok A No. 01",
                monthName = "Oktober 2026",
                monthIndex = 10,
                year = 2026,
                amount = 140000L,
                status = "LUNAS",
                dueDate = "25 Oktober 2026",
                vaNumber = "880130001001",
                bankName = "BCA Virtual Account",
                paidAt = "2026-10-22 14:32 WIB",
                transactionRef = "TRX-BCA-992819",
                paymentChannel = "Virtual Account"
            ),
            BillEntity(
                residentId = 2,
                residentName = "Bpk. Bambang Sulistyo",
                houseUnit = "Blok A No. 05",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "LUNAS",
                dueDate = "25 November 2026",
                vaNumber = "880130002005",
                bankName = "Mandiri Virtual Account",
                paidAt = "2026-11-02 09:15 WIB",
                transactionRef = "TRX-MDR-448102",
                paymentChannel = "Virtual Account"
            ),
            BillEntity(
                residentId = 3,
                residentName = "Ibu Siti Rahmawati",
                houseUnit = "Blok B No. 03",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "LUNAS",
                dueDate = "25 November 2026",
                vaNumber = "880130003003",
                bankName = "BRI Virtual Account",
                paidAt = "2026-11-03 11:40 WIB",
                transactionRef = "TRX-BRI-771923",
                paymentChannel = "Virtual Account"
            ),
            BillEntity(
                residentId = 4,
                residentName = "Bpk. Ahmad Fauzan",
                houseUnit = "Blok B No. 12",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "LUNAS",
                dueDate = "25 November 2026",
                vaNumber = "880130004012",
                bankName = "BCA Virtual Account",
                paidAt = "2026-11-04 16:20 WIB",
                transactionRef = "TRX-BCA-102934",
                paymentChannel = "Virtual Account"
            ),
            BillEntity(
                residentId = 5,
                residentName = "Bpk. Denny Hermawan",
                houseUnit = "Blok B No. 14",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "MENUNGGAK",
                dueDate = "25 November 2026",
                vaNumber = "880130005014",
                bankName = "BCA Virtual Account"
            ),
            BillEntity(
                residentId = 6,
                residentName = "Ibu Maya Kartika",
                houseUnit = "Blok C No. 02",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "MENUNGGAK",
                dueDate = "25 November 2026",
                vaNumber = "880130006002",
                bankName = "BNI Virtual Account"
            ),
            BillEntity(
                residentId = 7,
                residentName = "Bpk. Rian Pratama",
                houseUnit = "Blok C No. 08",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "LUNAS",
                dueDate = "25 November 2026",
                vaNumber = "880130007008",
                bankName = "Mandiri Virtual Account",
                paidAt = "2026-11-05 08:50 WIB",
                transactionRef = "TRX-MDR-992384",
                paymentChannel = "Virtual Account"
            ),
            BillEntity(
                residentId = 8,
                residentName = "Bpk. Gunawan Wibisono",
                houseUnit = "Blok D No. 04",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "MENUNGGAK",
                dueDate = "25 November 2026",
                vaNumber = "880130008004",
                bankName = "BCA Virtual Account"
            ),
            BillEntity(
                residentId = 9,
                residentName = "Ibu Linda Kusuma",
                houseUnit = "Blok D No. 11",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "LUNAS",
                dueDate = "25 November 2026",
                vaNumber = "880130009011",
                bankName = "BRI Virtual Account",
                paidAt = "2026-11-01 10:12 WIB",
                transactionRef = "TRX-BRI-384729",
                paymentChannel = "Virtual Account"
            ),
            BillEntity(
                residentId = 10,
                residentName = "Bpk. Eko Prasetyo",
                houseUnit = "Blok D No. 15",
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "MENUNGGAK",
                dueDate = "25 November 2026",
                vaNumber = "880130010015",
                bankName = "BCA Virtual Account"
            )
        )
        db.billDao().insertAll(initialBills)

        // 3. Seed Buku Kas Lingkungan (Masuk & Keluar)
        val initialCash = listOf(
            CashTransactionEntity(
                type = "MASUK",
                category = "Saldo Awal",
                amount = 18500000L,
                title = "Saldo Awal Kas RT 013 RW 003",
                description = "Sisa kas perumahan Purimas Tirtajaya per 31 Oktober 2026",
                date = "2026-11-01",
                monthYear = "November 2026",
                recordedBy = "Siti Rahmawati (Bendahara)",
                receiptCode = "KAS-IN-001"
            ),
            CashTransactionEntity(
                type = "MASUK",
                category = "Iuran Warga",
                amount = 700000L,
                title = "Iuran Warga via VA (5 Rumah)",
                description = "Pembayaran iuran 5 warga yang telah terverifikasi instan",
                date = "2026-11-05",
                monthYear = "November 2026",
                recordedBy = "Sistem Virtual Account",
                receiptCode = "VA-BATCH-NOV01"
            ),
            CashTransactionEntity(
                type = "KELUAR",
                category = "Honor Satpam",
                amount = 3800000L,
                title = "Honor 2 Petugas Keamanan Pos Gerbang",
                description = "Gaji petugas satpam shift siang & malam bulan November",
                date = "2026-11-02",
                monthYear = "November 2026",
                recordedBy = "Siti Rahmawati (Bendahara)",
                receiptCode = "KAS-OUT-001"
            ),
            CashTransactionEntity(
                type = "KELUAR",
                category = "Pengangkutan Sampah",
                amount = 1350000L,
                title = "Retribusi Truk Pengangkut Sampah DLHK Depok",
                description = "Iuran bulanan armada pengangkutan sampah perumahan 3x seminggu",
                date = "2026-11-03",
                monthYear = "November 2026",
                recordedBy = "Siti Rahmawati (Bendahara)",
                receiptCode = "KAS-OUT-002"
            ),
            CashTransactionEntity(
                type = "KELUAR",
                category = "Perbaikan Fasum",
                amount = 450000L,
                title = "Penggantian Lampu PJU Blok B & Sensor Otomatis",
                description = "Beli 3 set bohlam LED 50W Philips & fitting tahan air",
                date = "2026-11-04",
                monthYear = "November 2026",
                recordedBy = "Bambang Sulistyo (Ketua RT)",
                receiptCode = "KAS-OUT-003"
            ),
            CashTransactionEntity(
                type = "MASUK",
                category = "Sewa Fasilitas",
                amount = 150000L,
                title = "Infaq Penggunaan Balai Warga RT 13",
                description = "Infaq kebersihan & listrik syukuran khitanan warga Blok A",
                date = "2026-11-06",
                monthYear = "November 2026",
                recordedBy = "Siti Rahmawati (Bendahara)",
                receiptCode = "KAS-IN-002"
            )
        )
        db.cashDao().insertAll(initialCash)

        // 4. Seed Pemesanan Fasilitas Umum (Booking Fasum)
        val initialBookings = listOf(
            FacilityBookingEntity(
                facilityName = "Lapangan Badminton Purimas",
                residentId = 1,
                residentName = "Bpk. Hendra Gunawan",
                houseUnit = "Blok A No. 01",
                date = "2026-11-14",
                timeSlot = "19:30 - 21:30 WIB",
                purpose = "Latihan Badminton Bersama Warga Blok A & B",
                status = "DISETUJUI",
                bookingFee = 0L,
                createdAt = "2026-11-05",
                notes = "Kunci lapangan di pos satpam gerbang utama"
            ),
            FacilityBookingEntity(
                facilityName = "Balai Pertemuan Warga RT 13",
                residentId = 7,
                residentName = "Bpk. Rian Pratama",
                houseUnit = "Blok C No. 08",
                date = "2026-11-20",
                timeSlot = "09:00 - 13:00 WIB",
                purpose = "Rapat Panitia Kerja Bakti & Posyandu Lansia",
                status = "MENUNGGU_PERSETUJUAN",
                bookingFee = 0L,
                createdAt = "2026-11-06",
                notes = "Memerlukan proyektor dan 30 kursi lipat"
            ),
            FacilityBookingEntity(
                facilityName = "Tenda & Kursi Inventaris RT",
                residentId = 5,
                residentName = "Bpk. Denny Hermawan",
                houseUnit = "Blok B No. 14",
                date = "2026-11-28",
                timeSlot = "08:00 - 18:00 WIB",
                purpose = "Acara Aqiqah Anak Kedua",
                status = "DISETUJUI",
                bookingFee = 100000L,
                createdAt = "2026-11-04",
                notes = "Pinjam 50 kursi dan 2 set tenda plafon"
            )
        )
        db.bookingDao().insertAll(initialBookings)

        // 5. Seed Forum Diskusi Warga
        val initialPosts = listOf(
            DiscussionPostEntity(
                authorName = "Bpk. Bambang Sulistyo",
                authorUnit = "Blok A No. 05",
                authorRole = "Ketua RT",
                title = "Rencana Pemasangan CCTV Tambahan di Tikungan Blok C & D",
                content = "Selamat pagi bapak/ibu warga Purimas Tirtajaya. Menindaklanjuti usulan warga terkait blind spot di area jalan melingkar Blok C dan D, pengurus mengusulkan pengadaan 2 unit CCTV IP Outdoor beresolusi 4MP yang terhubung langsung ke monitor pos satpam. Mohon tanggapan dan masukan warga.",
                category = "Keamanan & Ronda",
                timestamp = "2026-11-06 08:30 WIB",
                likesCount = 14,
                commentCount = 2
            ),
            DiscussionPostEntity(
                authorName = "Ibu Siti Rahmawati",
                authorUnit = "Blok B No. 03",
                authorRole = "Bendahara",
                title = "Transparansi Saldo Kas RT dan Pengingat Iuran Tanggal 25",
                content = "Halo warga RT 013 RW 003. Laporan kas periode berjalan sudah diunggah. Kami informasikan pula per November ini pembayaran iuran Rp 140.000 sudah terintegrasi Virtual Account instan sehingga otomatis lunas tanpa perlu konfirmasi manual. Mohon bayar sebelum tanggal 25.",
                category = "Usulan Lingkungan",
                timestamp = "2026-11-05 14:15 WIB",
                likesCount = 21,
                commentCount = 1
            ),
            DiscussionPostEntity(
                authorName = "Bpk. Hendra Gunawan",
                authorUnit = "Blok A No. 01",
                authorRole = "Warga",
                title = "Jadwal Kerja Bakti Pembersihan Saluran Drainase Menjelang Musim Hujan",
                content = "Mengingat curah hujan di Kota Depok mulai meningkat, bagaimana jika hari Minggu pekan depan kita adakan kerja bakti membersihkan sedimen selokan utama di sepanjang jalan utama perumahan? Sekaligus ramah tamah warga.",
                category = "Gotong Royong",
                timestamp = "2026-11-04 19:45 WIB",
                likesCount = 18,
                commentCount = 2
            )
        )
        db.forumDao().insertAllPosts(initialPosts)

        // Seed Comments
        val initialComments = listOf(
            DiscussionCommentEntity(
                postId = 1,
                authorName = "Bpk. Rian Pratama",
                authorUnit = "Blok C No. 08",
                commentText = "Sangat setuju Pak RT, kebetulan di depan rumah saya sering blind spot saat mobil berpapasan. CCTV sangat bermanfaat.",
                timestamp = "2026-11-06 09:12 WIB"
            ),
            DiscussionCommentEntity(
                postId = 1,
                authorName = "Bpk. Ahmad Fauzan",
                authorUnit = "Blok B No. 12",
                commentText = "Estimasi biaya sekitar Rp 1.400.000 untuk 2 unit dan kabel optic, kas RT kita sangat mencukupi.",
                timestamp = "2026-11-06 10:05 WIB"
            ),
            DiscussionCommentEntity(
                postId = 2,
                authorName = "Ibu Maya Kartika",
                authorUnit = "Blok C No. 02",
                commentText = "Fitur VA sangat praktis Bu Siti, tadi saya sudah coba dan langsung muncul status Lunas.",
                timestamp = "2026-11-05 15:00 WIB"
            ),
            DiscussionCommentEntity(
                postId = 3,
                authorName = "Bpk. Gunawan Wibisono",
                authorUnit = "Blok D No. 04",
                commentText = "Siap hadir Pak Hendra! Dari Blok D kami siapkan pacul dan karung sampah.",
                timestamp = "2026-11-04 20:10 WIB"
            ),
            DiscussionCommentEntity(
                postId = 3,
                authorName = "Bpk. Bambang Sulistyo",
                authorUnit = "Blok A No. 05",
                commentText = "Pengurus siap sediakan konsumsi kopi & snack pagi di pos balai warga.",
                timestamp = "2026-11-04 20:30 WIB"
            )
        )
        initialComments.forEach { db.forumDao().insertComment(it) }

        // 6. Seed Notifikasi Pengumuman Real-Time
        val initialAnnouncements = listOf(
            AnnouncementEntity(
                title = "🚨 Peringatan Keamanan: Portal Otomatis Pukul 23.00 WIB",
                content = "Diberitahukan kepada seluruh warga Purimas Tirtajaya bahwa per 1 November 2026, portal gerbang utama akan ditutup pukul 23:00 - 05:00 WIB. Akses masuk tamu wajib lapor satpam pos jaga.",
                category = "DARURAT",
                timestamp = "07 Nov 2026, 06:00",
                author = "Koordinator Keamanan RT 013",
                isPinned = true
            ),
            AnnouncementEntity(
                title = "📢 Pengingat Iuran Lingkungan Periode November 2026",
                content = "Batas akhir pembayaran iuran bulanan Rp 140.000 adalah tanggal 25 November. Pembayaran dapat dilakukan via Virtual Account instan di aplikasi ini.",
                category = "IURAN",
                timestamp = "05 Nov 2026, 09:00",
                author = "Bendahara RT 013",
                isPinned = true
            ),
            AnnouncementEntity(
                title = "🌿 Jadwal Pemangkasan Dahan Pohon di Jalur Utama",
                content = "Petugas kebersihan akan merapikan dahan pohon rindang yang menutupi kabel PJU pada hari Sabtu pagi. Mohon tidak memarkir mobil di badan jalan utama.",
                category = "KEGIATAN",
                timestamp = "04 Nov 2026, 13:30",
                author = "Sekretariat RT 013",
                isPinned = false
            )
        )
        db.announcementDao().insertAll(initialAnnouncements)

        // 7. Seed Arsip Dokumen Penting Warga
        val initialDocs = listOf(
            DocumentArchiveEntity(
                title = "Tata Tertib Perumahan Purimas Tirtajaya",
                category = "Tata Tertib",
                fileNumber = "DOC/PT/2026/001",
                description = "Pedoman bertetangga, aturan renovasi rumah, batas kecepatan jalan 20 km/jam, dan pengelolaan sampah.",
                issueDate = "10 Januari 2026",
                officialSignatory = "Ketua RT 013 & RW 003 Sukmajaya",
                contentBody = """
                    TATA TERTIB WARGA PERUMAHAN PURIMAS TIRTAJAYA
                    RT 013 RW 003 KELURAHAN TIRTAJAYA KECAMATAN SUKMAJAYA KOTA DEPOK
                    
                    PASAL 1: KETERTIBAN UMUM & LINGKUNGAN
                    1. Kecepatan kendaraan di dalam area cluster maksimal 20 km/jam.
                    2. Dilarang memarkir kendaraan di depan gerbang/pagar rumah tetangga tanpa izin.
                    3. Jam tenang malam dimulai pukul 22.00 WIB. Suara musik atau kegaduhan wajib dikurangi.
                    4. Wajib lapor ke pos satpam jika ada tamu yang menginap lebih dari 1x24 jam.
                    
                    PASAL 2: IURAN & KAS LINGKUNGAN
                    1. Setiap kepala keluarga wajib membayar iuran sebesar Rp 140.000 per bulan.
                    2. Jatuh tempo pembayaran paling lambat tanggal 25 setiap bulannya.
                    3. Alokasi iuran: Keamanan 50%, Kebersihan Sampah 32%, Pemeliharaan Lingkungan 18%.
                    
                    PASAL 3: FASILITAS UMUM & RENOVASI
                    1. Penggunaan Lapangan Badminton & Balai Warga gratis bagi warga dengan reservasi di aplikasi.
                    2. Renovasi rumah yang memakan bahu jalan wajib izin pengurus RT minimal H-7.
                """.trimIndent()
            ),
            DocumentArchiveEntity(
                title = "Formulir Surat Pengantar RT Online",
                category = "Surat Pengantar",
                fileNumber = "DOC/PT/2026/002",
                description = "Format resmi surat pengantar pengurusan KTP-el, Kartu Keluarga, SKCK, dan Akta Kelahiran.",
                issueDate = "01 Februari 2026",
                officialSignatory = "Ketua RT 013 RW 003",
                contentBody = """
                    SURAT PENGANTAR KETUA RUKUN TETANGGA
                    RT 013 / RW 003 KELURAHAN TIRTAJAYA, KECAMATAN SUKMAJAYA, KOTA DEPOK
                    
                    Yang bertanda tangan di bawah ini Ketua RT 013 RW 003 menerangkan bahwa:
                    Nama Lengkap : [Nama Kepala Keluarga]
                    NIK          : [Nomor Induk Kependudukan Terverifikasi]
                    Alamat       : Perumahan Purimas Tirtajaya, Blok [X] No. [Y]
                    
                    Adalah benar warga bertempat tinggal di lingkungan kami, dengan kelakuan baik.
                    Surat pengantar ini diberikan untuk keperluan: [Pengurusan KTP / KK / Surat Domisili / SKCK Kepolisian].
                    
                    Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
                """.trimIndent()
            ),
            DocumentArchiveEntity(
                title = "Jadwal Siskamling & Ronda Malam RT 013",
                category = "Jadwal Siskamling",
                fileNumber = "DOC/PT/2026/003",
                description = "Pembagian regu ronda pendamping satpam pada malam akhir pekan dan kontak darurat pos jaga.",
                issueDate = "01 Maret 2026",
                officialSignatory = "Seksi Keamanan RT 013",
                contentBody = """
                    JADWAL PENDAMPINGAN RONDA MALAM (SABTU & MINGGU)
                    POS SATPAM GERBANG UTAMA PURIMAS TIRTAJAYA
                    
                    Shift Ronda Warga: Pukul 22.00 - 03.00 WIB
                    - Regu 1 (Minggu I)  : Warga Blok A
                    - Regu 2 (Minggu II) : Warga Blok B
                    - Regu 3 (Minggu III): Warga Blok C
                    - Regu 4 (Minggu IV) : Warga Blok D
                    
                    Nomor Telepon Darurat & Layanan Publik Sekitar:
                    - Pos Satpam One-Gate Purimas : 0812-9900-1303
                    - Polsek Sukmajaya (Jl. Merdeka) : (021) 7782-2110
                    - Mako Damkar Kota Depok (GDC)  : (021) 7782-3113
                    - RS HGA (Hasanah Graha Afiah)   : (021) 7782-6267
                    - RS Hermina Depok Margonda     : (021) 7720-2525
                    - Puskesmas Sukmajaya           : (021) 7782-7103
                    - Info KRL Stasiun Depok Lama   : 121 / (021) 121
                    - Call Center Kota Depok 112    : 112 (Bebas Pulsa)
                """.trimIndent()
            ),
            DocumentArchiveEntity(
                title = "AD/ART & Struktur Kepengurusan RT 013 (2025–2028)",
                category = "AD/ART RT",
                fileNumber = "DOC/PT/2025/001",
                description = "Anggaran Dasar dan Susunan Pengurus RT 013 RW 003 Kelurahan Tirtajaya periode 2025–2028.",
                issueDate = "15 Desember 2025",
                officialSignatory = "Lurah Tirtajaya & Ketua RW 003",
                contentBody = """
                    SUSUNAN PENGURUS RT 013 RW 003 PERUMAHAN PURIMAS TIRTAJAYA
                    MASA BAKTI 2025 - 2028
                    
                    - Penasihat        : Bpk. H. Suryadi, S.H.
                    - Ketua RT         : Bpk. Bambang Sulistyo (Blok A/05)
                    - Sekretaris       : Bpk. Ahmad Fauzan (Blok B/12)
                    - Bendahara        : Ibu Siti Rahmawati (Blok B/03)
                    - Seksi Keamanan   : Bpk. Joko Santoso & Regu Satpam
                    - Seksi Kebersihan : Bpk. Eko Prasetyo
                    - Seksi Humas & IT : Bpk. Hendra Gunawan
                """.trimIndent()
            )
        )
        db.documentDao().insertAll(initialDocs)
    }

    /**
     * Simulasi Pembayaran Virtual Account & Verifikasi Instan API Perbankan
     * Mensimulasikan callback gateway perbankan, generate transaksi kas masuk otomatis,
     * serta memperbarui tagihan menjadi 'LUNAS'.
     */
    suspend fun payBillViaVirtualAccount(
        billId: Long,
        bankName: String,
        vaNumber: String
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            // Simulasi panggilan API Perbankan (BCA/Mandiri/BRI/BNI)
            delay(1200)

            val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date()) + " WIB"
            val randomSuffix = UUID.randomUUID().toString().take(6).uppercase()
            val trxRef = "TRX-$bankName-$randomSuffix"

            // 1. Update status tagihan di tabel bills
            db.billDao().markAsPaid(
                billId = billId,
                paidAt = timestamp,
                transactionRef = trxRef,
                paymentChannel = "$bankName (Instant API)"
            )

            // 2. Catat transaksi kas masuk otomatis ke Buku Kas RT
            db.cashDao().insertTransaction(
                CashTransactionEntity(
                    type = "MASUK",
                    category = "Iuran Warga",
                    amount = 140000L,
                    title = "Iuran Warga via $bankName",
                    description = "Verifikasi instan API perbankan $trxRef",
                    date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                    monthYear = "November 2026",
                    recordedBy = "Sistem VA Gateway",
                    receiptCode = trxRef
                )
            )

            Result.success(trxRef)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Tandai Lunas Manual oleh Pengurus RT (misal Warga bayar tunai/cash)
     */
    suspend fun markBillPaidManually(bill: BillEntity, adminName: String) = withContext(Dispatchers.IO) {
        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date()) + " WIB"
        val trxRef = "TUNAI-RT13-" + System.currentTimeMillis().toString().takeLast(6)

        db.billDao().markAsPaid(
            billId = bill.id,
            paidAt = timestamp,
            transactionRef = trxRef,
            paymentChannel = "Tunai Diterima $adminName"
        )

        db.cashDao().insertTransaction(
            CashTransactionEntity(
                type = "MASUK",
                category = "Iuran Warga",
                amount = bill.amount,
                title = "Iuran Tunai ${bill.residentName} (${bill.houseUnit})",
                description = "Pembayaran langsung diterima $adminName",
                date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                monthYear = bill.monthName,
                recordedBy = adminName,
                receiptCode = trxRef
            )
        )
    }

    /**
     * Tambah Catatan Kas Baru (Masuk / Keluar)
     */
    suspend fun addCashTransaction(
        type: String,
        category: String,
        amount: Long,
        title: String,
        description: String,
        recordedBy: String
    ) = withContext(Dispatchers.IO) {
        val code = if (type == "MASUK") "KAS-IN-${System.currentTimeMillis().toString().takeLast(4)}"
        else "KAS-OUT-${System.currentTimeMillis().toString().takeLast(4)}"

        val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val monthYear = SimpleDateFormat("MMMM yyyy", Locale("id", "ID")).format(Date())

        db.cashDao().insertTransaction(
            CashTransactionEntity(
                type = type,
                category = category,
                amount = amount,
                title = title,
                description = description,
                date = date,
                monthYear = monthYear,
                recordedBy = recordedBy,
                receiptCode = code
            )
        )
    }

    /**
     * Booking Fasilitas Umum
     */
    suspend fun createBooking(
        facilityName: String,
        resident: ResidentEntity,
        date: String,
        timeSlot: String,
        purpose: String,
        notes: String
    ) = withContext(Dispatchers.IO) {
        db.bookingDao().insertBooking(
            FacilityBookingEntity(
                facilityName = facilityName,
                residentId = resident.id,
                residentName = resident.fullName,
                houseUnit = "${resident.blockNumber} No. ${resident.houseNumber}",
                date = date,
                timeSlot = timeSlot,
                purpose = purpose,
                status = "MENUNGGU_PERSETUJUAN",
                bookingFee = 0L,
                createdAt = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                notes = notes
            )
        )
    }

    /**
     * Update Status Booking Fasilitas (Admin Approval)
     */
    suspend fun updateBookingStatus(bookingId: Long, newStatus: String) = withContext(Dispatchers.IO) {
        db.bookingDao().updateStatus(bookingId, newStatus)
    }

    /**
     * Buat Topik Diskusi Warga Baru
     */
    suspend fun createForumPost(
        authorName: String,
        authorUnit: String,
        authorRole: String,
        title: String,
        content: String,
        category: String
    ) = withContext(Dispatchers.IO) {
        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date()) + " WIB"
        db.forumDao().insertPost(
            DiscussionPostEntity(
                authorName = authorName,
                authorUnit = authorUnit,
                authorRole = authorRole,
                title = title,
                content = content,
                category = category,
                timestamp = timestamp
            )
        )
    }

    /**
     * Kirim Komentar pada Topik Diskusi
     */
    suspend fun addComment(
        postId: Long,
        authorName: String,
        authorUnit: String,
        commentText: String
    ) = withContext(Dispatchers.IO) {
        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date()) + " WIB"
        db.forumDao().insertComment(
            DiscussionCommentEntity(
                postId = postId,
                authorName = authorName,
                authorUnit = authorUnit,
                commentText = commentText,
                timestamp = timestamp
            )
        )
        db.forumDao().incrementCommentCount(postId)
    }

    /**
     * Tambah Anggota Warga Baru
     */
    suspend fun addResident(
        fullName: String,
        blockNumber: String,
        houseNumber: String,
        phoneNumber: String,
        plainNik: String,
        occupancyStatus: String,
        familyCount: Int,
        vehicleCount: Int,
        role: String
    ) = withContext(Dispatchers.IO) {
        val encryptedNik = DataEncryptionUtil.encrypt(plainNik)
        val resId = db.residentDao().insertResident(
            ResidentEntity(
                fullName = fullName,
                blockNumber = blockNumber,
                houseNumber = houseNumber,
                phoneNumber = phoneNumber,
                encryptedNik = encryptedNik,
                occupancyStatus = occupancyStatus,
                familyMembersCount = familyCount,
                vehicleCount = vehicleCount,
                role = role
            )
        )

        // Otomatis generate tagihan iuran bulan ini untuk warga baru
        val unit = "$blockNumber No. $houseNumber"
        val vaSuffix = (100 + resId).toString()
        db.billDao().insertBill(
            BillEntity(
                residentId = resId,
                residentName = fullName,
                houseUnit = unit,
                monthName = "November 2026",
                monthIndex = 11,
                year = 2026,
                amount = 140000L,
                status = "MENUNGGAK",
                dueDate = "25 November 2026",
                vaNumber = "88013000$vaSuffix",
                bankName = "BCA Virtual Account"
            )
        )
    }

    /**
     * Broadcast Pengumuman Real-time
     */
    suspend fun broadcastAnnouncement(
        title: String,
        content: String,
        category: String,
        isPinned: Boolean
    ) = withContext(Dispatchers.IO) {
        val timestamp = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("id", "ID")).format(Date())
        db.announcementDao().insertAnnouncement(
            AnnouncementEntity(
                title = title,
                content = content,
                category = category,
                timestamp = timestamp,
                author = "Pengurus RT 013 RW 003",
                isPinned = isPinned
            )
        )
    }

    /**
     * Template Pesan Pengingat WhatsApp Tanggal 25
     */
    companion object {
        fun buildWhatsAppReminderText(residentName: String, unit: String, month: String, vaNumber: String, bankName: String): String {
            return """
                *PENGINGAT IURAN LINGKUNGAN RT 013 RW 003*
                *PERUMAHAN PURIMAS TIRTAJAYA DEPOK*
                
                Yth. Bapak/Ibu *$residentName* ($unit),
                
                Salam sejahtera. Pengurus RT 013 RW 003 Kelurahan Tirtajaya mengingatkan bahwa batas waktu pembayaran iuran lingkungan untuk bulan *$month* jatuh tempo pada *tanggal 25*.
                
                💵 *Rincian Iuran:*
                • Iuran Bulanan: *Rp 140.000*
                  - Keamanan 24 Jam (Rp 70.000)
                  - Kebersihan & Pengangkutan Sampah (Rp 45.000)
                  - Kas Pemeliharaan Lingkungan & PJU (Rp 25.000)
                  
                🏦 *Cara Pembayaran Praktis:*
                • Virtual Account: *$bankName*
                • Nomor VA: *$vaNumber*
                (Verifikasi instan otomatis lunas via aplikasi Purimas RT 013)
                
                Partisipasi aktif Bapak/Ibu sangat berarti bagi kenyamanan, keamanan, dan kebersihan lingkungan kita bersama.
                
                Terima kasih atas kerja samanya.
                
                _Hormat kami,_
                *Pengurus RT 013 RW 003 Purimas Tirtajaya*
            """.trimIndent()
        }

        fun formatRupiah(amount: Long): String {
            val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
            format.maximumFractionDigits = 0
            return format.format(amount).replace("Rp", "Rp ")
        }
    }
}
