package com.example.ui.screens

import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SportsTennis
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.repository.PurimasRepository
import com.example.ui.components.StatCard
import com.example.ui.components.StatusBadge
import com.example.ui.theme.OnPosterBlueContainer
import com.example.ui.theme.PosterBlueContainer
import com.example.ui.theme.PosterBlueDark
import com.example.ui.theme.PosterBlueLight
import com.example.ui.theme.PosterBluePrimary
import com.example.ui.theme.PosterTerracottaWall
import com.example.ui.theme.PosterYellowBadge
import com.example.ui.theme.PosterYellowContainer
import com.example.ui.theme.StatusDanger
import com.example.ui.theme.StatusSuccess
import com.example.ui.viewmodel.MainTab
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

@Composable
fun HomeScreen(
    viewModel: PurimasViewModel,
    modifier: Modifier = Modifier
) {
    val activeResident by viewModel.activeResident.collectAsState()
    val myBills by viewModel.myBills.collectAsState()
    val currentBalance by viewModel.currentBalance.collectAsState()
    val totalIncome by viewModel.totalIncome.collectAsState()
    val totalExpense by viewModel.totalExpense.collectAsState()
    val announcements by viewModel.announcements.collectAsState()
    val currentRole by viewModel.currentRole.collectAsState()

    var showPosterModal by remember { mutableStateOf(false) }
    var selectedFeatureTab by remember { mutableIntStateOf(0) } // 0: Fitur Pengurus, 1: Layanan Warga

    val currentMonthBill = myBills.find { it.monthIndex == 11 && it.year == 2026 } ?: myBills.firstOrNull()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("home_screen"),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 96.dp)
    ) {

        // =========================================================================
        // 1. HERO SECTION: FOTO ASLI PERUMAHAN PURIMAS TIRTAJAYA + BRANDING POSTER
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 8.dp)
                    .shadow(4.dp, RoundedCornerShape(20.dp)),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // Header Card with Real Purimas Tirtajaya Photo
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(230.dp)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.foto_purimas_asli),
                            contentDescription = "Foto Asli Gerbang Perumahan Purimas Tirtajaya Depok",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )

                        // Elegant gradient overlay
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(
                                            Color.Transparent,
                                            Color(0x55000000),
                                            Color(0xEE0A58CA)
                                        ),
                                        startY = 60f
                                    )
                                )
                        )

                        // Top Badges
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Yellow Pill Badge "Sistem Informasi" like in user reference image
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(30.dp))
                                    .background(PosterYellowBadge)
                                    .padding(horizontal = 12.dp, vertical = 5.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Home,
                                        contentDescription = null,
                                        tint = Color(0xFF1E293B),
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Sistem Informasi",
                                        color = Color(0xFF0F172A),
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            // View Poster Button
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color.White.copy(alpha = 0.9f))
                                    .clickable { showPosterModal = true }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.ZoomIn,
                                        contentDescription = "Lihat Brosur",
                                        tint = PosterBluePrimary,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Lihat Brosur",
                                        color = PosterBluePrimary,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }

                        // Bottom Text Inside Photo Overlay
                        Column(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(16.dp)
                        ) {
                            Text(
                                text = "Perumahan Purimas Tirtajaya",
                                fontSize = 21.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                lineHeight = 24.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Layanan digital warga untuk lingkungan yang lebih tertib, aman, dan nyaman.",
                                fontSize = 11.sp,
                                color = Color(0xFFE0EDFF),
                                lineHeight = 15.sp
                            )
                        }
                    }

                    // Location bar underneath photo
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFF0F7FF))
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = PosterTerracottaWall,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "RT 013 RW 003 • Jl. Kp. Parung Serab, Kel. Tirtajaya, Kec. Sukmajaya, Depok",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = PosterBlueDark
                        )
                    }
                }
            }
        }

        // =========================================================================
        // 2. ACTIVE RESIDENT CARD
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(PosterBlueContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Home,
                                contentDescription = null,
                                tint = PosterBluePrimary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = activeResident?.fullName ?: "Warga Purimas",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                text = activeResident?.fullAddress ?: "Purimas Tirtajaya (Jl. Kp. Parung Serab)",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    OutlinedButton(
                        onClick = { viewModel.showResidentSwitcherModal.value = true },
                        shape = RoundedCornerShape(20.dp),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.testTag("btn_switch_unit")
                    ) {
                        Text(text = "Ganti Rumah", fontSize = 11.sp, color = PosterBluePrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // =========================================================================
        // 3. TAGIHAN IURAN BULANAN (Rp 140.000) DENGAN VA INSTAN
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp)
                    .testTag("current_bill_card"),
                colors = CardDefaults.cardColors(
                    containerColor = if (currentMonthBill?.status == "LUNAS") Color(0xFFDCFCE7) else Color(0xFFFEF3C7)
                ),
                shape = RoundedCornerShape(18.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CreditCard,
                                contentDescription = null,
                                tint = if (currentMonthBill?.status == "LUNAS") Color(0xFF15803D) else Color(0xFFB45309),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Iuran Lingkungan November 2026",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                        StatusBadge(status = currentMonthBill?.status ?: "MENUNGGAK")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column {
                            Text(
                                text = "Rp 140.000",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = if (currentMonthBill?.status == "LUNAS") Color(0xFF15803D) else Color(0xFFC2410C)
                            )
                            Text(
                                text = "Keamanan 24 Jam • Sampah • Kas PJU RT",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Jatuh Tempo: Setiap Tanggal 25",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFFB45309)
                            )
                        }

                        if (currentMonthBill?.status == "LUNAS") {
                            Button(
                                onClick = { viewModel.showReceiptBill.value = currentMonthBill },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Kuitansi", fontSize = 11.sp)
                            }
                        } else if (currentMonthBill != null) {
                            Button(
                                onClick = { viewModel.openPaymentModal(currentMonthBill) },
                                colors = ButtonDefaults.buttonColors(containerColor = PosterBluePrimary),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.testTag("btn_pay_now_home")
                            ) {
                                Icon(Icons.Default.Payment, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Bayar VA Instan", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // =========================================================================
        // 4. "KENAPA PERLU SISTEM INFORMASI PERUMAHAN?" (FROM USER REFERENCE POSTER)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0F7FF)),
                shape = RoundedCornerShape(18.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    // Yellow Title Badge
                    PosterSectionBadge("Kenapa Perlu Sistem Informasi Perumahan?")

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ProblemPointCard(
                            emoji = "📅",
                            title = "Administrasi warga masih manual",
                            modifier = Modifier.weight(1f)
                        )
                        ProblemPointCard(
                            emoji = "💰",
                            title = "Pencatatan iuran belum terintegrasi",
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ProblemPointCard(
                            emoji = "📢",
                            title = "Pengaduan & info sering terlewat",
                            modifier = Modifier.weight(1f)
                        )
                        ProblemPointCard(
                            emoji = "👥",
                            title = "Data penghuni belum tertata rapi",
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // =========================================================================
        // 5. FITUR UTAMA: UNTUK PENGURUS & LAYANAN WARGA (MATCHING POSTER TILES)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Layanan & Fitur Aplikasi",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = PosterBlueDark
                        )

                        // Toggle tab between Pengurus and Warga
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color(0xFFE2E8F0))
                                .padding(2.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(if (selectedFeatureTab == 0) PosterBluePrimary else Color.Transparent)
                                    .clickable { selectedFeatureTab = 0 }
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "Untuk Warga",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (selectedFeatureTab == 0) Color.White else Color(0xFF475569)
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(if (selectedFeatureTab == 1) PosterBluePrimary else Color.Transparent)
                                    .clickable { selectedFeatureTab = 1 }
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "Untuk Pengurus",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (selectedFeatureTab == 1) Color.White else Color(0xFF475569)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (selectedFeatureTab == 0) {
                        // LAYANAN UNTUK WARGA (AS IN POSTER)
                        PosterYellowBadgeInline("Layanan untuk Warga")
                        Spacer(modifier = Modifier.height(8.dp))

                        PosterFeatureItem(
                            icon = Icons.Default.Notifications,
                            title = "Info & Pengumuman Resmi",
                            subtitle = "Pembaruan real-time kegiatan, kerja bakti & keamanan cluster",
                            onClick = { viewModel.switchTab(MainTab.BERANDA) }
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        PosterFeatureItem(
                            icon = Icons.Default.Campaign,
                            title = "Pengajuan / Pengaduan Online",
                            subtitle = "Forum musyawarah warga, aspirasi, dan saran lingkungan",
                            onClick = { viewModel.switchTab(MainTab.FORUM) }
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        PosterFeatureItem(
                            icon = Icons.Default.CreditCard,
                            title = "Cek & Bayar Iuran Perumahan",
                            subtitle = "Iuran Rp 140.000 dengan Virtual Account BCA, Mandiri, BRI, BNI",
                            onClick = { viewModel.switchTab(MainTab.IURAN) }
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        PosterFeatureItem(
                            icon = Icons.Default.SportsTennis,
                            title = "Informasi Fasilitas (Lapangan, Balai, dll)",
                            subtitle = "Booking online Lapangan Badminton & Balai Warga RT 13",
                            onClick = { viewModel.switchTab(MainTab.FASILITAS) }
                        )
                    } else {
                        // FITUR UTAMA UNTUK PENGURUS (AS IN POSTER)
                        PosterYellowBadgeInline("Fitur Utama untuk Pengurus")
                        Spacer(modifier = Modifier.height(8.dp))

                        PosterFeatureItem(
                            icon = Icons.Default.People,
                            title = "Data Warga & Rumah (Terintegrasi)",
                            subtitle = "Kelola direktori warga per blok A-D dengan enkripsi NIK AES-256",
                            onClick = { viewModel.switchTab(MainTab.WARGA) }
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        PosterFeatureItem(
                            icon = Icons.Default.Description,
                            title = "Administrasi Surat & Perizinan",
                            subtitle = "Template surat pengantar RT online, tata tertib, dan jadwal ronda",
                            onClick = { viewModel.switchTab(MainTab.DOKUMEN) }
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        PosterFeatureItem(
                            icon = Icons.Default.AccountBalance,
                            title = "Keuangan & Iuran (RT/RW, Keamanan, dll)",
                            subtitle = "Buku kas terbuka, tracking tunggakan & WhatsApp reminder tgl 25",
                            onClick = { viewModel.switchTab(MainTab.KAS) }
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        PosterFeatureItem(
                            icon = Icons.Default.AccountBalanceWallet,
                            title = "Laporan & Dashboard Ringkas",
                            subtitle = "Pusat kendali admin, saldo kas, persetujuan booking & broadcast",
                            onClick = {
                                if (currentRole == UserRole.PENGURUS_RT) viewModel.switchTab(MainTab.ADMIN)
                                else viewModel.requestSwitchToAdmin()
                            }
                        )
                    }
                }
            }
        }

        // =========================================================================
        // 6. REAL-TIME SALDO & KAS RT SECTION
        // =========================================================================
        item {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Dashboard Kas RT 013 (Real-Time)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = PosterBlueDark
                    )
                    Text(
                        text = "Lihat Rincian →",
                        fontSize = 12.sp,
                        color = PosterBluePrimary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { viewModel.switchTab(MainTab.KAS) }
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StatCard(
                        title = "Saldo Kas RT",
                        value = PurimasRepository.formatRupiah(currentBalance),
                        subtitle = "Buku Kas Terbuka",
                        icon = Icons.Default.AccountBalanceWallet,
                        iconTint = PosterBluePrimary,
                        containerColor = PosterBlueContainer.copy(alpha = 0.5f),
                        modifier = Modifier.weight(1f),
                        tag = "stat_saldo_kas"
                    )
                    StatCard(
                        title = "Pemasukan Bln Ini",
                        value = PurimasRepository.formatRupiah(totalIncome),
                        subtitle = "Iuran & Fasum",
                        icon = Icons.Default.TrendingUp,
                        iconTint = Color(0xFF16A34A),
                        containerColor = PosterYellowContainer.copy(alpha = 0.5f),
                        modifier = Modifier.weight(1f),
                        tag = "stat_pemasukan"
                    )
                }
            }
        }

        // =========================================================================
        // 7. "MANFAATNYA UNTUK KITA SEMUA" (FROM POSTER)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                border = CardDefaults.outlinedCardBorder(),
                shape = RoundedCornerShape(18.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    PosterSectionBadge("Manfaatnya untuk Kita Semua")

                    Spacer(modifier = Modifier.height(10.dp))

                    BenefitCheckItem("Lingkungan lebih tertib & terkelola")
                    Spacer(modifier = Modifier.height(6.dp))
                    BenefitCheckItem("Administrasi lebih cepat dan transparan")
                    Spacer(modifier = Modifier.height(6.dp))
                    BenefitCheckItem("Komunikasi pengurus-warga lebih efektif")
                    Spacer(modifier = Modifier.height(6.dp))
                    BenefitCheckItem("Mendukung Perumahan Purimas Tirtajaya yang aman, nyaman, dan guyub")
                }
            }
        }

        // =========================================================================
        // 8. "SAATNYA PURIMAS TIRTAJAYA GO DIGITAL!" CTA BANNER (FROM POSTER)
        // =========================================================================
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 8.dp)
                    .shadow(3.dp, RoundedCornerShape(18.dp)),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Saatnya Purimas Tirtajaya",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = PosterBlueDark
                    )
                    Text(
                        text = "Go Digital!",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black,
                        color = PosterBluePrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Dukung penerapan Sistem Informasi Perumahan untuk layanan yang lebih modern, transparan, dan bermanfaat bagi seluruh warga.",
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        color = Color(0xFF475569),
                        lineHeight = 15.sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Yellow Pill CTA Button with Pointer Clicker
                    Button(
                        onClick = { showPosterModal = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PosterYellowBadge,
                            contentColor = Color(0xFF1E293B)
                        ),
                        shape = RoundedCornerShape(30.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Mari Gunakan Sistemnya Bersama!",
                                fontWeight = FontWeight.Black,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.TouchApp,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }

        // =========================================================================
        // 9. PENGUMUMAN REAL-TIME
        // =========================================================================
        item {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Campaign,
                            contentDescription = null,
                            tint = Color(0xFFDC2626),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Pengumuman Real-Time",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = PosterBlueDark
                        )
                    }
                    if (currentRole == UserRole.PENGURUS_RT) {
                        TextButton(onClick = { viewModel.showBroadcastModal.value = true }) {
                            Text("+ Broadcast", fontSize = 11.sp, color = PosterBluePrimary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
            }
        }

        items(announcements.take(2)) { ann ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 3.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(14.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    when (ann.category) {
                                        "DARURAT" -> Color(0xFFFEE2E2)
                                        "IURAN" -> PosterYellowContainer
                                        else -> Color(0xFFDCFCE7)
                                    }
                                )
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = ann.category,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (ann.category) {
                                    "DARURAT" -> Color(0xFFDC2626)
                                    "IURAN" -> Color(0xFFB45309)
                                    else -> Color(0xFF15803D)
                                }
                            )
                        }
                        Text(
                            text = ann.timestamp,
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = ann.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = ann.content,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }

    // Modal to view the complete official Infographic Poster
    if (showPosterModal) {
        AlertDialog(
            onDismissRequest = { showPosterModal = false },
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Infografis Purimas Tirtajaya",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = PosterBlueDark
                    )
                    IconButton(onClick = { showPosterModal = false }) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup")
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.poster_purimas_godigital),
                        contentDescription = "Poster Sistem Informasi Perumahan Purimas Tirtajaya",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(380.dp)
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Fit
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Poster Resmi Sosialisasi Sistem Informasi Perumahan Purimas Tirtajaya Go Digital",
                        fontSize = 10.sp,
                        textAlign = TextAlign.Center,
                        color = Color(0xFF64748B)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { showPosterModal = false },
                    colors = ButtonDefaults.buttonColors(containerColor = PosterBluePrimary)
                ) {
                    Text("Tutup Brosur")
                }
            }
        )
    }
}

