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

### Prerequisites / پیش‌نیازها
- Node.js 20+
- Java 17+
- Android SDK (with NDK 27.3+ and CMake 3.22.1+)
- An Android device or emulator

### Known Build Issues / مشکلات شناخته شده بیلد

#### 1. NDK Version Mismatch / عدم تطابق نسخه NDK

**Problem:** Expo 52 + React Native 0.76.7 may request NDK 26.1.10909125, but your system may have a different version.

**Solution:** In `android/build.gradle`, change `ndkVersion` to match your installed NDK:

```groovy
// Before (default from Expo)
ndkVersion = "26.1.10909125"

// After (change to your installed version)
ndkVersion = "27.3.13750724"
```

To find your installed NDK version:
```bash
ls C:/Android/android-sdk/ndk/
```

#### 2. Read-Only SDK Directory / دایرکتوری SDK قابل نوشتن نیست

**Problem:** If the Android SDK is installed in a read-only location (e.g. `C:\Android\android-sdk`), CMake cannot be installed there automatically, causing errors like:
```
The SDK directory is not writable: C:\Android\android-sdk
```

**Solution:** Install CMake in a writable temporary directory and point `cmake.dir` to it:

```bash
# Install CMake 3.22.1 in a temp directory
sdkmanager --sdk_root=C:\path\to\writable\temp\android_sdk_temp "cmake;3.22.1"
```

Then set in `android/local.properties`:
```properties
sdk.dir=C:/Android/android-sdk
cmake.dir=C:/path/to/writable/temp/android_sdk_temp/cmake/3.22.1
ndk.dir=C:/Android/android-sdk/ndk/27.3.13750724
```

Also set the environment variable:
```powershell
$env:CMAKE_VERSION = "3.22.1"
```

> **Why CMake 3.22.1?** The `react-native-screens` module specifically requires this version. Newer versions like 3.31.5 may not be compatible.

#### 3. Build Hangs or Gets Interrupted / بیلد قطع شدن

**Problem:** The C++ (native) compilation phase can take 20-30 minutes on the first build. If the build process gets interrupted (timeout, terminal close, etc.), zombie Java processes may remain and block future builds.

**Symptoms:**
- `build_stacktrace_targets.txt` shows `java.lang.InterruptedException`
- Java processes remain running with no progress
- The build log stops updating for long periods

**Solution:**
```bash
# Kill stale Java processes
Get-Process -Name "java" | Stop-Process -Force

# Clean the build
cd android
./gradlew clean

# Re-run the build (first build takes ~25 min)
./gradlew assembleRelease
```

> **⚠️ Important:** `npx expo prebuild --clean` overwrites `android/app/build.gradle` and removes custom configurations. You **must** add the `splits` block (step 4) after every prebuild.

### Build APK / ساخت APK

```bash
# 1. Clone / کلون کردن
git clone https://github.com/boyitnew/maseAccountant.git
cd maseAccountant

# 2. Install dependencies / نصب وابستگی‌ها
npm ci

# 3. Generate Android project / تولید پروژه اندروید
npx expo prebuild --platform android --clean

# 4. Add ABI splits to android/app/build.gradle
#    Insert this block after buildTypes { ... } and before packagingOptions { ... }:
#
#    splits {
#        abi {
#            enable true
#            reset()
#            include 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
#            universalApk true
#        }
#    }

# 5. Update NDK version in android/build.gradle if needed
#    (change ndkVersion to match your installed NDK)

# 6. Set up local.properties if SDK is read-only
#    (see section 2 above)

# 7. Build APK / ساخت APK
cd android
$env:CMAKE_VERSION = "3.22.1"   # Windows PowerShell
./gradlew assembleRelease

# 8. (Optional) Build AAB for Google Play / ساخت AAB برای گوگل پلی
./gradlew bundleRelease

# Outputs:
# APKs: android/app/build/outputs/apk/release/
# AAB:  android/app/build/outputs/bundle/release/
```

### Troubleshooting Checklist / چک‌لیست رفع خطا

If the build fails, check in order:

1. **NDK version** — `android/build.gradle` → `ndkVersion` must match installed NDK
2. **CMake version** — `local.properties` → `cmake.dir` must point to CMake 3.22.1
3. **Environment variable** — `$env:CMAKE_VERSION` must match the cmake.dir version
4. **Stale processes** — Kill any leftover Java/Gradle processes before retrying
5. **Clean build** — Run `./gradlew clean` before retrying
6. **Build log** — Check `android/build.log` and `android/app/build/intermediates/cxx/*/logs/` for errors

### Output Files / فایل‌های خروجی

| File | Size | Description |
|---|---|---|
| `app-arm64-v8a-release.apk` | ~33 MB | **Recommended for modern phones** (2020+) |
| `app-armeabi-v7a-release.apk` | ~28 MB | Older phones (pre-2020) |
| `app-x86_64-release.apk` | ~34 MB | 64-bit emulators |
| `app-x86-release.apk` | ~34 MB | 32-bit emulators |
| `app-universal-release.apk` | ~82 MB | All architectures in one |
| `app-release.aab` | ~54 MB | Google Play submission |

---

## Download APK / دانلود APK

Go to [Releases](https://github.com/boyitnew/maseAccountant/releases) page and download the latest APK.

---

## License / مجوز

MIT
