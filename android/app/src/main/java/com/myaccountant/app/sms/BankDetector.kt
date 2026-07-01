package com.myaccountant.app.sms

object BankDetector {

    private data class BankInfo(val nameFa: String, val nameEn: String)

    private val shortcodeMap = mapOf(
        "200033" to BankInfo("بانک ملت", "Mellat"),
        "200030" to BankInfo("بانک ملت", "Mellat"),
        "300017" to BankInfo("بانک ملی", "Melli"),
        "3000941001" to BankInfo("بانک ملی", "Melli"),
        "9830009417" to BankInfo("بانک ملی", "Melli"),
        "200060" to BankInfo("بانک صادرات", "Saderat"),
        "200070" to BankInfo("بانک تجارت", "Tejarat"),
        "20007010" to BankInfo("بانک تجارت", "Tejarat"),
        "20000" to BankInfo("بانک سامان", "Saman"),
        "1000900" to BankInfo("بانک پاسارگاد", "Pasargad"),
        "50009000" to BankInfo("بانک پاسارگاد", "Pasargad"),
        "200020" to BankInfo("بانک سپه", "Sepah"),
        "200021" to BankInfo("بانک سپه", "Sepah"),
        "200022" to BankInfo("بانک سپه", "Sepah"),
        "300055" to BankInfo("بانک پارسیان", "Parsian"),
        "50001099" to BankInfo("بانک پارسیان", "Parsian"),
        "300054" to BankInfo("بانک پارسیان", "Parsian"),
        "30007" to BankInfo("بانک پارسیان", "Parsian"),
        "300066" to BankInfo("بانک رفاه", "Refah"),
        "300044" to BankInfo("بانک رفاه", "Refah"),
        "300014" to BankInfo("بانک مسکن", "Maskan"),
        "2000911" to BankInfo("بانک کشاورزی", "Keshavarzi"),
        "200050" to BankInfo("اقتصاد نوین", "EghtesadNovin"),
        "200038" to BankInfo("بانک سینا", "Sina"),
        "100088" to BankInfo("بانک سرمایه", "Sarmaye"),
        "1000222" to BankInfo("بانک قوامین", "Ghavvamin"),
        "1000700" to BankInfo("توسعه تعاون", "ToseeTaavon"),
        "100070007" to BankInfo("توسعه تعاون", "ToseeTaavon"),
        "10003610" to BankInfo("بانک خاورمیانه", "MiddleEast"),
        "10004405" to BankInfo("بانک گردشگری", "Tourism"),
        "10004609" to BankInfo("بانک ایران زمین", "IranZamin"),
        "10003996" to BankInfo("بانک دی", "Day"),
        "10003565" to BankInfo("بانک کارآفرین", "Karafarin"),
        "10007622" to BankInfo("بانک شهر", "Shahr"),
        "10001222" to BankInfo("بانک حکمت ایرانیان", "Hekmat"),
        "10004055" to BankInfo("بانک توسعه صادرات", "ToseeSaderat"),
        "10003837" to BankInfo("موسسه اعتباری ملل", "Melal"),
        "10003833" to BankInfo("موسسه اعتباری نور", "Noor"),
        "10004200" to BankInfo("موسسه اعتباری کوثر", "Kosar"),
        "10004455" to BankInfo("پست بانک", "PostBank"),
    )

