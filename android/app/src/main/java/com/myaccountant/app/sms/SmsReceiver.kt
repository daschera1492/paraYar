package com.myaccountant.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        for (sms in messages) {
            val sender = sms.originatingAddress
            val message = sms.messageBody
            val timestamp = sms.timestampMillis

            if (message.isNullOrBlank()) continue

            val bankName = BankDetector.detect(sender)
            if (bankName == null) continue

            val parsed = SmsParser.parse(message, bankName, sender, timestamp)
            if (parsed == null || parsed.amount <= 0) continue

            try {
                SmsNotificationManager.show(context, parsed, timestamp)
            } catch (e: Exception) {
            }
        }
    }
}
