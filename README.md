# maseAccountant — حسابدار شخصی من

A fully offline Persian personal finance manager mobile app built with **Expo (React Native)**.

یک اپلیکیشن مدیریت مالی شخصی به زبان فارسی، کاملاً آفلاین و بدون نیاز به سرور.

---

## Features / قابلیت‌ها

### English
- **Dashboard**: View total balance, monthly income/expense, multi-account strip, savings goals preview, daily calendar with per-day transactions, budget detail modal
- **Multiple Accounts**: Manage bank accounts, cash, cards, e-wallets with per-account balance tracking
- **Add Transaction**: Manual entry with account selector, auto-parse from bank SMS (supports 14 Persian banks), recurring transaction support
- **Reports**: Period filter (1/3/6 months), account filter, bar/line chart toggle, income breakdown, net savings
- **Budget Management**: Set spending limits per category, get warnings at 80% and 100%
- **Savings Goals**: Create goals with target amount, track progress, contribute from balance
- **Debt Tracking**: Record debts with due dates, track payments, mark as paid
- **Recurring Transactions**: Daily/weekly/monthly/yearly with custom intervals
- **Payment Reminders**: Recurring monthly reminders for bills, rent, installments (uses local push notifications)
- **PIN & Biometric Lock**: 4-digit PIN with biometric fallback (fingerprint/face)
- **Android Widget**: Home screen widget showing balance, income, expense
- **Categories**: Fully customizable expense/income categories with icons and colors
- **Full Backup/Restore**: Export all data as JSON file, share to Google Drive — 100% offline
- **Persian & RTL**: Vazirmatn font, right-to-left layout, Persian date (Jalali), Persian number formatting
- **App Icon**: Custom indigo gradient icon with geometric overlays

### فارسی
- **داشبورد**: نمایش موجودی کل، درآمد و هزینه ماه، نوار حساب‌ها، پیش‌نمایش اهداف، تقویم با تراکنش‌های روزانه
- **حساب‌های متعدد**: مدیریت حساب بانکی، کیف پول، کارت، کیف پول الکترونیک با مانده هر حساب
- **ثبت تراکنش**: ورود دستی با انتخاب حساب، پردازش خودکار پیامک بانکی (۱۴ بانک)، تراکنش دوره‌ای
- **گزارش‌ها**: فیلتر بازه زمانی و حساب، نمودار خطی/میله‌ای، تفکیک درآمد
- **مدیریت بودجه**: تعیین سقف هزینه برای هر دسته، هشدار در ۸۰٪ و ۱۰۰٪
- **اهداف پس‌انداز**: تعیین هدف، پیگیری پیشرفت، واریز از موجودی
- **مدیریت بدهی**: ثبت بدهی با سررسید، پیگیری پرداخت، علامت پرداخت شده
- **تراکنش دوره‌ای**: روزانه/هفتگی/ماهیانه/سالیانه با فاصله دلخواه
- **یادآور پرداخت**: یادآور برای قبوض، اجاره، اقساط (با نوتیفیکیشن)
- **قفل PIN و اثر انگشت**: رمز ۴ رقمی با پشتیبانی از اثر انگشت و تشخیص چهره
- **ویجت اندروید**: ویجت صفحه اصلی با نمایش موجودی، درآمد و هزینه
- **دسته‌بندی**: دسته‌بندی کاملاً قابل شخصی‌سازی با آیکون و رنگ
- **پشتیبان‌گیری**: خروجی JSON، اشتراک با Google Drive — کاملاً آفلاین
- **فارسی و راست‌چین**: فونت وزیرمتن، راست‌چین، تاریخ شمسی، اعداد فارسی
- **آیکون اختصاصی**: آیکون گرادینت نیلی با طراحی هندسی

---

## Screenshots / تصاویر

| Home / صفحه اصلی | Add / ثبت تراکنش | Reports / گزارش‌ها |
|---|---|---|
| ![home](docs/screenshots/home.png) | ![add](docs/screenshots/add.png) | ![reports](docs/screenshots/reports.png) |

*(Screenshots coming soon — تصاویر به زودی اضافه می‌شوند)*

---

## Tech Stack / فناوری‌ها

