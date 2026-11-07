package com.example.data.remote

import com.squareup.moshi.Json
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

// Base Generic Response
data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val count: Int? = null,
    val data: T? = null
)

// Auth Data Classes
data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: Long,
    val username: String,
    val role: String,
    val residentId: Long?,
    val fullName: String?,
    val blockNumber: String?,
    val houseNumber: String?,
    val phoneNumber: String?
)

// Bill DTOs
data class PayBillRequest(
    val paymentChannel: String = "QRIS",
    val transactionRef: String? = null
)

data class BillsSummaryData(
    val totalBills: Int,
    val totalLunas: Int,
    val amountLunas: Long,
    val totalMenunggak: Int,
    val amountMenunggak: Long,
    val totalPending: Int
)

// Cash DTOs
data class CashSummaryData(
    val totalIncome: Long,
    val totalExpense: Long,
    val currentBalance: Long
)

data class CreateCashRequest(
    val type: String, // "MASUK" or "KELUAR"
    val category: String,
    val amount: Long,
    val title: String,
    val description: String? = null,
    val date: String? = null,
    val monthYear: String = "November 2026",
    val receiptCode: String? = null
)

// Facility Booking DTOs
data class CreateBookingRequest(
    val facilityName: String,
    val date: String,
    val timeSlot: String,
    val purpose: String,
    val notes: String = ""
)

data class UpdateBookingStatusRequest(
    val status: String,
    val notes: String? = null
)

// Forum DTOs
data class CreatePostRequest(
    val title: String,
    val content: String,
    val category: String
)

data class AddCommentRequest(
    val commentText: String
)

// Announcement & Document DTOs
data class CreateAnnouncementRequest(
    val title: String,
    val content: String,
    val category: String,
    val isPinned: Boolean = false
)

data class CreateDocumentRequest(
    val title: String,
    val category: String,
    val fileNumber: String,
    val description: String = "",
    val issueDate: String? = null,
    val officialSignatory: String = "Ketua RT 013 / RW 003",
    val contentBody: String
)

interface PurimasApiService {

    // Health
    @GET("api/health")
    suspend fun checkHealth(): Response<Map<String, Any>>

    // Auth
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/auth/me")
    suspend fun getProfile(@Header("Authorization") token: String): Response<ApiResponse<Any>>

    // Residents
    @GET("api/residents")
    suspend fun getResidents(
        @Header("Authorization") token: String,
        @Query("block") block: String? = null,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<Map<String, Any>>>>

    // Bills
    @GET("api/bills")
    suspend fun getBills(
        @Header("Authorization") token: String,
        @Query("status") status: String? = null,
        @Query("month") month: String? = null,
        @Query("year") year: Int? = null
    ): Response<ApiResponse<List<Map<String, Any>>>>

    @GET("api/bills/summary")
    suspend fun getBillsSummary(@Header("Authorization") token: String): Response<ApiResponse<BillsSummaryData>>

    @GET("api/bills/resident/{residentId}")
    suspend fun getResidentBills(
        @Header("Authorization") token: String,
        @Path("residentId") residentId: Long
    ): Response<ApiResponse<List<Map<String, Any>>>>

    @POST("api/bills/{id}/pay")
    suspend fun payBill(
        @Header("Authorization") token: String,
        @Path("id") billId: Long,
        @Body request: PayBillRequest
    ): Response<ApiResponse<Map<String, Any>>>

    // Cash
    @GET("api/cash")
    suspend fun getCashTransactions(
        @Header("Authorization") token: String,
        @Query("type") type: String? = null
    ): Response<ApiResponse<List<Map<String, Any>>>>

    @GET("api/cash/summary")
    suspend fun getCashSummary(@Header("Authorization") token: String): Response<ApiResponse<CashSummaryData>>

    @POST("api/cash")
    suspend fun createCashTransaction(
        @Header("Authorization") token: String,
        @Body request: CreateCashRequest
    ): Response<ApiResponse<Map<String, Any>>>

    // Facility Bookings
    @GET("api/facilities")
    suspend fun getBookings(
        @Header("Authorization") token: String,
        @Query("status") status: String? = null
    ): Response<ApiResponse<List<Map<String, Any>>>>

    @POST("api/facilities")
    suspend fun createBooking(
        @Header("Authorization") token: String,
        @Body request: CreateBookingRequest
    ): Response<ApiResponse<Map<String, Any>>>

    @PUT("api/facilities/{id}/status")
    suspend fun updateBookingStatus(
        @Header("Authorization") token: String,
        @Path("id") bookingId: Long,
        @Body request: UpdateBookingStatusRequest
    ): Response<ApiResponse<Map<String, Any>>>

    // Forum
    @GET("api/forum/posts")
    suspend fun getForumPosts(
        @Header("Authorization") token: String,
        @Query("category") category: String? = null
    ): Response<ApiResponse<List<Map<String, Any>>>>

    @POST("api/forum/posts")
    suspend fun createForumPost(
        @Header("Authorization") token: String,
        @Body request: CreatePostRequest
    ): Response<ApiResponse<Map<String, Any>>>

    @POST("api/forum/posts/{id}/like")
    suspend fun likePost(
        @Header("Authorization") token: String,
        @Path("id") postId: Long
    ): Response<Map<String, Any>>

    @GET("api/forum/posts/{id}/comments")
    suspend fun getPostComments(
        @Header("Authorization") token: String,
        @Path("id") postId: Long
    ): Response<ApiResponse<List<Map<String, Any>>>>

    @POST("api/forum/posts/{id}/comments")
    suspend fun addComment(
        @Header("Authorization") token: String,
        @Path("id") postId: Long,
        @Body request: AddCommentRequest
    ): Response<ApiResponse<Map<String, Any>>>

    // Announcements
    @GET("api/announcements")
    suspend fun getAnnouncements(@Header("Authorization") token: String): Response<ApiResponse<List<Map<String, Any>>>>

    @POST("api/announcements")
    suspend fun createAnnouncement(
        @Header("Authorization") token: String,
        @Body request: CreateAnnouncementRequest
    ): Response<ApiResponse<Map<String, Any>>>

    // Documents
    @GET("api/documents")
    suspend fun getDocuments(@Header("Authorization") token: String): Response<ApiResponse<List<Map<String, Any>>>>

    @POST("api/documents")
    suspend fun createDocument(
        @Header("Authorization") token: String,
        @Body request: CreateDocumentRequest
    ): Response<ApiResponse<Map<String, Any>>>
}
