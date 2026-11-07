package com.example.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.FamilyRestroom
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.ResidentEntity
import com.example.data.security.DataEncryptionUtil
import com.example.ui.theme.OrangeContainer
import com.example.ui.theme.OrangePrimary
import com.example.ui.theme.AmberSecondary
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

@Composable
fun WargaScreen(
    viewModel: PurimasViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val residents by viewModel.residents.collectAsState()
    val currentRole by viewModel.currentRole.collectAsState()
    val showAddResidentModal by viewModel.showAddResidentModal.collectAsState()

    var searchQuery by remember { mutableStateOf("") }

    val filteredResidents = residents.filter {
        it.fullName.contains(searchQuery, ignoreCase = true) ||
                it.blockNumber.contains(searchQuery, ignoreCase = true) ||
                it.houseNumber.contains(searchQuery, ignoreCase = true)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .testTag("warga_screen")
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 16.dp, bottom = 100.dp)
        ) {
            item {
                Text(
                    text = "Keanggotaan Warga RT 013",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    text = "Direktori resmi penghuni Perumahan Purimas Tirtajaya (Total: ${residents.size} Rumah)",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Security Banner
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFDCFCE7).copy(alpha = 0.6f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = Color(0xFF15803D),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Privasi Warga Terlindungi: NIK Disimpan dengan Enkripsi AES-256",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF15803D)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Cari warga berdasarkan nama atau blok...", fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))
            }

            items(filteredResidents) { resident ->
                ResidentItemCard(
                    resident = resident,
                    onWhatsAppClick = {
                        val uri = Uri.parse("https://api.whatsapp.com/send?phone=${resident.phoneNumber}")
                        context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                    }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        if (currentRole == UserRole.PENGURUS_RT) {
            FloatingActionButton(
                onClick = { viewModel.showAddResidentModal.value = true },
                containerColor = OrangePrimary,
                contentColor = Color.White,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 96.dp, end = 20.dp)
                    .testTag("fab_add_resident")
            ) {
                Row(modifier = Modifier.padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Add, contentDescription = "Tambah Warga")
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Tambah Warga", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    if (showAddResidentModal) {
        NewResidentDialog(
            onDismiss = { viewModel.showAddResidentModal.value = false },
            onSubmit = { name, block, houseNo, phone, nik, status, familyCount, vehicleCount, role ->
                viewModel.submitNewResident(name, block, houseNo, phone, nik, status, familyCount, vehicleCount, role)
            }
        )
    }
}

@Composable
fun ResidentItemCard(
    resident: ResidentEntity,
    onWhatsAppClick: () -> Unit
) {
    // Decrypt and mask NIK for safe display
    val decryptedNik = DataEncryptionUtil.decrypt(resident.encryptedNik)
    val maskedNik = DataEncryptionUtil.maskNik(decryptedNik)

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
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(OrangeContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = OrangePrimary,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = resident.fullName,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleSmall
                    )
                    if (resident.role == "PENGURUS") {
                        Spacer(modifier = Modifier.width(6.dp))
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
                Text(
                    text = "${resident.blockNumber} No. ${resident.houseNumber} • ${resident.occupancyStatus}",
                    fontSize = 12.sp,
                    color = OrangePrimary,
                    fontWeight = FontWeight.Medium
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 2.dp)
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color(0xFF15803D))
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "NIK: $maskedNik",
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 2.dp)
                ) {
                    Icon(Icons.Default.FamilyRestroom, contentDescription = null, modifier = Modifier.size(13.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(text = "${resident.familyMembersCount} Jiwa", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(10.dp))
                    Icon(Icons.Default.DirectionsCar, contentDescription = null, modifier = Modifier.size(13.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(text = "${resident.vehicleCount} Kendaraan", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            IconButton(
                onClick = onWhatsAppClick,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0xFFDCFCE7))
                    .size(38.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Hubungi via WhatsApp",
                    tint = Color(0xFF15803D),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun NewResidentDialog(
    onDismiss: () -> Unit,
    onSubmit: (
        name: String,
        block: String,
        houseNo: String,
        phone: String,
        nik: String,
        status: String,
        familyCount: Int,
        vehicleCount: Int,
        role: String
    ) -> Unit
) {
    var nameText by remember { mutableStateOf("") }
    var blockText by remember { mutableStateOf("Blok A") }
    var houseNoText by remember { mutableStateOf("") }
    var phoneText by remember { mutableStateOf("0812") }
    var nikText by remember { mutableStateOf("") }
    var statusText by remember { mutableStateOf("Pemilik Tetap") }
    var familyCountText by remember { mutableStateOf("3") }
    var vehicleCountText by remember { mutableStateOf("2") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Tambah Data Warga Baru", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = nameText,
                    onValueChange = { nameText = it },
                    label = { Text("Nama Lengkap Kepala Keluarga") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = blockText,
                        onValueChange = { blockText = it },
                        label = { Text("Blok (A/B/C/D)") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = houseNoText,
                        onValueChange = { houseNoText = it },
                        label = { Text("Nomor Rumah") },
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = nikText,
                    onValueChange = { if (it.all { ch -> ch.isDigit() } && it.length <= 16) nikText = it },
                    label = { Text("NIK (16 Digit - Enkripsi AES-256)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = phoneText,
                    onValueChange = { phoneText = it },
                    label = { Text("No. WhatsApp Aktif") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = familyCountText,
                        onValueChange = { familyCountText = it },
                        label = { Text("Jumlah Jiwa") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = vehicleCountText,
                        onValueChange = { vehicleCountText = it },
                        label = { Text("Kendaraan") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (nameText.isNotBlank() && houseNoText.isNotBlank()) {
                        onSubmit(
                            nameText,
                            blockText,
                            houseNoText,
                            phoneText,
                            nikText.ifEmpty { "3276020101900001" },
                            statusText,
                            familyCountText.toIntOrNull() ?: 3,
                            vehicleCountText.toIntOrNull() ?: 2,
                            "WARGA"
                        )
                    }
                },
                enabled = nameText.isNotBlank() && houseNoText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary)
            ) {
                Text("Daftarkan Warga")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
