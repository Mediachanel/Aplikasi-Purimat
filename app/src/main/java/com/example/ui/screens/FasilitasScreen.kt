package com.example.ui.screens

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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.MeetingRoom
import androidx.compose.material.icons.filled.Park
import androidx.compose.material.icons.filled.SportsTennis
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.FacilityBookingEntity
import com.example.ui.components.StatusBadge
import com.example.ui.theme.OrangeContainer
import com.example.ui.theme.OrangePrimary
import com.example.ui.theme.StatusDanger
import com.example.ui.viewmodel.PurimasViewModel
import com.example.ui.viewmodel.UserRole

@Composable
fun FasilitasScreen(
    viewModel: PurimasViewModel,
    modifier: Modifier = Modifier
) {
    val bookings by viewModel.bookings.collectAsState()
    val currentRole by viewModel.currentRole.collectAsState()
    val showNewBookingModal by viewModel.showNewBookingModal.collectAsState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .testTag("fasilitas_screen")
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 16.dp, bottom = 100.dp)
        ) {
            item {
                Text(
                    text = "Pemesanan Fasilitas Umum",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    text = "Booking digital sarana olahraga dan pertemuan RT 013 RW 003",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(14.dp))

                // Facilities Available Overview Grid
                Text(
                    text = "Fasilitas Perumahan Purimas Tirtajaya:",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FacilitySummaryChip("Lapangan Badminton", Icons.Default.SportsTennis, OrangePrimary, Modifier.weight(1f))
                    FacilitySummaryChip("Balai Warga RT 13", Icons.Default.MeetingRoom, Color(0xFF0F766E), Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FacilitySummaryChip("Gazebo Komunal", Icons.Default.Park, Color(0xFFD97706), Modifier.weight(1f))
                    FacilitySummaryChip("Tenda & Kursi RT", Icons.Default.Event, Color(0xFF8B5CF6), Modifier.weight(1f))
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Jadwal & Reservasi Terdaftar",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            items(bookings) { booking ->
                BookingItemCard(
                    booking = booking,
                    isAdmin = currentRole == UserRole.PENGURUS_RT,
                    onApprove = { viewModel.approveBooking(booking.id) },
                    onReject = { viewModel.rejectBooking(booking.id) }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        FloatingActionButton(
            onClick = { viewModel.showNewBookingModal.value = true },
            containerColor = OrangePrimary,
            contentColor = Color.White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 96.dp, end = 20.dp)
                .testTag("fab_new_booking")
        ) {
            Row(modifier = Modifier.padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Add, contentDescription = "Booking Fasum")
                Spacer(modifier = Modifier.width(6.dp))
                Text("Booking Fasum", fontWeight = FontWeight.Bold)
            }
        }
    }

    if (showNewBookingModal) {
        NewBookingDialog(
            onDismiss = { viewModel.showNewBookingModal.value = false },
            onSubmit = { fac, date, slot, purpose, notes ->
                viewModel.submitBooking(fac, date, slot, purpose, notes)
            }
        )
    }
}

@Composable
fun FacilitySummaryChip(title: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(text = title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        }
    }
}

@Composable
fun BookingItemCard(
    booking: FacilityBookingEntity,
    isAdmin: Boolean,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = booking.facilityName,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleSmall
                )
                StatusBadge(status = booking.status)
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Pemohon: ${booking.residentName} (${booking.houseUnit})",
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "Waktu: ${booking.date} • ${booking.timeSlot}",
                fontSize = 12.sp,
                color = OrangePrimary,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Keperluan: ${booking.purpose}",
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (booking.notes.isNotEmpty()) {
                Text(
                    text = "Catatan: ${booking.notes}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                )
            }

            if (isAdmin && booking.status == "MENUNGGU_PERSETUJUAN") {
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = onReject,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null, tint = StatusDanger, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Tolak", color = StatusDanger, fontSize = 11.sp)
                    }
                    Button(
                        onClick = onApprove,
                        colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Setujui", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewBookingDialog(
    onDismiss: () -> Unit,
    onSubmit: (facilityName: String, date: String, timeSlot: String, purpose: String, notes: String) -> Unit
) {
    val facilityOptions = listOf(
        "Lapangan Badminton Purimas",
        "Balai Pertemuan Warga RT 13",
        "Gazebo Komunal",
        "Tenda & Kursi Inventaris RT"
    )
    val timeSlotOptions = listOf(
        "08:00 - 11:00 WIB",
        "13:00 - 16:00 WIB",
        "16:00 - 18:30 WIB",
        "19:00 - 22:00 WIB"
    )

    var selectedFacility by remember { mutableStateOf(facilityOptions.first()) }
    var facilityExpanded by remember { mutableStateOf(false) }

    var selectedSlot by remember { mutableStateOf(timeSlotOptions.first()) }
    var slotExpanded by remember { mutableStateOf(false) }

    var dateText by remember { mutableStateOf("2026-11-15") }
    var purposeText by remember { mutableStateOf("") }
    var notesText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Booking Fasilitas Umum", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Facility Dropdown
                ExposedDropdownMenuBox(
                    expanded = facilityExpanded,
                    onExpandedChange = { facilityExpanded = !facilityExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedFacility,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Pilih Fasilitas") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = facilityExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = facilityExpanded,
                        onDismissRequest = { facilityExpanded = false }
                    ) {
                        facilityOptions.forEach { fac ->
                            DropdownMenuItem(
                                text = { Text(fac) },
                                onClick = {
                                    selectedFacility = fac
                                    facilityExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = dateText,
                    onValueChange = { dateText = it },
                    label = { Text("Tanggal Pemakaian (YYYY-MM-DD)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Time slot Dropdown
                ExposedDropdownMenuBox(
                    expanded = slotExpanded,
                    onExpandedChange = { slotExpanded = !slotExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedSlot,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Sesi Waktu") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = slotExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = slotExpanded,
                        onDismissRequest = { slotExpanded = false }
                    ) {
                        timeSlotOptions.forEach { slot ->
                            DropdownMenuItem(
                                text = { Text(slot) },
                                onClick = {
                                    selectedSlot = slot
                                    slotExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = purposeText,
                    onValueChange = { purposeText = it },
                    label = { Text("Keperluan Acara / Olahraga") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = notesText,
                    onValueChange = { notesText = it },
                    label = { Text("Catatan / Alat yang Dibutuhkan") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (purposeText.isNotBlank()) {
                        onSubmit(selectedFacility, dateText, selectedSlot, purposeText, notesText)
                    }
                },
                enabled = purposeText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = OrangePrimary)
            ) {
                Text("Kirim Permohonan")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
