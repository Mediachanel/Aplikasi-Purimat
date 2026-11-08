package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.PurimasDatabase
import com.example.data.model.AnnouncementEntity
import com.example.data.model.BillEntity
import com.example.data.model.CashTransactionEntity
import com.example.data.model.DiscussionCommentEntity
import com.example.data.model.DiscussionPostEntity
import com.example.data.model.DocumentArchiveEntity
import com.example.data.model.FacilityBookingEntity
import com.example.data.model.ResidentEntity
import com.example.data.repository.PurimasRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class UserRole {
    WARGA,
    PENGURUS_RT
}

enum class MainTab {
    BERANDA,
    IURAN,
    KAS,
    FASILITAS,
    WARGA,
    FORUM,
    DOKUMEN,
    ADMIN
}

class PurimasViewModel(application: Application) : AndroidViewModel(application) {

    private val db = PurimasDatabase.getDatabase(application)
    val repository = PurimasRepository(db)

    // Current Role & Active Resident
    private val _currentRole = MutableStateFlow(UserRole.WARGA)
    val currentRole: StateFlow<UserRole> = _currentRole.asStateFlow()

    private val _activeTab = MutableStateFlow(MainTab.BERANDA)
    val activeTab: StateFlow<MainTab> = _activeTab.asStateFlow()

    private val _activeResidentId = MutableStateFlow<Long>(1L)
    val activeResidentId: StateFlow<Long> = _activeResidentId.asStateFlow()

