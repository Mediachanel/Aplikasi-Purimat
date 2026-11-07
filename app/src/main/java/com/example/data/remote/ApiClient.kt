package com.example.data.remote

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    // Ganti dengan IP VPS atau Domain server Anda (misal: "https://infotamadigital.com/api/" atau "http://172.31.254.175:3000/")
    var baseUrl: String = "http://10.0.2.2:3000/" // Default emulator Android ke localhost

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    private var retrofit: Retrofit? = null

    fun getService(customBaseUrl: String? = null): PurimasApiService {
        val urlToUse = customBaseUrl ?: baseUrl
        if (retrofit == null || retrofit?.baseUrl().toString() != urlToUse) {
            retrofit = Retrofit.Builder()
                .baseUrl(urlToUse)
                .client(okHttpClient)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
        }
        return retrofit!!.create(PurimasApiService::class.java)
    }
}
