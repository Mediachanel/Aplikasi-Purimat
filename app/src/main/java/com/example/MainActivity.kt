package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SportsTennis
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import com.example.data.model.ResidentEntity
import com.example.ui.components.AdminPinDialog
import com.example.ui.components.DigitalReceiptDialog
import com.example.ui.components.EncryptionAuditDialog
import com.example.ui.components.VirtualAccountPaymentDialog
import com.example.ui.components.WhatsAppReminderDialog
import com.example.ui.screens.AdminScreen
import com.example.ui.screens.DokumenScreen
import com.example.ui.screens.FasilitasScreen
import com.example.ui.screens.ForumScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.IuranScreen
import com.example.ui.screens.KasScreen
import com.example.ui.screens.WargaScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.OnOrangeContainer
import com.example.ui.theme.OrangeContainer
import com.example.ui.theme.OrangePrimary
import com.example.ui.viewmodel.MainTab
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

class MainActivity : ComponentActivity() {

    private val viewModel: PurimasViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                val activeTab by viewModel.activeTab.collectAsState()
                val currentRole by viewModel.currentRole.collectAsState()
                val activeResident by viewModel.activeResident.collectAsState()
                val userNotice by viewModel.userNoticeMessage.collectAsState()

                // Modals state
                val selectedBillForPayment by viewModel.selectedBillForPayment.collectAsState()
                val isProcessingPayment by viewModel.isProcessingPayment.collectAsState()
                val paymentSuccessRef by viewModel.paymentSuccessRef.collectAsState()
                val showReceiptBill by viewModel.showReceiptBill.collectAsState()
                val showWhatsAppReminderModal by viewModel.showWhatsAppReminderModal.collectAsState()
                val showAdminPinModal by viewModel.showAdminPinModal.collectAsState()
                val adminPinError by viewModel.adminPinError.collectAsState()
                val showEncryptionAuditModal by viewModel.showEncryptionAuditModal.collectAsState()
                val showResidentSwitcherModal by viewModel.showResidentSwitcherModal.collectAsState()
                val residents by viewModel.residents.collectAsState()

                var showMoreMenuSheet by remember { mutableStateOf(false) }

                val snackbarHostState = remember { SnackbarHostState() }

                LaunchedEffect(userNotice) {
                    userNotice?.let {
                        snackbarHostState.showSnackbar(it)
                        viewModel.dismissNotice()
                    }
                }

