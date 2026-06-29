package com.myaccountant.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
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
        updateNotification()
    }

    private fun updateNotification() {
        val context = currentActivity ?: return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createChannel(context)

        val rlm = "\u200F"
        val rle = "\u202B"
        val pdf = "\u202C"

        val reminderLines = if (lastReminders.isEmpty()) "یادآوری وجود ندارد" else lastReminders.joinToString("\n")

        val contentText = buildString {
            append(rle)
            append(rlm)
            append("📅 $lastDateText")
            append(pdf)
            append("\n")
            append(rle)
            append(rlm)
            append("📈 دریافتی: $lastIncome تومان")
            append(pdf)
            append("\n")
            append(rle)
            append(rlm)
            append("📉 پرداختی: $lastExpense تومان")
            append(pdf)
            append("\n\n")
            append(rle)
            append(rlm)
            append("🔔 یادآورها:")
            append(pdf)
            append("\n")
            append(rle)
            append(rlm)
            append(reminderLines)
            append(pdf)
        }

        val titleText = "${rle}${rlm}📊 $lastDateText$pdf"
        val summaryText = "${rle}${rlm}دریافتی: $lastIncome | پرداختی: $lastExpense$pdf"

        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenIntent = PendingIntent.getActivity(
            context, 0, openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(titleText)
            .setContentText(summaryText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setContentIntent(pendingOpenIntent)
            .setShowWhen(true)
            .build()

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
            .setContentText("در حال بروزرسانی...")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
    }

    companion object {
        private var currentNotification: Notification? = null

        fun updateNotification(notification: Notification) {
            currentNotification = notification
            // The service will pick up the latest notification on next startCommand
        }
    }
}
