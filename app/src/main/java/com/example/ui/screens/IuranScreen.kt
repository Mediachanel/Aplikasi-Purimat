package com.example.ui.screens

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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.BillEntity
import com.example.data.repository.PurimasRepository
import com.example.ui.components.StatusBadge
import com.example.ui.theme.EmeraldContainer
import com.example.ui.theme.EmeraldPrimary
import com.example.ui.theme.GoldContainer
import com.example.ui.theme.GoldTertiary
import com.example.ui.theme.StatusDanger
import com.example.ui.theme.StatusSuccess
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

@Composable
fun IuranScreen(
    viewModel: PurimasViewModel,
    modifier: Modifier = Modifier
) {
    val myBills by viewModel.myBills.collectAsState()
    val allBills by viewModel.allBills.collectAsState()
    val currentRole by viewModel.currentRole.collectAsState()
    val activeResident by viewModel.activeResident.collectAsState()

    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var filterStatus by remember { mutableStateOf("SEMUA") }

    val currentMonthBills = allBills.filter { it.monthIndex == 11 && it.year == 2026 }
    val paidCount = currentMonthBills.count { it.status == "LUNAS" }
    val totalHouses = currentMonthBills.size.coerceAtLeast(1)
    val progress = paidCount.toFloat() / totalHouses.toFloat()

    Column(
        modifier = modifier
            .fillMaxSize()
            .testTag("iuran_screen")
    ) {
        // Header
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Text(
                text = "Kelola Iuran & Virtual Account",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "Tarif tetap Rp 140.000 / rumah / bulan (Jatuh tempo setiap tanggal 25)",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Collection Progress Bar for Month
            Card(
                colors = CardDefaults.cardColors(containerColor = EmeraldContainer.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Kolektibilitas November 2026",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "$paidCount dari $totalHouses Lunas (${(progress * 100).toInt()}%)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldPrimary
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = EmeraldPrimary,
                        trackColor = Color(0xFFE2E8F0)
                    )
                }
            }
        }

        // Tabs: Tagihan Saya vs Rekap Tunggakan RT
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            Tab(
                selected = selectedTabIndex == 0,
                onClick = { selectedTabIndex = 0 },
                text = { Text("Tagihan Saya", fontWeight = FontWeight.Bold) }
            )
            Tab(
                selected = selectedTabIndex == 1,
                onClick = { selectedTabIndex = 1 },
                text = { Text("Daftar Warga & Tunggakan", fontWeight = FontWeight.Bold) }
            )
        }

        if (selectedTabIndex == 0) {
            // My Bills List
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 12.dp, bottom = 96.dp)
            ) {
                item {
                    Text(
                        text = "Unit Rumah: ${activeResident?.fullAddress ?: "Purimas Tirtajaya"}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                items(myBills) { bill ->
                    BillItemCard(
                        bill = bill,
                        onPayClick = { viewModel.openPaymentModal(bill) },
                        onReceiptClick = { viewModel.showReceiptBill.value = bill },
                        isAdmin = currentRole == UserRole.PENGURUS_RT,
                        onManualPaidClick = { viewModel.markBillPaidManualByAdmin(bill) },
                        onReminderClick = { viewModel.showWhatsAppReminderModal.value = bill }
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }
        } else {
            // Community All Bills / Delinquent List
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 12.dp, bottom = 96.dp)
            ) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        FilterChip(
                            selected = filterStatus == "SEMUA",
                            onClick = { filterStatus = "SEMUA" },
                            label = { Text("Semua (${allBills.size})") }
                        )
                        FilterChip(
                            selected = filterStatus == "MENUNGGAK",
                            onClick = { filterStatus = "MENUNGGAK" },
                            label = { Text("Menunggak (${allBills.count { it.status != "LUNAS" }})") }
                        )
                        FilterChip(
                            selected = filterStatus == "LUNAS",
                            onClick = { filterStatus = "LUNAS" },
                            label = { Text("Lunas (${allBills.count { it.status == "LUNAS" }})") }
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                val filtered = allBills.filter {
                    when (filterStatus) {
                        "MENUNGGAK" -> it.status != "LUNAS"
                        "LUNAS" -> it.status == "LUNAS"
                        else -> true
                    }
                }

                items(filtered) { bill ->
                    BillItemCard(
                        bill = bill,
                        onPayClick = { viewModel.openPaymentModal(bill) },
                        onReceiptClick = { viewModel.showReceiptBill.value = bill },
                        isAdmin = currentRole == UserRole.PENGURUS_RT,
                        onManualPaidClick = { viewModel.markBillPaidManualByAdmin(bill) },
                        onReminderClick = { viewModel.showWhatsAppReminderModal.value = bill }
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }
        }
    }
}

@Composable
fun BillItemCard(
    bill: BillEntity,
    onPayClick: () -> Unit,
    onReceiptClick: () -> Unit,
    isAdmin: Boolean,
    onManualPaidClick: () -> Unit,
    onReminderClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = bill.residentName,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "${bill.houseUnit} • ${bill.monthName}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                StatusBadge(status = bill.status)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = PurimasRepository.formatRupiah(bill.amount),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp,
                        color = if (bill.status == "LUNAS") EmeraldPrimary else StatusDanger
                    )
                    if (bill.status == "LUNAS") {
                        Text(
                            text = "Lunas: ${bill.paidAt ?: "Terverifikasi"}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        Text(
                            text = "Jatuh Tempo: ${bill.dueDate}",
                            fontSize = 11.sp,
                            color = Color(0xFFC2410C),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (bill.status == "LUNAS") {
                        OutlinedButton(
                            onClick = onReceiptClick,
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Kuitansi", fontSize = 12.sp)
                        }
                    } else {
                        Button(
                            onClick = onPayClick,
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.AccountBalance, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Bayar VA", fontSize = 12.sp)
                        }

                        // WhatsApp Reminder Action button (for admin or resident reminder)
                        IconButton(
                            onClick = onReminderClick,
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFFDCFCE7))
                                .size(38.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Send,
                                contentDescription = "Pengingat WA",
                                tint = Color(0xFF15803D),
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        if (isAdmin) {
                            IconButton(
                                onClick = onManualPaidClick,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(EmeraldContainer)
                                    .size(38.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Tandai Lunas Manual",
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
