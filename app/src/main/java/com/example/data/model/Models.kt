package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Data Anggota Warga Perumahan Purimas Tirtajaya
 * RT 013 RW 003 Kelurahan Tirtajaya
 */
@Entity(tableName = "residents")
data class ResidentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val fullName: String,
    val blockNumber: String, // e.g. "Blok A", "Blok B", "Blok C", "Blok D"
    val houseNumber: String, // e.g. "12", "14A"
    val phoneNumber: String, // WhatsApp active number
    val encryptedNik: String, // Encrypted NIK via AES-256
    val occupancyStatus: String, // "Pemilik Tetap", "Pengontrak / Penyewa"
    val familyMembersCount: Int = 3,
    val vehicleCount: Int = 2,
    val role: String = "WARGA", // "WARGA" or "PENGURUS"
    val joinDate: String = "2024-01-15",
    val isActive: Boolean = true
) {
    val fullAddress: String
        get() = "$blockNumber No. $houseNumber, Purimas Tirtajaya (Jl. Kp. Parung Serab)"
}

/**
 * Tagihan Iuran Bulanan Warga (Rp 140.000 / bulan)
 * Rincian:
 * - Keamanan: Rp 70.000
 * - Kebersihan / Sampah: Rp 45.000
 * - Kas Pemeliharaan Lingkungan & PJU: Rp 25.000
 */
@Entity(tableName = "bills")
data class BillEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val residentId: Long,
    val residentName: String,
    val houseUnit: String,
    val monthName: String, // e.g. "November 2026"
    val monthIndex: Int, // 1 - 12
    val year: Int = 2026,
    val amount: Long = 140000L,
    val status: String, // "LUNAS", "MENUNGGAK", "PENDING_VERIFIKASI"
    val dueDate: String = "25", // Jatuh tempo tgl 25 setiap bulan
    val vaNumber: String = "",
    val bankName: String = "BCA Virtual Account",
    val paidAt: String? = null,
    val transactionRef: String? = null,
    val paymentChannel: String? = null // "Virtual Account", "QRIS", "Tunai ke Bendahara"
)

/**
 * Buku Kas Lingkungan (Uang Kas Masuk dan Keluar) RT 013 RW 003
 */
@Entity(tableName = "cash_transactions")
data class CashTransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: String, // "MASUK" or "KELUAR"
    val category: String, // "Iuran Warga", "Honor Satpam", "Pengangkutan Sampah", "Perbaikan Fasum", "Kegiatan RT", "Donasi"
    val amount: Long,
    val title: String,
    val description: String,
    val date: String, // e.g. "2026-11-05"
    val monthYear: String = "November 2026",
    val recordedBy: String = "Bendahara RT 013",
    val receiptCode: String? = null
)

/**
 * Pemesanan Fasilitas Umum Digital (Fasum Purimas)
 */
@Entity(tableName = "facility_bookings")
data class FacilityBookingEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val facilityName: String, // "Lapangan Badminton Purimas", "Balai Pertemuan Warga RT 13", "Gazebo Komunal", "Tenda & Kursi RT"
    val residentId: Long,
    val residentName: String,
    val houseUnit: String,
    val date: String, // e.g. "2026-11-12"
    val timeSlot: String, // "08:00 - 11:00 WIB", "15:00 - 18:00 WIB", "19:00 - 22:00 WIB"
    val purpose: String, // e.g. "Latihan Badminton Warga", "Syukuran Keluarga", "Arisan RT"
    val status: String, // "DISETUJUI", "MENUNGGU_PERSETUJUAN", "DITOLAK"
    val bookingFee: Long = 0L, // Free or small maintenance fee
    val createdAt: String = "2026-11-06",
    val notes: String = ""
)

/**
 * Forum Diskusi Antar Warga & Pengurus
 */
@Entity(tableName = "forum_posts")
data class DiscussionPostEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val authorName: String,
    val authorUnit: String,
    val authorRole: String, // "Warga", "Ketua RT", "Sekretaris", "Koordinator Keamanan"
    val title: String,
    val content: String,
    val category: String, // "Usulan Lingkungan", "Keamanan & Ronda", "Gotong Royong", "Info Warga"
    val timestamp: String,
    val likesCount: Int = 0,
    val commentCount: Int = 0
)

/**
 * Komentar Forum Diskusi
 */
@Entity(tableName = "forum_comments")
data class DiscussionCommentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val postId: Long,
    val authorName: String,
    val authorUnit: String,
    val commentText: String,
    val timestamp: String
)

/**
 * Notifikasi & Pengumuman Real-Time Lingkungan
 */
@Entity(tableName = "announcements")
data class AnnouncementEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val content: String,
    val category: String, // "DARURAT", "KEGIATAN", "IURAN", "INFORMASI"
    val timestamp: String,
    val author: String = "Pengurus RT 013 RW 003",
    val isPinned: Boolean = false,
    val isRead: Boolean = false
)

/**
 * Arsip Dokumen Penting Administrasi Warga
 */
@Entity(tableName = "documents")
data class DocumentArchiveEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val category: String, // "Surat Pengantar", "Tata Tertib", "Jadwal Siskamling", "AD/ART RT", "Surat Edaran"
    val fileNumber: String,
    val description: String,
    val issueDate: String,
    val officialSignatory: String = "Ketua RT 013 / RW 003",
    val contentBody: String
)
