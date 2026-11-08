package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.model.AnnouncementEntity
import com.example.data.model.BillEntity
import com.example.data.model.CashTransactionEntity
import com.example.data.model.DiscussionCommentEntity
import com.example.data.model.DiscussionPostEntity
import com.example.data.model.DocumentArchiveEntity
import com.example.data.model.FacilityBookingEntity
import com.example.data.model.ResidentEntity

@Database(
    entities = [
        ResidentEntity::class,
        BillEntity::class,
        CashTransactionEntity::class,
        FacilityBookingEntity::class,
        DiscussionPostEntity::class,
        DiscussionCommentEntity::class,
        AnnouncementEntity::class,
        DocumentArchiveEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class PurimasDatabase : RoomDatabase() {
    abstract fun residentDao(): ResidentDao
    abstract fun billDao(): BillDao
    abstract fun cashDao(): CashDao
    abstract fun bookingDao(): BookingDao
    abstract fun forumDao(): ForumDao
    abstract fun announcementDao(): AnnouncementDao
    abstract fun documentDao(): DocumentDao

    companion object {
        @Volatile
        private var INSTANCE: PurimasDatabase? = null

        fun getDatabase(context: Context): PurimasDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    PurimasDatabase::class.java,
                    "purimas_tirtajaya_rt013.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
