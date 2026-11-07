package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.security.DataEncryptionUtil
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("Purimas RT 013", appName)
  }

  @Test
  fun `test citizen data AES-256 encryption and decryption`() {
    val originalNik = "3276021203800001"
    val encrypted = DataEncryptionUtil.encrypt(originalNik)
    assertNotEquals(originalNik, encrypted)

    val decrypted = DataEncryptionUtil.decrypt(encrypted)
    assertEquals(originalNik, decrypted)

    val masked = DataEncryptionUtil.maskNik(originalNik)
    assertEquals("3276 •••• •••• 0001", masked)
  }
}
