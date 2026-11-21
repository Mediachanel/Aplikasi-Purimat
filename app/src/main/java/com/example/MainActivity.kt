package com.example

import android.app.Activity
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.view.WindowInsets
import android.print.PrintManager
import android.print.PrintAttributes
import android.webkit.JavascriptInterface
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

/** One server application and one database for Android and browser clients. */
class MainActivity : Activity() {
    private lateinit var web: WebView
    private lateinit var loading: ProgressBar
    private lateinit var errorPanel: LinearLayout
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val origin = "https://purimas.infotamadygital.com"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.WHITE
        window.navigationBarColor = Color.WHITE
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setBackgroundColor(Color.WHITE) }
        root.setOnApplyWindowInsetsListener { view, insets ->
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                val bars = insets.getInsets(WindowInsets.Type.systemBars())
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            } else {
                @Suppress("DEPRECATION")
                view.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop, insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            }
            insets
        }
        loading = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        root.addView(loading, LinearLayout.LayoutParams(-1, 5))
        errorPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 80, 40, 40)
            visibility = View.GONE
            addView(TextView(this@MainActivity).apply { text = "Purimas belum dapat dihubungi. Periksa koneksi Internet Anda."; textSize = 18f })
            addView(Button(this@MainActivity).apply { text = "Coba lagi"; setOnClickListener { errorPanel.visibility = View.GONE; web.visibility = View.VISIBLE; web.loadUrl(origin) } })
        }
        root.addView(errorPanel)
        web = WebView(this)
        root.addView(web, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(root)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "$userAgentString PurimasAndroid/2.0"
        }
        web.addJavascriptInterface(PrintBridge(), "PurimasPrint")
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (uri.scheme == "https" && uri.host == Uri.parse(origin).host) return false
                if (uri.scheme in listOf("https", "http", "tel", "mailto")) {
                    try { startActivity(Intent(Intent.ACTION_VIEW, uri)) } catch (_: ActivityNotFoundException) { }
                }
                return true
            }
            override fun onPageFinished(view: WebView, url: String) { loading.visibility = View.GONE }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) { web.visibility = View.GONE; errorPanel.visibility = View.VISIBLE; loading.visibility = View.GONE }
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, progress: Int) { loading.progress = progress; loading.visibility = if(progress == 100) View.GONE else View.VISIBLE }
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/jpeg", "image/png", "application/pdf"))
                }
                return try { @Suppress("DEPRECATION") startActivityForResult(Intent.createChooser(intent, "Pilih KTP / KK"), 100); true }
                catch (_: ActivityNotFoundException) { fileCallback?.onReceiveValue(null); fileCallback = null; false }
            }
        }
        web.setDownloadListener { url, _, _, mimeType, _ ->
            val uri = Uri.parse(url)
            if (uri.scheme == "https" && uri.host == Uri.parse(origin).host) {
                val name = if (mimeType == "application/vnd.android.package-archive") "Purimas-Android.apk" else "Purimas-${System.currentTimeMillis()}.${if(mimeType=="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") "xlsx" else if(mimeType=="application/pdf") "pdf" else if(mimeType=="image/png") "png" else if(mimeType?.startsWith("text/csv") == true) "csv" else "jpg"}"
                val request = DownloadManager.Request(uri).setTitle(name).setMimeType(mimeType)
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, name)
                (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
            }
        }
        if (savedInstanceState == null) web.loadUrl(origin) else web.restoreState(savedInstanceState)
    }
    inner class PrintBridge {
        @JavascriptInterface
        fun printDocument() {
            runOnUiThread {
                val uri = Uri.parse(web.url ?: "")
                if (uri.scheme != "https" || uri.host != Uri.parse(origin).host) return@runOnUiThread
                val manager = getSystemService(PRINT_SERVICE) as PrintManager
                manager.print("Laporan Purimas", web.createPrintDocumentAdapter("Purimas"), PrintAttributes.Builder().build())
            }
        }
    }
    @Deprecated("Legacy activity result API")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 100) { fileCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data)); fileCallback = null }
    }
    @Deprecated("Legacy back navigation API")
    override fun onBackPressed() { if (web.canGoBack()) web.goBack() else super.onBackPressed() }
    override fun onSaveInstanceState(outState: Bundle) { web.saveState(outState); super.onSaveInstanceState(outState) }
    override fun onDestroy() { fileCallback?.onReceiveValue(null); web.destroy(); super.onDestroy() }
}
