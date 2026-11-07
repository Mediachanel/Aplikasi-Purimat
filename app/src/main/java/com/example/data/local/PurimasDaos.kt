package com.example.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.model.AnnouncementEntity
import com.example.data.model.BillEntity
import com.example.data.model.CashTransactionEntity
import com.example.data.model.DiscussionCommentEntity
import com.example.data.model.DiscussionPostEntity
import com.example.data.model.DocumentArchiveEntity
import com.example.data.model.FacilityBookingEntity
import com.example.data.model.ResidentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ResidentDao {
    @Query("SELECT * FROM residents ORDER BY blockNumber ASC, houseNumber ASC")
    fun getAllResidents(): Flow<List<ResidentEntity>>

    @Query("SELECT * FROM residents WHERE id = :id")
    suspend fun getResidentById(id: Long): ResidentEntity?

    @Query("SELECT COUNT(*) FROM residents")
    suspend fun getResidentCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertResident(resident: ResidentEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(residents: List<ResidentEntity>)

    @Update
    suspend fun updateResident(resident: ResidentEntity)

    @Delete
    suspend fun deleteResident(resident: ResidentEntity)
}

@Dao
interface BillDao {
    @Query("SELECT * FROM bills ORDER BY year DESC, monthIndex DESC, houseUnit ASC")
    fun getAllBills(): Flow<List<BillEntity>>

    @Query("SELECT * FROM bills WHERE residentId = :residentId ORDER BY year DESC, monthIndex DESC")
    fun getBillsByResident(residentId: Long): Flow<List<BillEntity>>

    @Query("SELECT * FROM bills WHERE status != 'LUNAS' ORDER BY houseUnit ASC")
    fun getOverdueBills(): Flow<List<BillEntity>>

    @Query("SELECT * FROM bills WHERE status = 'LUNAS' ORDER BY paidAt DESC")
    fun getPaidBills(): Flow<List<BillEntity>>

    @Query("SELECT COUNT(*) FROM bills")
    suspend fun getBillCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBill(bill: BillEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(bills: List<BillEntity>)

    @Update
    suspend fun updateBill(bill: BillEntity)

    @Query("UPDATE bills SET status = 'LUNAS', paidAt = :paidAt, transactionRef = :transactionRef, paymentChannel = :paymentChannel WHERE id = :billId")
    suspend fun markAsPaid(billId: Long, paidAt: String, transactionRef: String, paymentChannel: String)
}

@Dao
interface CashDao {
    @Query("SELECT * FROM cash_transactions ORDER BY date DESC, id DESC")
    fun getAllTransactions(): Flow<List<CashTransactionEntity>>

    @Query("SELECT * FROM cash_transactions WHERE type = :type ORDER BY date DESC")
    fun getTransactionsByType(type: String): Flow<List<CashTransactionEntity>>

    @Query("SELECT COALESCE(SUM(amount), 0) FROM cash_transactions WHERE type = 'MASUK'")
    fun getTotalIncomeFlow(): Flow<Long>

    @Query("SELECT COALESCE(SUM(amount), 0) FROM cash_transactions WHERE type = 'KELUAR'")
    fun getTotalExpenseFlow(): Flow<Long>

    @Query("SELECT COUNT(*) FROM cash_transactions")
    suspend fun getTransactionCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: CashTransactionEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(transactions: List<CashTransactionEntity>)
}

@Dao
interface BookingDao {
    @Query("SELECT * FROM facility_bookings ORDER BY date DESC, id DESC")
    fun getAllBookings(): Flow<List<FacilityBookingEntity>>

    @Query("SELECT * FROM facility_bookings WHERE residentId = :residentId ORDER BY date DESC")
    fun getBookingsByResident(residentId: Long): Flow<List<FacilityBookingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBooking(booking: FacilityBookingEntity): Long

    @Query("UPDATE facility_bookings SET status = :status WHERE id = :bookingId")
    suspend fun updateStatus(bookingId: Long, status: String)

    @Query("SELECT COUNT(*) FROM facility_bookings")
    suspend fun getBookingCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(bookings: List<FacilityBookingEntity>)
}

@Dao
interface ForumDao {
    @Query("SELECT * FROM forum_posts ORDER BY id DESC")
    fun getAllPosts(): Flow<List<DiscussionPostEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPost(post: DiscussionPostEntity): Long

    @Query("SELECT * FROM forum_comments WHERE postId = :postId ORDER BY id ASC")
    fun getCommentsForPost(postId: Long): Flow<List<DiscussionCommentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertComment(comment: DiscussionCommentEntity): Long

    @Query("UPDATE forum_posts SET commentCount = commentCount + 1 WHERE id = :postId")
    suspend fun incrementCommentCount(postId: Long)

    @Query("SELECT COUNT(*) FROM forum_posts")
    suspend fun getPostCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllPosts(posts: List<DiscussionPostEntity>)
}

@Dao
interface AnnouncementDao {
    @Query("SELECT * FROM announcements ORDER BY isPinned DESC, id DESC")
    fun getAllAnnouncements(): Flow<List<AnnouncementEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnnouncement(announcement: AnnouncementEntity): Long

    @Query("UPDATE announcements SET isRead = 1")
    suspend fun markAllAsRead()

    @Query("SELECT COUNT(*) FROM announcements")
    suspend fun getAnnouncementCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(announcements: List<AnnouncementEntity>)
}

@Dao
interface DocumentDao {
    @Query("SELECT * FROM documents ORDER BY id ASC")
    fun getAllDocuments(): Flow<List<DocumentArchiveEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDocument(document: DocumentArchiveEntity): Long

    @Query("SELECT COUNT(*) FROM documents")
    suspend fun getDocumentCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(documents: List<DocumentArchiveEntity>)
}