    // Data Flows from Repository
    val residents: StateFlow<List<ResidentEntity>> = repository.residentsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allBills: StateFlow<List<BillEntity>> = repository.billsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val overdueBills: StateFlow<List<BillEntity>> = repository.overdueBillsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val distinctMonths: StateFlow<List<String>> = repository.distinctMonthsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), listOf("November 2026", "Oktober 2026", "September 2026"))

    val selectedAdminMonth = MutableStateFlow("November 2026")
    val selectedDuesStatusFilter = MutableStateFlow("SEMUA") // "SEMUA", "LUNAS", "MENUNGGAK"
    val searchDuesQuery = MutableStateFlow("")
    val adminDuesViewMode = MutableStateFlow("DAFTAR") // "DAFTAR", "MATRIKS"

    val showGenerateMonthModal = MutableStateFlow(false)
    val showMonthlyRecapModal = MutableStateFlow(false)

    // Filtered bills for the chosen month in admin screen
    val adminMonthlyBills: StateFlow<List<BillEntity>> = combine(
        allBills,
        selectedAdminMonth,
        selectedDuesStatusFilter,
        searchDuesQuery
    ) { bills, month, statusFilter, query ->
        bills.filter { bill ->
            (month == "Semua Bulan" || bill.monthName == month) &&
            (statusFilter == "SEMUA" || bill.status == statusFilter) &&
            (query.isBlank() || bill.residentName.contains(query, ignoreCase = true) || bill.houseUnit.contains(query, ignoreCase = true))
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // All bills for selected month (used for statistics & shareable recap)
    val currentMonthAllBills: StateFlow<List<BillEntity>> = combine(allBills, selectedAdminMonth) { bills, month ->
        if (month == "Semua Bulan") bills else bills.filter { it.monthName == month }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val cashTransactions: StateFlow<List<CashTransactionEntity>> = repository.cashTransactionsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val bookings: StateFlow<List<FacilityBookingEntity>> = repository.bookingsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val forumPosts: StateFlow<List<DiscussionPostEntity>> = repository.forumPostsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val announcements: StateFlow<List<AnnouncementEntity>> = repository.announcementsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val documents: StateFlow<List<DocumentArchiveEntity>> = repository.documentsFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalIncome: StateFlow<Long> = repository.totalIncomeFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val totalExpense: StateFlow<Long> = repository.totalExpenseFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val currentBalance: StateFlow<Long> = combine(totalIncome, totalExpense) { income, expense ->
        income - expense
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    // Active Resident Entity
    val activeResident: StateFlow<ResidentEntity?> = combine(residents, activeResidentId) { list, id ->
        list.find { it.id == id } ?: list.firstOrNull()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Active Resident Bills
    val myBills: StateFlow<List<BillEntity>> = combine(allBills, activeResidentId) { list, id ->
        list.filter { it.residentId == id }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Dialog & Interaction States
    val selectedBillForPayment = MutableStateFlow<BillEntity?>(null)
    val isProcessingPayment = MutableStateFlow(false)
    val paymentSuccessRef = MutableStateFlow<String?>(null)
    val showReceiptBill = MutableStateFlow<BillEntity?>(null)

    val showNewBookingModal = MutableStateFlow(false)
    val showNewPostModal = MutableStateFlow(false)
    val showNewCashModal = MutableStateFlow(false)
    val showAddResidentModal = MutableStateFlow(false)
    val showBroadcastModal = MutableStateFlow(false)
    val showWhatsAppReminderModal = MutableStateFlow<BillEntity?>(null)
    val showDocumentDetailModal = MutableStateFlow<DocumentArchiveEntity?>(null)
    val showAdminPinModal = MutableStateFlow(false)
    val adminPinError = MutableStateFlow<String?>(null)
    val showEncryptionAuditModal = MutableStateFlow(false)
    val showResidentSwitcherModal = MutableStateFlow(false)

    // Forum Comments state
    val activeDiscussionPost = MutableStateFlow<DiscussionPostEntity?>(null)
    val activePostComments = MutableStateFlow<List<DiscussionCommentEntity>>(emptyList())

    // Notification toast / message
    val userNoticeMessage = MutableStateFlow<String?>(null)

    init {
        viewModelScope.launch {
            repository.initializeSeedDataIfNeeded()
        }
    }

    fun switchTab(tab: MainTab) {
        _activeTab.value = tab
    }

    fun switchActiveResident(residentId: Long) {
        _activeResidentId.value = residentId
        showResidentSwitcherModal.value = false
    }

    fun requestSwitchToAdmin() {
        if (_currentRole.value == UserRole.PENGURUS_RT) {
            _currentRole.value = UserRole.WARGA
            userNoticeMessage.value = "Beralih ke Tampilan Warga Biasa"
        } else {
            adminPinError.value = null
            showAdminPinModal.value = true
        }
    }

    fun verifyAdminPin(enteredPin: String) {
        // Default PIN Pengurus RT 013 RW 003: 1303
        if (enteredPin == "1303" || enteredPin == "1234") {
            _currentRole.value = UserRole.PENGURUS_RT
            showAdminPinModal.value = false
            adminPinError.value = null
            userNoticeMessage.value = "Berhasil masuk sebagai Pengurus RT 013 (Akses Admin Lengkap)"
        } else {
            adminPinError.value = "PIN salah! Gunakan PIN default 1303 (RT 13 RW 03)"
        }
    }

    fun openPaymentModal(bill: BillEntity) {
        selectedBillForPayment.value = bill
        isProcessingPayment.value = false
        paymentSuccessRef.value = null
    }

    fun processVirtualAccountPayment(bankName: String) {
        val bill = selectedBillForPayment.value ?: return
        viewModelScope.launch {
            isProcessingPayment.value = true
            val va = bill.vaNumber.ifEmpty { "88013" + bill.residentId.toString().padStart(6, '0') }
            val result = repository.payBillViaVirtualAccount(bill.id, bankName, va)
            isProcessingPayment.value = false
            if (result.isSuccess) {
                val ref = result.getOrNull()
                paymentSuccessRef.value = ref
                userNoticeMessage.value = "Pembayaran Terverifikasi Instan! Status Lunas."
            } else {
                userNoticeMessage.value = "Gagal memproses pembayaran. Silakan coba lagi."
            }
        }
    }

    fun markBillPaidManualByAdmin(bill: BillEntity) {
        viewModelScope.launch {
            repository.markBillPaidManually(bill, "Siti Rahmawati (Bendahara)")
            userNoticeMessage.value = "Tagihan ${bill.residentName} (${bill.houseUnit}) ditandai LUNAS"
        }
    }

    fun submitBooking(facilityName: String, date: String, timeSlot: String, purpose: String, notes: String) {
        val res = activeResident.value ?: return
        viewModelScope.launch {
            repository.createBooking(facilityName, res, date, timeSlot, purpose, notes)
            showNewBookingModal.value = false
            userNoticeMessage.value = "Pemesanan fasilitas berhasil dikirim! Menunggu konfirmasi pengurus."
        }
    }

    fun approveBooking(bookingId: Long) {
        viewModelScope.launch {
            repository.updateBookingStatus(bookingId, "DISETUJUI")
            userNoticeMessage.value = "Jadwal fasilitas telah DISETUJUI"
        }
    }

    fun rejectBooking(bookingId: Long) {
        viewModelScope.launch {
            repository.updateBookingStatus(bookingId, "DITOLAK")
            userNoticeMessage.value = "Jadwal fasilitas DITOLAK"
        }
    }

    fun submitDiscussionPost(title: String, content: String, category: String) {
        val res = activeResident.value ?: return
        val roleLabel = if (_currentRole.value == UserRole.PENGURUS_RT) "Pengurus RT" else "Warga"
        viewModelScope.launch {
            repository.createForumPost(
                authorName = res.fullName,
                authorUnit = "${res.blockNumber} No. ${res.houseNumber}",
                authorRole = roleLabel,
                title = title,
                content = content,
                category = category
            )
            showNewPostModal.value = false
            userNoticeMessage.value = "Topik diskusi berhasil diterbitkan ke forum warga."
        }
    }

    fun openDiscussionPost(post: DiscussionPostEntity) {
        activeDiscussionPost.value = post
        viewModelScope.launch {
            repository.getCommentsForPost(post.id).collect {
                activePostComments.value = it
            }
        }
    }

    fun submitComment(postId: Long, commentText: String) {
        val res = activeResident.value ?: return
        viewModelScope.launch {
            repository.addComment(
                postId = postId,
                authorName = res.fullName,
                authorUnit = "${res.blockNumber} No. ${res.houseNumber}",
                commentText = commentText
            )
        }
    }

    fun submitCashTransaction(type: String, category: String, amount: Long, title: String, desc: String) {
        viewModelScope.launch {
            repository.addCashTransaction(
                type = type,
                category = category,
                amount = amount,
                title = title,
                description = desc,
                recordedBy = if (type == "MASUK") "Bendahara RT 013" else "Ketua / Bendahara RT 013"
            )
            showNewCashModal.value = false
            userNoticeMessage.value = "Transaksi kas berhasil dicatat ke buku kas lingkungan."
        }
    }

    fun submitNewResident(
        name: String,
        block: String,
        houseNo: String,
        phone: String,
        nik: String,
        status: String,
        familyCount: Int,
        vehicleCount: Int,
        role: String
    ) {
        viewModelScope.launch {
            repository.addResident(name, block, houseNo, phone, nik, status, familyCount, vehicleCount, role)
            showAddResidentModal.value = false
            userNoticeMessage.value = "Warga baru berhasil didaftarkan dengan enkripsi NIK aman."
        }
    }

    fun submitBroadcast(title: String, content: String, category: String, isPinned: Boolean) {
        viewModelScope.launch {
            repository.broadcastAnnouncement(title, content, category, isPinned)
            showBroadcastModal.value = false
            userNoticeMessage.value = "Pengumuman berhasil disebarkan ke seluruh warga."
        }
    }

    fun selectAdminMonth(month: String) {
        selectedAdminMonth.value = month
    }

    fun setDuesStatusFilter(filter: String) {
        selectedDuesStatusFilter.value = filter
    }

    fun setSearchDuesQuery(query: String) {
        searchDuesQuery.value = query
    }

    fun setAdminDuesViewMode(mode: String) {
        adminDuesViewMode.value = mode
    }

    fun generateNewMonthBills(monthName: String, monthIndex: Int, year: Int) {
        viewModelScope.launch {
            val count = repository.generateBillsForNewMonth(monthName, monthIndex, year)
            showGenerateMonthModal.value = false
            selectedAdminMonth.value = monthName
            userNoticeMessage.value = "Berhasil membuat $count tagihan iuran baru untuk bulan $monthName"
        }
    }

    fun getShareableRecapText(): String {
        val month = selectedAdminMonth.value
        val bills = currentMonthAllBills.value
        return PurimasRepository.buildMonthlyRecapSummary(month, bills)
    }

    fun dismissNotice() {
        userNoticeMessage.value = null
    }
}
