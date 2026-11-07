package com.example.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SportsTennis
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.repository.PurimasRepository
import com.example.ui.components.StatCard
import com.example.ui.components.StatusBadge
import com.example.ui.theme.EmeraldContainer
import com.example.ui.theme.EmeraldPrimary
import com.example.ui.theme.GoldContainer
import com.example.ui.theme.GoldTertiary
import com.example.ui.theme.OnEmeraldContainer
import com.example.ui.theme.TealContainer
import com.example.ui.theme.TealSecondary
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

    val currentMonthBill = myBills.find { it.monthIndex == 11 && it.year == 2026 } ?: myBills.firstOrNull()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("home_screen"),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 96.dp)
    ) {
        // Hero Image Header
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.purimas_hero),
                    contentDescription = "Gerbang Perumahan Purimas Tirtajaya",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    Color(0xAA064E3B),
                                    Color(0xF00B131F)
                                )
                            )
                        )
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFF10B981))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "RT 013 RW 003",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Kel. Tirtajaya, Kec. Sukmajaya, Depok",
                            color = Color(0xFFE2E8F0),
                            fontSize = 11.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Perumahan Purimas Tirtajaya",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                }
            }
        }

        // Active Resident Identity Banner
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(CircleShape)
                                .background(EmeraldContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Home,
                                contentDescription = null,
                                tint = EmeraldPrimary,
                                modifier = Modifier.size(26.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = activeResident?.fullName ?: "Warga Purimas",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = activeResident?.fullAddress ?: "Purimas Tirtajaya",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    OutlinedButton(
                        onClick = { viewModel.showResidentSwitcherModal.value = true },
                        shape = RoundedCornerShape(20.dp),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.testTag("btn_switch_unit")
                    ) {
                        Text(text = "Ganti Rumah", fontSize = 11.sp)
                    }
                }
            }
        }

        // Current Month Dues Status Card (Rp 140.000)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .testTag("current_bill_card"),
                colors = CardDefaults.cardColors(
                    containerColor = if (currentMonthBill?.status == "LUNAS") EmeraldContainer.copy(alpha = 0.5f) else GoldContainer.copy(alpha = 0.6f)
                ),
                shape = RoundedCornerShape(18.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CreditCard,
                                contentDescription = null,
                                tint = if (currentMonthBill?.status == "LUNAS") EmeraldPrimary else GoldTertiary,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Iuran Lingkungan November 2026",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                        StatusBadge(status = currentMonthBill?.status ?: "MENUNGGAK")
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column {
                            Text(
                                text = "Rp 140.000",
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (currentMonthBill?.status == "LUNAS") EmeraldPrimary else Color(0xFF9A3412)
                            )
                            Text(
                                text = "Keamanan 24 Jam • Sampah • Kas PJU RT",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Jatuh Tempo: Setiap Tanggal 25",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                color = Color(0xFFC2410C)
                            )
                        }

                        if (currentMonthBill?.status == "LUNAS") {
                            Button(
                                onClick = { viewModel.showReceiptBill.value = currentMonthBill },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Kuitansi", fontSize = 12.sp)
                            }
                        } else if (currentMonthBill != null) {
                            Button(
                                onClick = { viewModel.openPaymentModal(currentMonthBill) },
                                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.testTag("btn_pay_now_home")
                            ) {
                                Text("Bayar VA Instan", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Real-Time Saldo & Kas RT Section
        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Dashboard Kas RT 013 (Real-Time)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Lihat Rincian →",
                        fontSize = 12.sp,
                        color = EmeraldPrimary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable { viewModel.switchTab(MainTab.KAS) }
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(
                        title = "Saldo Kas RT",
                        value = PurimasRepository.formatRupiah(currentBalance),
                        subtitle = "Buku Kas Terbuka",
                        icon = Icons.Default.AccountBalanceWallet,
                        iconTint = EmeraldPrimary,
                        containerColor = EmeraldContainer.copy(alpha = 0.45f),
                        modifier = Modifier.weight(1f),
                        tag = "stat_saldo_kas"
                    )
                    StatCard(
                        title = "Pemasukan Bln Ini",
                        value = PurimasRepository.formatRupiah(totalIncome),
                        subtitle = "Iuran & Fasum",
                        icon = Icons.Default.TrendingUp,
                        iconTint = Color(0xFF16A34A),
                        containerColor = TealContainer.copy(alpha = 0.4f),
                        modifier = Modifier.weight(1f),
                        tag = "stat_pemasukan"
                    )
                }
            }
        }

        // Quick Navigation Grid
        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                Text(
                    text = "Layanan Digital Warga",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    QuickActionIcon("Iuran & VA", Icons.Default.Receipt, EmeraldPrimary) {
                        viewModel.switchTab(MainTab.IURAN)
                    }
                    QuickActionIcon("Kas Transparan", Icons.Default.AccountBalance, TealSecondary) {
                        viewModel.switchTab(MainTab.KAS)
                    }
                    QuickActionIcon("Booking Fasum", Icons.Default.SportsTennis, GoldTertiary) {
                        viewModel.switchTab(MainTab.FASILITAS)
                    }
                    QuickActionIcon("Warga RT", Icons.Default.People, Color(0xFF0284C7)) {
                        viewModel.switchTab(MainTab.WARGA)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    QuickActionIcon("Forum Diskusi", Icons.Default.Forum, Color(0xFF8B5CF6)) {
                        viewModel.switchTab(MainTab.FORUM)
                    }
                    QuickActionIcon("Arsip Dokumen", Icons.Default.Description, Color(0xFF0D9488)) {
                        viewModel.switchTab(MainTab.DOKUMEN)
                    }
                    QuickActionIcon("Audit Enkripsi", Icons.Default.Shield, EmeraldPrimary) {
                        viewModel.showEncryptionAuditModal.value = true
                    }
                    QuickActionIcon(
                        if (currentRole == UserRole.PENGURUS_RT) "Mode Admin" else "Login Admin",
                        Icons.Default.AccountBalanceWallet,
                        if (currentRole == UserRole.PENGURUS_RT) Color(0xFFDC2626) else Color(0xFF64748B)
                    ) {
                        viewModel.requestSwitchToAdmin()
                    }
                }
            }
        }

        // Real-Time Announcements Feed
        item {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
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
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Pengumuman Real-Time",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    if (currentRole == UserRole.PENGURUS_RT) {
                        TextButton(onClick = { viewModel.showBroadcastModal.value = true }) {
                            Text("+ Broadcast", fontSize = 12.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))
            }
        }

        items(announcements.take(3)) { ann ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(14.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
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
                                        "IURAN" -> Color(0xFFFEF3C7)
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
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = ann.content,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun QuickActionIcon(
    label: String,
    icon: ImageVector,
    tint: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable(onClick = onClick)
            .padding(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(54.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(tint.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = tint,
                modifier = Modifier.size(26.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