    private val alphaNameMap = mapOf(
        "mellat" to BankInfo("بانک ملت", "Mellat"),
        "mellat bank" to BankInfo("بانک ملت", "Mellat"),
        "bank mellat" to BankInfo("بانک ملت", "Mellat"),
        "b.mellat" to BankInfo("بانک ملت", "Mellat"),
        "b.qmehriran" to BankInfo("مهر ایران", "MehrIran"),
        "b.mehriran" to BankInfo("مهر ایران", "MehrIran"),
        "b.melli" to BankInfo("بانک ملی", "Melli"),
        "melli" to BankInfo("بانک ملی", "Melli"),
        "melli bank" to BankInfo("بانک ملی", "Melli"),
        "bank melli" to BankInfo("بانک ملی", "Melli"),
        "saderat" to BankInfo("بانک صادرات", "Saderat"),
        "saderat bank" to BankInfo("بانک صادرات", "Saderat"),
        "tejarat" to BankInfo("بانک تجارت", "Tejarat"),
        "tejarat bank" to BankInfo("بانک تجارت", "Tejarat"),
        "saman" to BankInfo("بانک سامان", "Saman"),
        "saman bank" to BankInfo("بانک سامان", "Saman"),
        "pasargad" to BankInfo("بانک پاسارگاد", "Pasargad"),
        "pasargad bank" to BankInfo("بانک پاسارگاد", "Pasargad"),
        "sepah" to BankInfo("بانک سپه", "Sepah"),
        "sepah bank" to BankInfo("بانک سپه", "Sepah"),
        "blubank" to BankInfo("بلوبانک", "Blubank"),
        "blu" to BankInfo("بلوبانک", "Blubank"),
        "blue" to BankInfo("بلوبانک", "Blubank"),
        "parsian" to BankInfo("بانک پارسیان", "Parsian"),
        "parsian bank" to BankInfo("بانک پارسیان", "Parsian"),
        "refah" to BankInfo("بانک رفاه", "Refah"),
        "refah bank" to BankInfo("بانک رفاه", "Refah"),
        "b.refah" to BankInfo("بانک رفاه", "Refah"),
        "maskan" to BankInfo("بانک مسکن", "Maskan"),
        "maskan bank" to BankInfo("بانک مسکن", "Maskan"),
        "ayandeh" to BankInfo("بانک آینده", "Ayandeh"),
        "ayande" to BankInfo("بانک آینده", "Ayandeh"),
        "en bank" to BankInfo("اقتصاد نوین", "EghtesadNovin"),
        "day" to BankInfo("بانک دی", "Day"),
        "day bank" to BankInfo("بانک دی", "Day"),
        "resalat" to BankInfo("رسالت", "Resalat"),
        "mehr" to BankInfo("مهر ایران", "MehrIran"),
        "mehr iran" to BankInfo("مهر ایران", "MehrIran"),
        "karafarin" to BankInfo("کارآفرین", "Karafarin"),
        "shahr" to BankInfo("بانک شهر", "Shahr"),
        "middle east" to BankInfo("بانک خاورمیانه", "MiddleEast"),
        "middleeast" to BankInfo("بانک خاورمیانه", "MiddleEast"),
        "tourism" to BankInfo("بانک گردشگری", "Tourism"),
        "iran zamin" to BankInfo("بانک ایران زمین", "IranZamin"),
        "iranzamin" to BankInfo("بانک ایران زمین", "IranZamin"),
        "hekmat" to BankInfo("بانک حکمت ایرانیان", "Hekmat"),
        "tosee saderat" to BankInfo("بانک توسعه صادرات", "ToseeSaderat"),
        "post bank" to BankInfo("پست بانک", "PostBank"),
        "postbank" to BankInfo("پست بانک", "PostBank"),
        "melal" to BankInfo("موسسه اعتباری ملل", "Melal"),
        "kosar" to BankInfo("موسسه اعتباری کوثر", "Kosar"),
    )

    fun detect(sender: String?): String? {
        if (sender == null) return null

        val cleanSender = sender.trim().lowercase()
            .removePrefix("+98")
            .removePrefix("0098")
            .removePrefix("98")
            .removePrefix("0")

        val byShortcode = shortcodeMap[cleanSender]
        if (byShortcode != null) return byShortcode.nameFa

        val byAlpha = alphaNameMap[cleanSender]
        if (byAlpha != null) return byAlpha.nameFa

        for ((key, bank) in alphaNameMap) {
            if (cleanSender.contains(key)) return bank.nameFa
        }

        return null
    }

    fun detectEn(sender: String?): String? {
        if (sender == null) return null

        val cleanSender = sender.trim().lowercase()
            .removePrefix("+98")
            .removePrefix("0098")
            .removePrefix("98")
            .removePrefix("0")

        val byShortcode = shortcodeMap[cleanSender]
        if (byShortcode != null) return byShortcode.nameEn

        val byAlpha = alphaNameMap[cleanSender]
        if (byAlpha != null) return byAlpha.nameEn

        for ((key, bank) in alphaNameMap) {
            if (cleanSender.contains(key)) return bank.nameEn
        }

        return null
    }
}
