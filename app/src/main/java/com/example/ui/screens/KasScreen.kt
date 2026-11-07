package com.example.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
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
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CashTransactionEntity
import com.example.data.repository.PurimasRepository
import com.example.ui.components.StatCard
import com.example.ui.theme.OrangeContainer
import com.example.ui.theme.OrangePrimary
import com.example.ui.theme.AmberContainer
import com.example.ui.theme.StatusDanger
import com.example.ui.theme.StatusSuccess
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KasScreen(
    viewModel: PurimasViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val transactions by viewModel.cashTransactions.collectAsState()
    val totalIncome by viewModel.totalIncome.collectAsState()
    val totalExpense by viewModel.totalExpense.collectAsState()
    val currentBalance by viewModel.currentBalance.collectAsState()
    val currentRole by viewModel.currentRole.collectAsState()
    val showNewCashModal by viewModel.showNewCashModal.collectAsState()

    var filterType by remember { mutableStateOf("SEMUA") }

    val filteredTransactions = transactions.filter {
        when (filterType) {
            "MASUK" -> it.type == "MASUK"
            "KELUAR" -> it.type == "KELUAR"
            else -> true
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .testTag("kas_screen")
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 16.dp, bottom = 100.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Buku Kas Lingkungan",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            text = "Transparansi Kas RT 013 RW 003 Purimas Tirtajaya",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Button(
                        onClick = {
                            val report = """
                                *LAPORAN TRANSPARANSI KAS RT 013 RW 003*
                                *PERUMAHAN PURIMAS TIRTAJAYA DEPOK*
                                Periode: November 2026
                                
                                💰 *Ringkasan Kas:*
                                • Total Pemasukan : ${PurimasRepository.formatRupiah(totalIncome)}
                                • Total Pengeluaran: ${PurimasRepository.formatRupiah(totalExpense)}
                                • *Saldo Kas Terbuka*: *${PurimasRepository.formatRupiah(currentBalance)}*
                                
                                📌 *Alokasi Utama:*
                                • Honor 2 Satpam Pos Utama
                                • Truk Pengangkut Sampah DLHK 3x/minggu
                                • Pemeliharaan Lampu PJU & Taman Cluster
                                
                                Laporan ini dapat diakses secara transparan oleh seluruh warga melalui aplikasi Purimas RT 013.
                            """.trimIndent()
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, report)
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Bagikan Laporan Kas RT"))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Bagikan", fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Stats Cards
                StatCard(
                    title = "Total Saldo Kas RT Saat Ini",
                    value = PurimasRepository.formatRupiah(currentBalance),
                    subtitle = "Tersimpan aman di Rekening Giro Kas Lingkungan",
                    icon = Icons.Default.TrendingUp,
                    iconTint = OrangePrimary,
                    containerColor = OrangeContainer.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatCard(
                        title = "Total Pemasukan",
                        value = PurimasRepository.formatRupiah(totalIncome),
                        subtitle = "Iuran & Sewa",
                        icon = Icons.Default.ArrowDownward,
                        iconTint = Color(0xFF16A34A),
                        containerColor = AmberContainer.copy(alpha = 0.5f),
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = "Total Pengeluaran",
                        value = PurimasRepository.formatRupiah(totalExpense),
                        subtitle = "Satpam, Sampah, PJU",
                        icon = Icons.Default.ArrowUpward,
                        iconTint = StatusDanger,
                        containerColor = Color(0xFFFEE2E2).copy(alpha = 0.6f),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Filters
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = filterType == "SEMUA",
                        onClick = { filterType = "SEMUA" },
                        label = { Text("Semua Transaksi (${transactions.size})") }
                    )
                    FilterChip(
                        selected = filterType == "MASUK",
                        onClick = { filterType = "MASUK" },
                        label = { Text("Kas Masuk") }
                    )
                    FilterChip(
                        selected = filterType == "KELUAR",
                        onClick = { filterType = "KELUAR" },
                        label = { Text("Kas Keluar") }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Riwayat Arus Kas Lingkungan",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            items(filteredTransactions) { trx ->
                CashTransactionCard(trx)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        // FAB to Record New Transaction (Enabled for Admin or accessible with prompt)
        if (currentRole == UserRole.PENGURUS_RT) {
            FloatingActionButton(
                onClick = { viewModel.showNewCashModal.value = true },
                containerColor = OrangePrimary,
                contentColor = Color.White,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 96.dp, end = 20.dp)
                    .testTag("fab_add_cash")
            ) {
                Row(modifier = Modifier.padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Add, contentDescription = "Catat Kas Baru")
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Catat Kas", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    if (showNewCashModal) {
        NewCashTransactionDialog(
            onDismiss = { viewModel.showNewCashModal.value = false },
            onSubmit = { type, category, amount, title, desc ->
                viewModel.submitCashTransaction(type, category, amount, title, desc)
            }
        )
    }
}

@Composable
fun CashTransactionCard(trx: CashTransactionEntity) {
    val isMasuk = trx.type == "MASUK"
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
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
                    .background(if (isMasuk) Color(0xFFDCFCE7) else Color(0xFFFEE2E2)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isMasuk) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                    contentDescription = null,
                    tint = if (isMasuk) Color(0xFF15803D) else Color(0xFFB91C1C),
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = trx.title,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = "${trx.category} • ${trx.date}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (trx.description.isNotEmpty()) {
                    Text(
                        text = trx.description,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = (if (isMasuk) "+ " else "- ") + PurimasRepository.formatRupiah(trx.amount),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = if (isMasuk) Color(0xFF15803D) else Color(0xFFB91C1C)
                )
                Text(
                    text = trx.recordedBy,
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewCashTransactionDialog(
    onDismiss: () -> Unit,
    onSubmit: (type: String, category: String, amount: Long, title: String, desc: String) -> Unit
) {
    var type by remember { mutableStateOf("KELUAR") }
    var category by remember { mutableStateOf("Honor Satpam") }
    var amountText by remember { mutableStateOf("") }
    var titleText by remember { mutableStateOf("") }
    var descText by remember { mutableStateOf("") }

    val categoriesMasuk = listOf("Iuran Warga", "Sewa Fasilitas", "Donasi Warga", "Saldo Awal", "Lain-lain")
    val categoriesKeluar = listOf("Honor Satpam", "Pengangkutan Sampah", "Perbaikan Fasum", "Kegiatan RT", "Konsumsi Rapat", "Listrik & Air PJU")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Catat Transaksi Kas Baru", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            type = "MASUK"
                            category = categoriesMasuk.first()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (type == "MASUK") OrangePrimary else Color(0xFFE2E8F0),
                            contentColor = if (type == "MASUK") Color.White else Color(0xFF334155)
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Kas Masuk (+)")
                    }
                    Button(
                        onClick = {
                            type = "KELUAR"
                            category = categoriesKeluar.first()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (type == "KELUAR") StatusDanger else Color(0xFFE2E8F0),
                            contentColor = if (type == "KELUAR") Color.White else Color(0xFF334155)
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Kas Keluar (-)")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = titleText,
                    onValueChange = { titleText = it },
                    label = { Text("Judul Pengeluaran / Pemasukan") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = amountText,
                    onValueChange = { if (it.all { ch -> ch.isDigit() }) amountText = it },
                    label = { Text("Nominal (Rp)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = descText,
                    onValueChange = { descText = it },
                    label = { Text("Keterangan Tambahan / Bukti Nota") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amt = amountText.toLongOrNull() ?: 0L
                    if (amt > 0 && titleText.isNotBlank()) {
                        onSubmit(type, category, amt, titleText, descText)
                    }
                },
                enabled = amountText.isNotBlank() && titleText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary)
            ) {
                Text("Simpan Transaksi")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
