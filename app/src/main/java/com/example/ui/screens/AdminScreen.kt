package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.TableChart
import androidx.compose.material.icons.filled.ViewList
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.BillEntity
import com.example.data.model.ResidentEntity
import com.example.data.repository.PurimasRepository
import com.example.ui.components.StatCard
import com.example.ui.theme.AmberContainer
import com.example.ui.theme.AmberSecondary
import com.example.ui.theme.OrangeContainer
import com.example.ui.theme.OrangePrimary
import com.example.ui.theme.PosterBlueDark
import com.example.ui.theme.PosterBluePrimary
import com.example.ui.theme.PosterTerracottaWall
import com.example.ui.theme.PosterYellowBadge
import com.example.ui.theme.StatusDanger
import com.example.ui.theme.StatusSuccess
import com.example.ui.theme.StatusWarning
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    viewModel: PurimasViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val currentRole by viewModel.currentRole.collectAsState()
    val overdueBills by viewModel.overdueBills.collectAsState()
    val allBills by viewModel.allBills.collectAsState()
    val residents by viewModel.residents.collectAsState()
    val distinctMonths by viewModel.distinctMonths.collectAsState()
    val selectedMonth by viewModel.selectedAdminMonth.collectAsState()
    val statusFilter by viewModel.selectedDuesStatusFilter.collectAsState()
    val searchQuery by viewModel.searchDuesQuery.collectAsState()
    val viewMode by viewModel.adminDuesViewMode.collectAsState()
    val monthlyBills by viewModel.adminMonthlyBills.collectAsState()
    val currentMonthAllBills by viewModel.currentMonthAllBills.collectAsState()

    val showBroadcastModal by viewModel.showBroadcastModal.collectAsState()
    val showGenerateMonthModal by viewModel.showGenerateMonthModal.collectAsState()
    val showMonthlyRecapModal by viewModel.showMonthlyRecapModal.collectAsState()

    // Monthly Calculation Stats
    val totalTargetDues = currentMonthAllBills.size * 140000L
    val paidBills = currentMonthAllBills.filter { it.status == "LUNAS" }
    val unpaidBills = currentMonthAllBills.filter { it.status != "LUNAS" }
    val totalCollected = paidBills.size * 140000L
    val totalPending = unpaidBills.size * 140000L
    val collectionProgress = if (currentMonthAllBills.isNotEmpty()) {
        paidBills.size.toFloat() / currentMonthAllBills.size.toFloat()
    } else 0f
    val collectionPercent = (collectionProgress * 100).toInt()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("admin_screen"),
        contentPadding = PaddingValues(top = 16.dp, bottom = 100.dp)
    ) {
        // 1. Admin Role & Login Status Card
        item {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (currentRole == UserRole.PENGURUS_RT) Color(0xFF0F172A) else MaterialTheme.colorScheme.surface
                ),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(if (currentRole == UserRole.PENGURUS_RT) Color(0xFF10B981) else OrangeContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AdminPanelSettings,
                                    contentDescription = null,
                                    tint = if (currentRole == UserRole.PENGURUS_RT) Color.White else OrangePrimary,
                                    modifier = Modifier.size(26.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = if (currentRole == UserRole.PENGURUS_RT) "Mode Pengurus RT 013 Aktif" else "Mode Warga Biasa",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (currentRole == UserRole.PENGURUS_RT) Color.White else MaterialTheme.colorScheme.onSurface,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = if (currentRole == UserRole.PENGURUS_RT) "Hak Akses Admin & Pengelola Iuran" else "Akses Terbatas Warga",
                                    fontSize = 11.sp,
                                    color = if (currentRole == UserRole.PENGURUS_RT) Color(0xFF94A3B8) else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Button(
                            onClick = { viewModel.requestSwitchToAdmin() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (currentRole == UserRole.PENGURUS_RT) Color(0xFFDC2626) else OrangePrimary
                            ),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                text = if (currentRole == UserRole.PENGURUS_RT) "Keluar Admin" else "Login PIN",
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
        }

        // 2. Action Command Grid
        item {
            Text(
                text = "Pusat Kendali Pengurus RT",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))

            AdminActionCard(
                title = "Kirim Pengingat WhatsApp Tanggal 25",
                desc = "Blast notifikasi pengingat pembayaran iuran Rp 140.000 ke seluruh warga menunggak.",
                icon = Icons.Default.Send,
                badge = "${overdueBills.size} Warga",
                iconColor = Color(0xFF25D366),
                onClick = {
                    if (overdueBills.isNotEmpty()) {
                        viewModel.showWhatsAppReminderModal.value = overdueBills.first()
                    }
                }
            )

            Spacer(modifier = Modifier.height(8.dp))

            AdminActionCard(
                title = "Broadcast Pengumuman Lingkungan",
                desc = "Kirim pesan penting real-time (Darurat, Kerja Bakti, PLN, PDAM) ke seluruh warga.",
                icon = Icons.Default.Campaign,
                badge = "Real-Time",
                iconColor = Color(0xFFDC2626),
                onClick = { viewModel.showBroadcastModal.value = true }
            )

            Spacer(modifier = Modifier.height(8.dp))

            AdminActionCard(
                title = "Catat Transaksi Buku Kas Lingkungan",
                desc = "Input transaksi kas masuk (iuran tunai, donasi) atau kas keluar (honor satpam, sampah, PJU).",
                icon = Icons.Default.AccountBalance,
                badge = "Buku Kas",
                iconColor = OrangePrimary,
                onClick = { viewModel.showNewCashModal.value = true }
            )

            Spacer(modifier = Modifier.height(8.dp))

            AdminActionCard(
                title = "Tambah Warga Baru (Enkripsi AES-256)",
                desc = "Daftarkan kepala keluarga baru dengan enkripsi otomatis pada identitas NIK.",
                icon = Icons.Default.PersonAdd,
                badge = "+ Anggota",
                iconColor = AmberSecondary,
                onClick = { viewModel.showAddResidentModal.value = true }
            )

            Spacer(modifier = Modifier.height(8.dp))

            AdminActionCard(
                title = "Audit Enkripsi & Kepatuhan Privasi",
                desc = "Periksa status perlindungan kriptografi AES-256 GCM NoPadding pada database warga.",
                icon = Icons.Default.Shield,
                badge = "Aktif",
                iconColor = Color(0xFF15803D),
                onClick = { viewModel.showEncryptionAuditModal.value = true }
            )

            Spacer(modifier = Modifier.height(18.dp))
        }

        // 3. FITUR UTAMA: Info Status Iuran Warga Tiap Bulan
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0F7FF)),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("monthly_dues_status_section")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Section Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(PosterBluePrimary),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ReceiptLong,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Status Iuran Warga Tiap Bulan",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = PosterBlueDark
                                )
                                Text(
                                    text = "Monitoring pelunasan Rp 140.000 per rumah",
                                    fontSize = 11.sp,
                                    color = Color(0xFF475569)
                                )
                            }
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            // Button Buat Tagihan Bulan Baru
                            IconButton(
                                onClick = { viewModel.showGenerateMonthModal.value = true },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.White)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Add,
                                    contentDescription = "Buat Tagihan Baru",
                                    tint = PosterBluePrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            // Button Bagikan Rekap ke WA
                            IconButton(
                                onClick = { viewModel.showMonthlyRecapModal.value = true },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFDCFCE7))
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Share,
                                    contentDescription = "Share Rekap WA",
                                    tint = Color(0xFF15803D),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Month Selector Chips
                    Text(
                        text = "Pilih Periode Bulan:",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF334155)
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    val monthsList = listOf("Semua Bulan") + distinctMonths.ifEmpty {
                        listOf("November 2026", "Oktober 2026", "September 2026")
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        monthsList.forEach { m ->
                            val isSelected = (m == selectedMonth)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (isSelected) PosterBluePrimary else Color.White)
                                    .clickable { viewModel.selectAdminMonth(m) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = m,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) Color.White else Color(0xFF334155)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // KPI Summary Cards for selected month
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Rekap Periode: $selectedMonth",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF0F172A)
                                )
                                Text(
                                    text = "$collectionPercent% Terkumpul",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (collectionPercent >= 80) StatusSuccess else if (collectionPercent >= 50) StatusWarning else StatusDanger
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            LinearProgressIndicator(
                                progress = { collectionProgress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = if (collectionPercent >= 80) StatusSuccess else if (collectionPercent >= 50) StatusWarning else StatusDanger,
                                trackColor = Color(0xFFE2E8F0)
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(text = "Sudah Lunas", fontSize = 10.sp, color = Color(0xFF64748B))
                                    Text(
                                        text = "${paidBills.size} Rumah",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = StatusSuccess
                                    )
                                    Text(
                                        text = PurimasRepository.formatRupiah(totalCollected),
                                        fontSize = 10.sp,
                                        color = StatusSuccess
                                    )
                                }

                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(text = "Menunggak", fontSize = 10.sp, color = Color(0xFF64748B))
                                    Text(
                                        text = "${unpaidBills.size} Rumah",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = StatusDanger
                                    )
                                    Text(
                                        text = PurimasRepository.formatRupiah(totalPending),
                                        fontSize = 10.sp,
                                        color = StatusDanger
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text(text = "Total Target", fontSize = 10.sp, color = Color(0xFF64748B))
                                    Text(
                                        text = "${currentMonthAllBills.size} Rumah",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PosterBlueDark
                                    )
                                    Text(
                                        text = PurimasRepository.formatRupiah(totalTargetDues),
                                        fontSize = 10.sp,
                                        color = PosterBlueDark
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Search & View Mode Switcher
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { viewModel.setSearchDuesQuery(it) },
                            placeholder = { Text("Cari warga/blok...", fontSize = 11.sp) },
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.Search,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = Color(0xFF64748B)
                                )
                            },
                            trailingIcon = {
                                if (searchQuery.isNotEmpty()) {
                                    IconButton(
                                        onClick = { viewModel.setSearchDuesQuery("") },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(14.dp))
                                    }
                                }
                            },
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        // Toggle Mode: DAFTAR vs MATRIKS
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White)
                                .padding(2.dp)
                        ) {
                            IconButton(
                                onClick = { viewModel.setAdminDuesViewMode("DAFTAR") },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (viewMode == "DAFTAR") PosterBluePrimary else Color.Transparent)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ViewList,
                                    contentDescription = "Mode Daftar",
                                    tint = if (viewMode == "DAFTAR") Color.White else Color(0xFF64748B),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            IconButton(
                                onClick = { viewModel.setAdminDuesViewMode("MATRIKS") },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (viewMode == "MATRIKS") PosterBluePrimary else Color.Transparent)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.TableChart,
                                    contentDescription = "Mode Matriks",
                                    tint = if (viewMode == "MATRIKS") Color.White else Color(0xFF64748B),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Status Filters (SEMUA, LUNAS, MENUNGGAK)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("SEMUA", "LUNAS", "MENUNGGAK").forEach { st ->
                            val isSel = (statusFilter == st)
                            val label = when (st) {
                                "SEMUA" -> "Semua (${currentMonthAllBills.size})"
                                "LUNAS" -> "Lunas (${paidBills.size})"
                                else -> "Menunggak (${unpaidBills.size})"
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        if (isSel) {
                                            when (st) {
                                                "LUNAS" -> StatusSuccess
                                                "MENUNGGAK" -> StatusDanger
                                                else -> PosterBluePrimary
                                            }
                                        } else Color.White
                                    )
                                    .clickable { viewModel.setDuesStatusFilter(st) }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = label,
                                    fontSize = 10.sp,
                                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSel) Color.White else Color(0xFF334155)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
        }

        // 4. DISPLAY CONTENT: EITHER LIST VIEW OR MATRIX VIEW
        if (viewMode == "MATRIKS") {
            // Mode Matriks Komparasi 3 Bulan (September, Oktober, November)
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(14.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "Matriks Kepatuhan Iuran Warga (3 Bulan Terakhir)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = PosterBlueDark
                        )
                        Text(
                            text = "Hijau = Lunas (Rp 140.000) • Merah = Menunggak",
                            fontSize = 10.sp,
                            color = Color(0xFF64748B)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Header Table
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFF1F5F9), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Rumah / Warga", fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.4f))
                            Text(text = "Sep '26", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569), modifier = Modifier.width(50.dp))
                            Text(text = "Okt '26", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569), modifier = Modifier.width(50.dp))
                            Text(text = "Nov '26", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF475569), modifier = Modifier.width(50.dp))
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = Color(0xFFE2E8F0))

                        // Rows for each resident
                        val filteredResidents = if (searchQuery.isBlank()) residents else {
                            residents.filter { it.fullName.contains(searchQuery, ignoreCase = true) || it.blockNumber.contains(searchQuery, ignoreCase = true) }
                        }

                        filteredResidents.forEach { res ->
                            val resBills = allBills.filter { it.residentId == res.id }
                            val sepBill = resBills.find { it.monthIndex == 9 && it.year == 2026 }
                            val oktBill = resBills.find { it.monthIndex == 10 && it.year == 2026 }
                            val novBill = resBills.find { it.monthIndex == 11 && it.year == 2026 }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp, horizontal = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1.4f)) {
                                    Text(
                                        text = "${res.blockNumber} No. ${res.houseNumber}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = Color(0xFF0F172A)
                                    )
                                    Text(
                                        text = res.fullName,
                                        fontSize = 10.sp,
                                        color = Color(0xFF64748B)
                                    )
                                }

                                MonthStatusBadge(bill = sepBill, modifier = Modifier.width(50.dp))
                                MonthStatusBadge(bill = oktBill, modifier = Modifier.width(50.dp))
                                MonthStatusBadge(bill = novBill, modifier = Modifier.width(50.dp))
                            }
                            HorizontalDivider(color = Color(0xFFF1F5F9))
                        }
                    }
                }
            }
        } else {
            // Mode Daftar Rumah Detail
            if (monthlyBills.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = StatusSuccess,
                                modifier = Modifier.size(36.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Tidak ada tagihan yang sesuai filter",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                            Text(
                                text = "Coba ubah kata kunci pencarian atau filter status iuran.",
                                fontSize = 11.sp,
                                color = Color(0xFF64748B)
                            )
                        }
                    }
                }
            }

            items(monthlyBills) { bill ->
                val isPaid = (bill.status == "LUNAS")
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(if (isPaid) Color(0xFFDCFCE7) else Color(0xFFFEE2E2)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (isPaid) Icons.Default.CheckCircle else Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = if (isPaid) StatusSuccess else StatusDanger,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = bill.houseUnit,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                    Text(
                                        text = bill.residentName,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            // Status Pill
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isPaid) Color(0xFFDCFCE7) else Color(0xFFFEE2E2))
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = if (isPaid) "LUNAS" else "MENUNGGAK",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (isPaid) Color(0xFF15803D) else Color(0xFFDC2626)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        HorizontalDivider(color = Color(0xFFF1F5F9))
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Periode: ${bill.monthName}",
                                    fontSize = 11.sp,
                                    color = Color(0xFF475569)
                                )
                                Text(
                                    text = "Iuran: ${PurimasRepository.formatRupiah(bill.amount)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isPaid) Color(0xFF0F172A) else StatusDanger
                                )
                                if (isPaid) {
                                    Text(
                                        text = "${bill.paidAt ?: "Terverifikasi"} • ${bill.paymentChannel ?: "VA Instan"}",
                                        fontSize = 10.sp,
                                        color = StatusSuccess
                                    )
                                } else {
                                    Text(
                                        text = "Jatuh tempo: ${bill.dueDate}",
                                        fontSize = 10.sp,
                                        color = Color(0xFF94A3B8)
                                    )
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (isPaid) {
                                    OutlinedButton(
                                        onClick = { viewModel.showReceiptBill.value = bill },
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text("Kuitansi", fontSize = 10.sp)
                                    }
                                } else {
                                    // Kirim WA Pengingat
                                    IconButton(
                                        onClick = { viewModel.showWhatsAppReminderModal.value = bill },
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Color(0xFFDCFCE7))
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Send,
                                            contentDescription = "Kirim WA Pengingat",
                                            tint = Color(0xFF15803D),
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }

                                    // Lunas Manual oleh Bendahara/Admin
                                    Button(
                                        onClick = { viewModel.markBillPaidManualByAdmin(bill) },
                                        colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text("Lunas Manual", fontSize = 10.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal Broadcast
    if (showBroadcastModal) {
        NewBroadcastDialog(
            onDismiss = { viewModel.showBroadcastModal.value = false },
            onSubmit = { title, content, cat, isPinned ->
                viewModel.submitBroadcast(title, content, cat, isPinned)
            }
        )
    }

    // Modal Generate Tagihan Bulan Baru
    if (showGenerateMonthModal) {
        GenerateMonthBillsDialog(
            onDismiss = { viewModel.showGenerateMonthModal.value = false },
            onGenerate = { monthName, monthIndex, year ->
                viewModel.generateNewMonthBills(monthName, monthIndex, year)
            }
        )
    }

    // Modal Bagikan Rekapitulasi Iuran ke WhatsApp
    if (showMonthlyRecapModal) {
        val recapText = viewModel.getShareableRecapText()
        MonthlyRecapDialog(
            monthName = selectedMonth,
            recapContent = recapText,
            onDismiss = { viewModel.showMonthlyRecapModal.value = false },
            onCopy = {
                clipboardManager.setText(AnnotatedString(recapText))
                viewModel.userNoticeMessage.value = "Teks rekapitulasi iuran $selectedMonth berhasil disalin!"
            },
            onShare = {
                val sendIntent = Intent().apply {
                    action = Intent.ACTION_SEND
                    putExtra(Intent.EXTRA_TEXT, recapText)
                    type = "text/plain"
                }
                context.startActivity(Intent.createChooser(sendIntent, "Bagikan Rekap Iuran RT 013"))
            }
        )
    }
}

@Composable
fun MonthStatusBadge(bill: BillEntity?, modifier: Modifier = Modifier) {
    val isPaid = bill?.status == "LUNAS"
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(
                if (bill == null) Color(0xFFF1F5F9)
                else if (isPaid) Color(0xFFDCFCE7)
                else Color(0xFFFEE2E2)
            )
            .padding(vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (bill == null) "-" else if (isPaid) "Lunas" else "Nunggak",
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = if (bill == null) Color(0xFF94A3B8) else if (isPaid) Color(0xFF15803D) else Color(0xFFDC2626)
        )
    }
}

@Composable
fun AdminActionCard(
    title: String,
    desc: String,
    icon: ImageVector,
    badge: String,
    iconColor: Color,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(iconColor.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(22.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFE2E8F0))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(text = badge, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF334155))
                    }
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = desc, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GenerateMonthBillsDialog(
    onDismiss: () -> Unit,
    onGenerate: (monthName: String, monthIndex: Int, year: Int) -> Unit
) {
    val upcomingMonths = listOf(
        Triple("Desember 2026", 12, 2026),
        Triple("Januari 2027", 1, 2027),
        Triple("Februari 2027", 2, 2027),
        Triple("Maret 2027", 3, 2027)
    )
    var selectedUpcoming by remember { mutableStateOf(upcomingMonths.first()) }
    var menuExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Terbitkan Tagihan Iuran Bulan Baru", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Sistem akan menerbitkan tagihan iuran bulanan Rp 140.000 lengkap dengan Virtual Account untuk seluruh kepala keluarga RT 013 RW 003 Purimas Tirtajaya.",
                    fontSize = 12.sp,
                    color = Color(0xFF475569)
                )

                Spacer(modifier = Modifier.height(12.dp))

                ExposedDropdownMenuBox(
                    expanded = menuExpanded,
                    onExpandedChange = { menuExpanded = !menuExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedUpcoming.first,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Pilih Bulan Tagihan") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = menuExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = menuExpanded,
                        onDismissRequest = { menuExpanded = false }
                    ) {
                        upcomingMonths.forEach { item ->
                            DropdownMenuItem(
                                text = { Text(item.first) },
                                onClick = {
                                    selectedUpcoming = item
                                    menuExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(text = "Rincian Iuran Per Rumah:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text(text = "• Keamanan 24 Jam: Rp 70.000", fontSize = 10.sp, color = Color(0xFF475569))
                        Text(text = "• Kebersihan Sampah: Rp 45.000", fontSize = 10.sp, color = Color(0xFF475569))
                        Text(text = "• Pemeliharaan Lingkungan & PJU: Rp 25.000", fontSize = 10.sp, color = Color(0xFF475569))
                        Text(text = "• Jatuh Tempo: Tanggal 25 setiap bulan", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = PosterBluePrimary)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onGenerate(selectedUpcoming.first, selectedUpcoming.second, selectedUpcoming.third)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PosterBluePrimary)
            ) {
                Text("Terbitkan Sekarang")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}

@Composable
fun MonthlyRecapDialog(
    monthName: String,
    recapContent: String,
    onDismiss: () -> Unit,
    onCopy: () -> Unit,
    onShare: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Rekapitulasi Iuran $monthName", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Close, contentDescription = "Tutup", modifier = Modifier.size(18.dp))
                }
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Format laporan siap bagikan ke WhatsApp grup pengurus / warga RT 013 RW 003:",
                    fontSize = 11.sp,
                    color = Color(0xFF475569)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp)
                ) {
                    LazyColumn(modifier = Modifier.padding(12.dp)) {
                        item {
                            Text(
                                text = recapContent,
                                color = Color(0xFFF8FAFC),
                                fontSize = 11.sp,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onShare,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366))
            ) {
                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Kirim ke WhatsApp")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onCopy) {
                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Salin Teks")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewBroadcastDialog(
    onDismiss: () -> Unit,
    onSubmit: (title: String, content: String, category: String, isPinned: Boolean) -> Unit
) {
    val categories = listOf("DARURAT", "KEGIATAN", "IURAN", "INFORMASI")
    var selectedCat by remember { mutableStateOf(categories.first()) }
    var catExpanded by remember { mutableStateOf(false) }

    var titleText by remember { mutableStateOf("") }
    var contentText by remember { mutableStateOf("") }
    var isPinned by remember { mutableStateOf(true) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Broadcast Pengumuman Lingkungan", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                ExposedDropdownMenuBox(
                    expanded = catExpanded,
                    onExpandedChange = { catExpanded = !catExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedCat,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Kategori Pengumuman") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = catExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = catExpanded,
                        onDismissRequest = { catExpanded = false }
                    ) {
                        categories.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat) },
                                onClick = {
                                    selectedCat = cat
                                    catExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = titleText,
                    onValueChange = { titleText = it },
                    label = { Text("Judul Pengumuman") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = contentText,
                    onValueChange = { contentText = it },
                    label = { Text("Isi Pesan Pengumuman") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Sematkan di Beranda Utama", fontSize = 12.sp)
                    Switch(checked = isPinned, onCheckedChange = { isPinned = it })
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (titleText.isNotBlank() && contentText.isNotBlank()) {
                        onSubmit(titleText, contentText, selectedCat, isPinned)
                    }
                },
                enabled = titleText.isNotBlank() && contentText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary)
            ) {
                Text("Kirim Sekarang")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