                // Handle back button for secondary screens
                BackHandler(enabled = activeTab != MainTab.BERANDA) {
                    viewModel.switchTab(MainTab.BERANDA)
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    contentWindowInsets = WindowInsets.safeDrawing,
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    topBar = {
                        TopAppBar(
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.surface,
                                titleContentColor = MaterialTheme.colorScheme.onSurface
                            ),
                            title = {
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = "Purimas RT 013",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 17.sp,
                                            color = OrangePrimary
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(if (currentRole == UserRole.PENGURUS_RT) Color(0xFFFEE2E2) else Color(0xFFDCFCE7))
                                                .clickable { viewModel.requestSwitchToAdmin() }
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = if (currentRole == UserRole.PENGURUS_RT) "ADMIN RT" else "WARGA",
                                                color = if (currentRole == UserRole.PENGURUS_RT) Color(0xFFDC2626) else Color(0xFF15803D),
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 9.sp
                                            )
                                        }
                                    }
                                    Text(
                                        text = "RW 003 Tirtajaya, Sukmajaya - Depok",
                                        fontSize = 10.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            },
                            actions = {
                                // Encryption status badge
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(Color(0xFFDCFCE7))
                                        .clickable { viewModel.showEncryptionAuditModal.value = true }
                                        .padding(horizontal = 8.dp, vertical = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Lock,
                                            contentDescription = "Enkripsi AES-256",
                                            tint = Color(0xFF15803D),
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Spacer(modifier = Modifier.width(3.dp))
                                        Text(
                                            text = "AES-256",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF15803D)
                                        )
                                    }
                                }

                                IconButton(
                                    onClick = { viewModel.showResidentSwitcherModal.value = true },
                                    modifier = Modifier.testTag("action_switch_resident")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Person,
                                        contentDescription = "Ganti Rumah / Akun",
                                        tint = OrangePrimary
                                    )
                                }
                            }
                        )
                    },
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface,
                            tonalElevation = 6.dp,
                            modifier = Modifier
                                .windowInsetsPadding(WindowInsets.navigationBars)
                                .testTag("main_bottom_nav")
                        ) {
                            NavigationBarItem(
                                selected = activeTab == MainTab.BERANDA,
                                onClick = { viewModel.switchTab(MainTab.BERANDA) },
                                icon = { Icon(Icons.Default.Home, contentDescription = "Beranda") },
                                label = { Text("Beranda", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = OrangePrimary,
                                    indicatorColor = OrangeContainer
                                )
                            )
                            NavigationBarItem(
                                selected = activeTab == MainTab.IURAN,
                                onClick = { viewModel.switchTab(MainTab.IURAN) },
                                icon = { Icon(Icons.Default.Receipt, contentDescription = "Iuran") },
                                label = { Text("Iuran VA", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = OrangePrimary,
                                    indicatorColor = OrangeContainer
                                )
                            )
                            NavigationBarItem(
                                selected = activeTab == MainTab.KAS,
                                onClick = { viewModel.switchTab(MainTab.KAS) },
                                icon = { Icon(Icons.Default.AccountBalance, contentDescription = "Kas RT") },
                                label = { Text("Kas RT", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = OrangePrimary,
                                    indicatorColor = OrangeContainer
                                )
                            )
                            NavigationBarItem(
                                selected = activeTab == MainTab.FASILITAS,
                                onClick = { viewModel.switchTab(MainTab.FASILITAS) },
                                icon = { Icon(Icons.Default.SportsTennis, contentDescription = "Fasum") },
                                label = { Text("Fasum", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = OrangePrimary,
                                    indicatorColor = OrangeContainer
                                )
                            )
                            NavigationBarItem(
                                selected = activeTab in listOf(MainTab.WARGA, MainTab.FORUM, MainTab.DOKUMEN, MainTab.ADMIN),
                                onClick = { showMoreMenuSheet = true },
                                icon = { Icon(Icons.Default.MoreHoriz, contentDescription = "Lainnya") },
                                label = { Text("Lainnya", fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = OrangePrimary,
                                    indicatorColor = OrangeContainer
                                )
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (activeTab) {
                            MainTab.BERANDA -> HomeScreen(viewModel = viewModel)
                            MainTab.IURAN -> IuranScreen(viewModel = viewModel)
                            MainTab.KAS -> KasScreen(viewModel = viewModel)
                            MainTab.FASILITAS -> FasilitasScreen(viewModel = viewModel)
                            MainTab.WARGA -> WargaScreen(viewModel = viewModel)
                            MainTab.FORUM -> ForumScreen(viewModel = viewModel)
                            MainTab.DOKUMEN -> DokumenScreen(viewModel = viewModel)
                            MainTab.ADMIN -> AdminScreen(viewModel = viewModel)
                        }
                    }
                }

                // Modal: More Menu Picker (Warga, Forum, Dokumen, Admin)
                if (showMoreMenuSheet) {
                    AlertDialog(
                        onDismissRequest = { showMoreMenuSheet = false },
                        title = {
                            Text(
                                text = "Menu Layanan Lingkungan",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        },
                        text = {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                MoreMenuItem(
                                    title = "Keanggotaan Warga RT 013",
                                    desc = "Direktori kepala keluarga, blok rumah & kontak WA",
                                    icon = Icons.Default.People,
                                    color = Color(0xFF0284C7)
                                ) {
                                    showMoreMenuSheet = false
                                    viewModel.switchTab(MainTab.WARGA)
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                MoreMenuItem(
                                    title = "Forum Diskusi Warga",
                                    desc = "Aspirasi, keamanan ronda, gotong royong",
                                    icon = Icons.Default.Forum,
                                    color = Color(0xFF8B5CF6)
                                ) {
                                    showMoreMenuSheet = false
                                    viewModel.switchTab(MainTab.FORUM)
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                MoreMenuItem(
                                    title = "Arsip Dokumen Administrasi",
                                    desc = "Surat pengantar RT, tata tertib, jadwal siskamling",
                                    icon = Icons.Default.Description,
                                    color = Color(0xFF0D9488)
                                ) {
                                    showMoreMenuSheet = false
                                    viewModel.switchTab(MainTab.DOKUMEN)
                                }

                                Spacer(modifier = Modifier.height(6.dp))

                                MoreMenuItem(
                                    title = if (currentRole == UserRole.PENGURUS_RT) "Dashboard Admin Pengurus RT" else "Akses Level Pengurus RT (PIN)",
                                    desc = "Kendali tunggakan, blast WA tgl 25, approval fasum",
                                    icon = Icons.Default.AdminPanelSettings,
                                    color = if (currentRole == UserRole.PENGURUS_RT) Color(0xFFDC2626) else OrangePrimary
                                ) {
                                    showMoreMenuSheet = false
                                    if (currentRole == UserRole.PENGURUS_RT) {
                                        viewModel.switchTab(MainTab.ADMIN)
                                    } else {
                                        viewModel.requestSwitchToAdmin()
                                    }
                                }
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { showMoreMenuSheet = false }) {
                                Text("Tutup")
                            }
                        }
                    )
                }

                // Modal: Virtual Account Payment
                if (selectedBillForPayment != null) {
                    VirtualAccountPaymentDialog(
                        bill = selectedBillForPayment!!,
                        isProcessing = isProcessingPayment,
                        successRef = paymentSuccessRef,
                        onDismiss = {
                            viewModel.selectedBillForPayment.value = null
                            viewModel.paymentSuccessRef.value = null
                        },
                        onSimulatePayment = { bank ->
                            viewModel.processVirtualAccountPayment(bank)
                        },
                        onViewReceipt = {
                            val paid = selectedBillForPayment
                            viewModel.selectedBillForPayment.value = null
                            viewModel.paymentSuccessRef.value = null
                            if (paid != null) {
                                viewModel.showReceiptBill.value = paid.copy(status = "LUNAS")
                            }
                        }
                    )
                }

                // Modal: Digital Receipt
                if (showReceiptBill != null) {
                    DigitalReceiptDialog(
                        bill = showReceiptBill!!,
                        onDismiss = { viewModel.showReceiptBill.value = null }
                    )
                }

                // Modal: WhatsApp Reminder Dialog
                if (showWhatsAppReminderModal != null) {
                    WhatsAppReminderDialog(
                        bill = showWhatsAppReminderModal!!,
                        onDismiss = { viewModel.showWhatsAppReminderModal.value = null }
                    )
                }

                // Modal: Admin PIN Dialog
                if (showAdminPinModal) {
                    AdminPinDialog(
                        errorMessage = adminPinError,
                        onDismiss = { viewModel.showAdminPinModal.value = false },
                        onVerify = { pin ->
                            viewModel.verifyAdminPin(pin)
                            if (viewModel.currentRole.value == UserRole.PENGURUS_RT) {
                                viewModel.switchTab(MainTab.ADMIN)
                            }
                        }
                    )
                }

                // Modal: Encryption Audit
                if (showEncryptionAuditModal) {
                    EncryptionAuditDialog(
                        onDismiss = { viewModel.showEncryptionAuditModal.value = false }
                    )
                }

                // Modal: Resident Switcher (Switch tested house)
                if (showResidentSwitcherModal) {
                    ResidentSwitcherDialog(
                        residents = residents,
                        activeId = activeResident?.id ?: 1L,
                        onDismiss = { viewModel.showResidentSwitcherModal.value = false },
                        onSelectResident = { res ->
                            viewModel.switchActiveResident(res.id)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun MoreMenuItem(
    title: String,
    desc: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        shape = RoundedCornerShape(12.dp),
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
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Text(text = desc, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun ResidentSwitcherDialog(
    residents: List<ResidentEntity>,
    activeId: Long,
    onDismiss: () -> Unit,
    onSelectResident: (ResidentEntity) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Pilih Rumah Warga Aktif", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Pilih unit rumah untuk simulasi tampilan warga atau pengurus RT:",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(280.dp)
                ) {
                    items(residents) { res ->
                        val isSelected = res.id == activeId
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) OrangeContainer else MaterialTheme.colorScheme.surface
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { onSelectResident(res) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(text = res.fullName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text(text = "${res.blockNumber} No. ${res.houseNumber} • ${res.occupancyStatus}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                if (res.role == "PENGURUS") {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(Color(0xFFFEF3C7))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("Pengurus RT", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFFB45309))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Tutup")
            }
        }
    )
}
