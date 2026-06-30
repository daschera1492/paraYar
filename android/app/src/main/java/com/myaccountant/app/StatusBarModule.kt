package com.myaccountant.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class StatusBarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val CHANNEL_ID = "status_bar_channel"
        private const val NOTIFICATION_ID = 2001
        private var lastDateText = ""
        private var lastIncome = ""
        private var lastExpense = ""
        private var lastReminders = emptyList<String>()

        fun startService(context: Context) {
            try {
                val intent = Intent(context, StatusBarService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (_: Exception) {}
        }

        fun stopService(context: Context) {
            try {
                val intent = Intent(context, StatusBarService::class.java)
                context.stopService(intent)
            } catch (_: Exception) {}
        }
    }

    override fun getName(): String = "StatusBarModule"

    @ReactMethod
    fun updateStatusBar(dateText: String, dayNum: String, income: String, expense: String, reminders: ReadableArray) {
        lastDateText = dateText
        lastIncome = income
        lastExpense = expense
        lastReminders = mutableListOf<String>().also {
            for (i in 0 until reminders.size()) {
                it.add(reminders.getString(i) ?: "")
            }
        }
        updateNotification(dayNum)
    }

    @ReactMethod
    fun startForegroundService() {
        val context = currentActivity ?: return
        startService(context)
    }

    @ReactMethod
    fun stopForegroundService() {
        val context = currentActivity ?: return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        try { manager.cancel(NOTIFICATION_ID) } catch (_: Exception) {}
        stopService(context)
    }

    private fun toPersianDigits(str: String): String {
        val sb = StringBuilder(str)
        for (i in sb.indices) {
            when (sb[i]) {
                '0' -> sb[i] = '\u06F0'
                '1' -> sb[i] = '\u06F1'
                '2' -> sb[i] = '\u06F2'
                '3' -> sb[i] = '\u06F3'
                '4' -> sb[i] = '\u06F4'
                '5' -> sb[i] = '\u06F5'
                '6' -> sb[i] = '\u06F6'
                '7' -> sb[i] = '\u06F7'
                '8' -> sb[i] = '\u06F8'
                '9' -> sb[i] = '\u06F9'
            }
        }
        return sb.toString()
    }

    private fun rtlLine(text: String): String {
        val rlm = "\u200F"
        val rle = "\u202B"
        val pdf = "\u202C"
        return "$rle${rlm}$text$pdf"
    }

    private fun createDayNumberBitmap(dayNum: String): Bitmap? {
        if (dayNum.isEmpty()) return null
        val size = 120
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#4f46e5")
            style = Paint.Style.FILL
        }
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, bgPaint)
        val textSize = size * 0.5f
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            this.textSize = textSize
            textAlign = Paint.Align.CENTER
            isFakeBoldText = true
        }
        val yPos = size / 2f - (textPaint.descent() + textPaint.ascent()) / 2f
        canvas.drawText(toPersianDigits(dayNum), size / 2f, yPos, textPaint)
        return bitmap
    }

    private fun updateNotification(dayNum: String = "") {
        val context = currentActivity ?: return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createChannel(context)

        val datePersian = toPersianDigits(lastDateText)
        val incomePersian = toPersianDigits(lastIncome)
        val expensePersian = toPersianDigits(lastExpense)

        val contentText = buildString {
            append(rtlLine("\uD83D\uDCC5 $datePersian"))
            append("\n")
            append(rtlLine("\uD83D\uDCC8 دریافتی: $incomePersian تومان"))
            append("\n")
            append(rtlLine("\uD83D\uDCC9 پرداختی: $expensePersian تومان"))
            if (lastReminders.isNotEmpty()) {
                append("\n\n")
                append(rtlLine("\uD83D\uDD14 یادآورها:"))
                for (rem in lastReminders) {
                    val remPersian = toPersianDigits(rem)
                    append("\n")
                    append(rtlLine(remPersian))
                }
            }
        }

        val titleText = rtlLine("\uD83D\uDCCA $datePersian")
        val summaryText = rtlLine("دریافتی: $incomePersian | پرداختی: $expensePersian")

        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenIntent = PendingIntent.getActivity(
            context, 0, openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val largeBitmap = if (dayNum.isNotEmpty()) createDayNumberBitmap(dayNum) else null

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(titleText)
            .setContentText(summaryText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setContentIntent(pendingOpenIntent)
            .setShowWhen(true)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
        if (largeBitmap != null) {
            builder.setLargeIcon(largeBitmap)
        }
        val notification = builder.build()
        try {
            manager.notify(NOTIFICATION_ID, notification)
            StatusBarService.updateNotification(notification)
        } catch (_: Exception) {}
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "وضعیت مالی",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "نمایش تاریخ شمسی و وضعیت مالی امروز"
                setShowBadge(true)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}

class StatusBarService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = currentNotification ?: createDefaultNotification()
        startForeground(2001, notification)
        return START_STICKY
    }

    private fun createDefaultNotification(): Notification {
        val channelId = "status_bar_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(channelId, "وضعیت مالی", NotificationManager.IMPORTANCE_LOW)
            manager.createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("حسابدار من")
            .setContentText("...")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
    }

    companion object {
        private var currentNotification: Notification? = null

        fun updateNotification(notification: Notification) {
            currentNotification = notification
        }
    }
}
