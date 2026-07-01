package com.myaccountant.app.sms

object SmsParser {

    fun parse(message: String, bankName: String, sender: String?, timestamp: Long): SmsData? {
        val cleaned = normalizeDigits(message)

        val type = detectType(cleaned)
        val amount = extractAmount(cleaned)
        val cardSuffix = extractCardSuffix(cleaned)

        if (amount <= 0) return null

        return SmsData(
            bankName = bankName,
            amount = amount,
            type = type,
            cardSuffix = cardSuffix,
            message = message,
            sender = sender,
            timestamp = timestamp
        )
    }

    private fun normalizeDigits(text: String): String {
        return text
            .replace(Regex("[۰-۹]")) { c -> ('0' + (c.value[0] - '۰')).toString() }
            .replace(Regex("[٠-٩]")) { c -> ('0' + (c.value[0] - '٠')).toString() }
            .replace(",", "")
            .trim()
    }

    private fun detectType(text: String): String {
        var income = 0
        var expense = 0

        val incomeKeywords = listOf(
            "واریز", "دریافت", "سپرده", "وام پرداختی", "وام",
            "+", "افزایش", "اضافه شدن", "بستانکار", "شارژ حساب",
            "انتقال به", "کارت به کارت به"
        )
        val expenseKeywords = listOf(
            "برداشت", "خرید", "پرداخت", "انتقال از",
            "سود", "کارمزد", "-", "کاهش", "کسر",
            "قبض", "کارتخوان", "خودپرداز", "پوز",
            "کارت به کارت از", "سایر پرداخت‌ها"
        )

        for (kw in incomeKeywords) {
            if (text.contains(kw)) income += 2
        }
        for (kw in expenseKeywords) {
            if (text.contains(kw)) expense += 2
        }

        return if (income >= expense) "income" else "expense"
    }

    private fun extractAmount(text: String): Long {
        val amountPatterns = listOf(
            Regex("""مبلغ\s*:?\s*([\d]+)"""),
            Regex("""واریز\s*:?\s*([\d]+)"""),
            Regex("""برداشت\s*:?\s*([\d]+)"""),
            Regex("""خرید\s*:?\s*([\d]+)"""),
            Regex("""پرداخت\s*:?\s*([\d]+)"""),
            Regex("""انتقال\s*:?\s*([\d]+)"""),
            Regex("""کسر\s*:?\s*([\d]+)"""),
            Regex("""اضافه\s*:?\s*([\d]+)"""),
            Regex("""مبلغ\s*\(?ریال\)?\s*:?\s*([\d]+)"""),
            Regex("""مبلغ\s*\(?تومان\)?\s*:?\s*([\d]+)"""),
        )

        for (pattern in amountPatterns) {
            val match = pattern.find(text)
            if (match != null) {
                val amount = match.groupValues[1].toLongOrNull() ?: continue
                val isRial = text.contains("ریال") && !text.contains("تومان")
                return if (isRial) amount / 10 else amount
            }
        }

        val allNumbers = Regex("""([\d]+)""").findAll(text)
            .map { it.groupValues[1].toLongOrNull() ?: 0 }
            .filter { it in 1000..999_999_999 }
            .toList()

        return allNumbers.maxOrNull() ?: 0
    }

    private fun extractCardSuffix(text: String): String? {
        val patterns = listOf(
            Regex("""کارت\s*:\s*[\*\*]*\s*(\d{4})"""),
            Regex("""کارت\s+[\*\*]*\s*(\d{4})"""),
            Regex("""\*\s*(\d{4})"""),
            Regex("""حساب\s+(\d{4,})"""),
        )

        for (pattern in patterns) {
            val match = pattern.find(text)
            if (match != null) {
                val suffix = match.groupValues[1]
                if (suffix.length == 4) return suffix
                if (suffix.length >= 4) return suffix.takeLast(4)
            }
        }

        return null
    }
}