/**
 * Yellow speech-bubble style badge from user reference poster
 */
@Composable
fun PosterSectionBadge(title: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(24.dp))
            .background(PosterYellowBadge)
            .padding(horizontal = 14.dp, vertical = 6.dp)
    ) {
        Text(
            text = title,
            color = Color(0xFF1E293B),
            fontWeight = FontWeight.Black,
            fontSize = 13.sp
        )
    }
}

@Composable
fun PosterYellowBadgeInline(title: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(PosterYellowBadge)
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Text(
            text = title,
            color = Color(0xFF1E293B),
            fontWeight = FontWeight.ExtraBold,
            fontSize = 11.sp
        )
    }
}

@Composable
fun ProblemPointCard(emoji: String, title: String, modifier: Modifier = Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = emoji, fontSize = 20.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = title,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF1E293B),
                lineHeight = 14.sp
            )
        }
    }
}

@Composable
fun PosterFeatureItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        shape = RoundedCornerShape(12.dp),
        border = CardDefaults.outlinedCardBorder(),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(PosterBluePrimary),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = Color(0xFF0F172A)
                )
                Text(
                    text = subtitle,
                    fontSize = 10.sp,
                    color = Color(0xFF64748B),
                    lineHeight = 13.sp
                )
            }
        }
    }
}

@Composable
fun BenefitCheckItem(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(CircleShape)
                .background(Color(0xFFDCFCE7)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = Color(0xFF15803D),
                modifier = Modifier.size(15.dp)
            )
        }
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = text,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF1E293B)
        )
    }
}
