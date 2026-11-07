package com.example.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
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
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.repository.PurimasRepository
import com.example.ui.components.StatCard
import com.example.ui.theme.OrangeContainer
import com.example.ui.theme.OrangePrimary
import com.example.ui.theme.AmberContainer
import com.example.ui.theme.AmberSecondary
import com.example.ui.theme.StatusDanger
import com.example.ui.theme.StatusSuccess
import com.example.ui.viewmodel.MainTab
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

@Composable
fun AdminScreen(
    viewModel: PurimasViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val currentRole by viewModel.currentRole.collectAsState()
    val overdueBills by viewModel.overdueBills.collectAsState()
    val allBills by viewModel.allBills.collectAsState()
    val residents by viewModel.residents.collectAsState()
    val currentBalance by viewModel.currentBalance.collectAsState()
    val showBroadcastModal by viewModel.showBroadcastModal.collectAsState()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("admin_screen"),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 16.dp, bottom = 100.dp)
    ) {
        // Admin Profile Card
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
                                    text = if (currentRole == UserRole.PENGURUS_RT) "Hak Akses Admin Penuh" else "Akses Terbatas Warga",
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

        // Quick Stats Overview
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Warga Menunggak",
                    value = "${overdueBills.size} Rumah",
                    subtitle = "Perlu Pengingat WA",
                    icon = Icons.Default.Warning,
                    iconTint = StatusDanger,
                    containerColor = Color(0xFFFEE2E2).copy(alpha = 0.5f),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Total Warga",
                    value = "${residents.size} KK",
                    subtitle = "RT 013 RW 003",
                    icon = Icons.Default.PersonAdd,
                    iconTint = OrangePrimary,
                    containerColor = OrangeContainer.copy(alpha = 0.45f),
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Action Command Grid
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

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Daftar Rumah yang Menunggak Iuran:",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        items(overdueBills) { bill ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = bill.residentName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(text = "${bill.houseUnit} • ${bill.monthName}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(text = "Tunggakan: ${PurimasRepository.formatRupiah(bill.amount)}", fontSize = 12.sp, color = StatusDanger, fontWeight = FontWeight.SemiBold)
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        IconButton(
                            onClick = { viewModel.showWhatsAppReminderModal.value = bill },
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFDCFCE7))
                                .size(34.dp)
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "Kirim WA", tint = Color(0xFF15803D), modifier = Modifier.size(16.dp))
                        }

                        Button(
                            onClick = { viewModel.markBillPaidManualByAdmin(bill) },
                            colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("Lunas Manual", fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }

    if (showBroadcastModal) {
        NewBroadcastDialog(
            onDismiss = { viewModel.showBroadcastModal.value = false },
            onSubmit = { title, content, cat, isPinned ->
                viewModel.submitBroadcast(title, content, cat, isPinned)
            }
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
