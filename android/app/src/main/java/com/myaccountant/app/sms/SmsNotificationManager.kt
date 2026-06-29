package com.myaccountant.app.sms

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.myaccountant.app.MainActivity
import java.text.DecimalFormat
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object SmsNotificationManager {

    private const val CHANNEL_ID = "bank_sms_channel"
    private const val NOTIFICATION_ID = 1001

    fun show(context: Context, smsData: SmsData, timestamp: Long) {
        createChannel(context)

        val jsonData = smsData.toJson()
        val dateStr = SimpleDateFormat("HH:mm", Locale("fa")).format(Date(smsData.timestamp))
        val suffix = smsData.cardSuffix?.let { " - کارت $it" } ?: ""
        val amountStr = formatAmount(smsData.amount)

        val contentText = "${smsData.bankName}${suffix}\nمبلغ: $amountStr تومان - ${smsData.typeText()}"

        val incomeIntent = createIntent(context, jsonData, "income")
        val expenseIntent = createIntent(context, jsonData, "expense")

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("${smsData.typeIcon()} پیامک بانکی جدید")
            .setContentText(contentText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .addAction(0, "💰 دریافت", incomeIntent)
            .addAction(0, "💸 پرداخت", expenseIntent)
            .build()

        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID + (timestamp % 100).toInt(), notification)
        } catch (e: SecurityException) {
        }
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "پیامک\u200Cهای بانکی",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "اعلان\u200Cهای پیامک دریافتی از بانک\u200Cها"
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createIntent(context: Context, jsonData: String, type: String): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("sms_data", jsonData)
            putExtra("sms_action_type", type)
        }
        val requestCode = (type.hashCode() and 0xffff) + System.currentTimeMillis().toInt() and 0xffff
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
    }

    private fun SmsData.typeText(): String = if (type == "income") "دریافتی" else "پرداختی"
    private fun SmsData.typeIcon(): String = if (type == "income") "⬆️" else "⬇️"

    private fun formatAmount(amount: Long): String {
        val formatter = NumberFormat.getNumberInstance(Locale.US) as DecimalFormat
        return formatter.format(amount)
    }
}