| Component | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) 52 + [React Native](https://reactnative.dev) 0.76 |
| Language | TypeScript |
| Font | [Vazirmatn](https://github.com/rastikerdar/vazirmatn) (via `@expo-google-fonts/vazirmatn`) |
| Charts | react-native-chart-kit + react-native-svg |
| Storage | AsyncStorage (offline, on-device) |
| Notifications | expo-notifications |
| Biometric | expo-local-authentication |
| Build | Gradle (local) / EAS Build (cloud) |
| Lock Screen | expo-local-authentication + custom PIN pad |
| Widget | Kotlin + RemoteViews + React Native bridge |

---

## Build & Release

### ⚠️ Note: GitHub Actions is disabled for this repository
GitHub Actions is currently disabled for this repo. Releases are built locally and uploaded manually.

**مهم:** قابلیت GitHub Actions برای این مخزن غیرفعال است. خروجی‌ها به صورت محلی ساخته و به صورت دستی در بخش ریلیزها قرار می‌گیرند.

---

### راهنمای کامل بیلد از صفر (روی ویندوز خام)

> **نکته مهم:** هربار روی یه ویندوز خام بیلد می‌گیری، این مراحل رو **قدم به قدم** اجرا کن.

#### مرحله ۰: پیش‌نیازها (نسخه‌های دقیق)

| نرم‌افزار | نسخه مورد نیاز | نحوه بررسی |
|---|---|---|
| **Node.js** | 20+ | `node --version` |
| **Java (JDK)** | 17+ | `java -version` |
| **Android SDK** | API 35+ | در `C:\Android\android-sdk` |
| **Android NDK** | **27.3.13750724** (دقیقاً این نسخه) | `ls C:\Android\android-sdk\ndk\` |
| **CMake** | **3.22.1** (دقیقاً این نسخه) | باید نصب بشه (مرحله ۳) |
| **Gradle** | همراه پروژه | نیاز به نصب جدا نداره |

#### مرحله ۱: نصب SDK و NDK

اگه Android SDK نداری، نصبش کن و بعد NDK رو اضافه کن:

```powershell
# نصب NDK (اگه نداری)
& "C:\Android\android-sdk\cmdline-tools\latest\bin\sdkmanager.bat" "ndk;27.3.13750724"
```

```powershell
# بررسی نسخه NDK
ls "C:\Android\android-sdk\ndk\"
# باید پوشه 27.3.13750724 ببینی
```

> **مشکل رایج:** اگه NDK نسخه دیگه‌ای داری (مثلاً 26.x)، حتماً `ndkVersion` رو توی `android/build.gradle` عوض کن:
> ```groovy
> ndkVersion = "27.3.13750724"  // باید دقیقاً با پوشه NDK هماهنگ باشه
> ```

#### مرحله ۲: حل مشکل SDK فقط-خواندنی (Read-Only)

اگه `C:\Android\android-sdk` فقط خواندنیه (مثلاً توی Program Files)، CMake نمی‌تونه اونجا بنویسه. باید CMake رو توی یه پوشه writable نصب کنی:

```powershell
# ۱. پوشه موقت بساز
$env:CMAKE_TEMP = "$env:TEMP\android_sdk_temp"

# ۲. CMake 3.22.1 رو نصب کن
& "C:\Android\android-sdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="$env:CMAKE_TEMP" "cmake;3.22.1"

# ۳. بررسی کن نصب شده
ls "$env:CMAKE_TEMP\cmake\3.22.1"
# باید پوشه bin ببینی
```

#### مرحله ۳: دانلود فونت وزیرمتن

```powershell
cd maseAccountant
node scripts/download-font.js
# باید فایل src/assets/fonts/Vazirmatn-Variable.ttf ساخته بشه
```

#### مرحله ۴: نصب وابستگی‌ها

```powershell
cd maseAccountant
npm ci
```

#### مرحله ۵: تولید پروژه اندروید

```powershell
npx expo prebuild --platform android --clean
```

> **⚠️ هشدار:** این دستور فایل `android/app/build.gradle` رو بازنویسی می‌کنه. بعدش حتماً باید مرحله ۶ رو انجام بدی.

#### مرحله ۶: تنظیم فایل‌ها (بعد از هر prebuild)

**الف) `android/local.properties`:**

```properties
sdk.dir=C:/Android/android-sdk
ndk.dir=C:/Android/android-sdk/ndk/27.3.13750724
cmake.dir=C:/Users/<YOUR_USER>/AppData/Local/Temp/1/opencode/android_sdk_temp/cmake/3.22.1
```

> مسیر `cmake.dir` رو با مسیر واقعی مرحله ۲ عوض کن.

**ب) `android/build.gradle`:**

```groovy
ndkVersion = "27.3.13750724"  // باید دقیقاً با نسخه NDK نصب شده هماهنگ باشه
```

**ج) `android/app/build.gradle` — اضافه کردن splits:**

بعد از بلوک `buildTypes { ... }` و قبل از `packagingOptions { ... }` این رو اضافه کن:

```groovy
splits {
    abi {
        enable true
        reset()
        include 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
        universalApk true
    }
}
```

#### مرحله ۷: پاکسازی پروسه‌های قبلی

**این مرحله رو حتماً قبل از هر بیلد انجام بده:**

```powershell
# کشتن تمام پروسه‌های Java/Gradle باقی‌مانده
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
```

> **دلیل:** اگه بیلد قبلی قطع شده باشه، پروسه‌های Java زامبی موندن و بیلد جدید رو بلاک می‌کنن.

#### مرحله ۸: ساخت اسکریپت بیلد detached

**⚠️ نکته حیاتی:** بیلد اندروید **نباید** مستقیم از ترمینال اجرا بشه. اگه از ترمینال عادی اجرا کنی، هربار که ترمینال بسته بشه یا تایم‌اوت بخوره، **تمام پروسه‌های فرزند (Java, Metro, CMake) کشته می‌شن** و وسط بیلد قطع می‌شه.

**راه‌حل:** یه فایل batch بساز و کاملاً detached اجراش کن:

```powershell
# ۱. فایل batch بساز
@"
@echo off
cd /d C:\path\to\maseAccountant\android
set CMAKE_VERSION=3.22.1
set CI=true
echo [%date% %time%] Build started > build.log
call gradlew.bat assembleRelease >> build.log 2>&1
echo [%date% %time%] BUILD_EXIT_CODE: %ERRORLEVEL% >> build.log
"@ | Out-File -FilePath "C:\path\to\maseAccountant\android\build.bat" -Encoding ASCII

# ۲. اجرا کاملاً detached (پنجره مخفی، مستقل از ترمینال)
Start-Process "cmd.exe" -ArgumentList '/c C:\path\to\maseAccountant\android\build.bat' -WindowStyle Hidden

Write-Output "Build started detached. Monitor with: Get-Content android/build.log -Tail 10"
```

#### مرحله ۹: مانیتور کردن پیشرفت بیلد

```powershell
# هر ۱-۲ دقیقه اجرا کن تا ببینی کجایی
Get-Content "android/build.log" -Tail 15

# بررسی پروسه‌های فعال
Get-Process -Name "java" -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, WorkingSet64

# بررسی آخرین task های Gradle
$lines = Get-Content "android/build.log"
$lines | Where-Object { $_ -match '^> Task' } | Select-Object -Last 5
```

**مراحل بیلد و زمان تقریبی:**

| مرحله | Log علامت | زمان |
|---|---|---|
| Gradle Config | `Task :app:checkReleaseAarMetadata` | ~1 min |
| CMake Configure (4 معماری) | `configureCMakeRelWithDebInfo[arm64-v8a]` | ~2 min |
| **CMake Build (4 معماری)** | `buildCMakeRelWithDebInfo[arm64-v8a]` | **~15-20 min** |
| Metro Bundler (JS Bundle) | `createBundleReleaseJsAndAssets` | ~3-5 min |
| DEX + APK | `dexBuilderRelease`, `assembleRelease` | ~2 min |
| **کل** | | **~25-30 min** |

#### مرحله ۱۰: بررسی خروجی

```powershell
# APK ها اینجا هستن
Get-ChildItem "android/app/build/outputs/apk/release/*.apk"
```

---

### فایل‌های خروجی

| فایل | سایز | توضیح |
|---|---|---|
| `app-arm64-v8a-release.apk` | ~33 MB | **توصیه شده برای گوشی‌های 2020+** |
| `app-armeabi-v7a-release.apk` | ~28 MB | گوشی‌های قدیمی (قبل از 2020) |
| `app-x86_64-release.apk` | ~34 MB | امولاتورهای 64 بیت |
| `app-x86-release.apk` | ~34 MB | امولاتورهای 32 بیت |
| `app-universal-release.apk` | ~82 MB | همه معماری‌ها در یک فایل |
| `app-release.aab` | ~54 MB | برای انتشار در گوگل پلی |

---

### چک‌لیست عیب‌یابی (اگه بیلد خطا داد)

به ترتیب چک کن:

1. **پروسه‌های زامبی** — `Get-Process -Name "java" | Stop-Process -Force` → `gradlew clean` → دوباره بیلد
2. **نسخه NDK** — `android/build.gradle` → `ndkVersion` باید دقیقاً `27.3.13750724` باشه
3. **مسیر CMake** — `local.properties` → `cmake.dir` باید به `cmake/3.22.1` اشاره کنه
4. **متغیر محیطی** — `$env:CMAKE_VERSION = "3.22.1"` باید ست باشه
5. **فونت** — فایل `src/assets/fonts/Vazirmatn-Variable.ttf` باید وجود داشته باشه
6. **لاگ بیلد** — `android/build.log` رو چک کن
7. **لاگ C++** — `android/app/build/intermediates/cxx/*/logs/` رو چک کن

### ساخت ریلیز GitHub

```powershell
# ۱. ورژن رو آپدیت کن (app.json و package.json)

# ۲. Commit و Tag
git add -A
git commit -m "release: v1.x.x"
git tag -a v1.x.x -m "v1.x.x"

# ۳. Push
git push origin master --tags

# ۴. ریلیز بساز با APK ها
gh release create v1.x.x `
  --title "v1.x.x - عنوان" `
  --notes "توضیحات" `
  "android/app/build/outputs/apk/release/app-arm64-v8a-release.apk#app-arm64-v8a-release.apk" `
  "android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk#app-armeabi-v7a-release.apk" `
  "android/app/build/outputs/apk/release/app-universal-release.apk#app-universal-release.apk"
```

---

## Download APK / دانلود APK

Go to [Releases](https://github.com/boyitnew/maseAccountant/releases) page and download the latest APK.

---

## License / مجوز

MIT
