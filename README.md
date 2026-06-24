# maseAccountant — حسابدار شخصی من

A fully offline Persian personal finance manager mobile app built with **Expo (React Native)**.

یک اپلیکیشن مدیریت مالی شخصی به زبان فارسی، کاملاً آفلاین و بدون نیاز به سرور.

---

## Features / قابلیت‌ها

### English
- **Dashboard**: View total balance, monthly income/expense, daily calendar with per-day transactions
- **Add Transaction**: Manual entry or auto-parse from bank SMS (supports 14 Persian banks)
- **Reports**: Monthly expense breakdown with category pie/bar chart, 6-month comparison chart
- **Budget Management**: Set spending limits per category, get warnings at 80% and 100%
- **Payment Reminders**: Recurring monthly reminders for bills, rent, installments (uses local push notifications)
- **Categories**: Fully customizable expense/income categories with icons and colors
- **Full Backup/Restore**: Export all data as JSON file, import later — 100% offline
- **Persian & RTL**: Vazirmatn font, right-to-left layout, Persian date (Jalali), Persian number formatting
- **SMS Parser**: Paste bank SMS text → auto-fills amount, type, bank name (Mellat, Melli, Saderat, Tejarat, Refah, Saman, Parsian, Eghtesad Novin, Pasargad, Karafarin, Ayandeh, Shahr, Dey, Iran Zamin)

### فارسی
- **داشبورد**: نمایش موجودی کل، درآمد و هزینه ماه، تقویم ۱۴ روزه با تراکنش‌های روزانه
- **ثبت تراکنش**: ورود دستی یا پردازش خودکار پیامک بانکی (۱۴ بانک پشتیبانی می‌شود)
- **گزارش‌ها**: تفکیک هزینه‌های ماهانه با نمودار، مقایسه ۶ ماه اخیر
- **مدیریت بودجه**: تعیین سقف هزینه برای هر دسته، هشدار در ۸۰٪ و ۱۰۰٪
- **یادآور پرداخت**: یادآور ماهانه برای قبوض، اجاره، اقساط (با نوتیفیکیشن)
- **دسته‌بندی**: دسته‌بندی کاملاً قابل شخصی‌سازی با آیکون و رنگ
- **پشتیبان‌گیری**: خروجی JSON و بازگردانی — کاملاً آفلاین
- **فارسی و راست‌چین**: فونت وزیرمتن، راست‌چین، تاریخ شمسی، اعداد فارسی
- **پردازش پیامک**: کافیست متن پیامک بانکی را کپی کنید، مبلغ و نوع تراکنش خودکار تشخیص داده می‌شود

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
| Build | Gradle (local) / EAS Build (cloud) |

---

## Local Build / بیلد محلی

### Prerequisites / پیش‌نیازها
- Node.js 20+
- Java 17+
- Android SDK (with NDK 27.3+ and CMake 3.30+)
- An Android device or emulator

### Steps / مراحل

```bash
# 1. Clone / کلون کردن
git clone https://github.com/masezahedi/maseAccountant.git
cd maseAccountant

# 2. Install dependencies / نصب وابستگی‌ها
npm install

# 3. Generate Android project / تولید پروژه اندروید
npx expo prebuild --platform android --clean

# 4. Build APK / ساخت APK
cd android
set CMAKE_VERSION=3.30.5      # Windows
# export CMAKE_VERSION=3.30.5  # Linux/macOS
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

> **Note:** On Windows CI environments with read-only SDK, set `local.properties`:
> ```
> sdk.dir=C\:\\Android\\android-sdk
> cmake.dir=C\:\\Android\\android-sdk\\cmake\\3.30.5
> ```

---

## GitHub Actions — Auto Build / بیلد خودکار

Every push to `master` automatically builds separate APKs for each CPU architecture:

- `app-arm64-v8a-release.apk` (~25 MB) — **recommended for modern phones**
- `app-armeabi-v7a-release.apk` (~18 MB) — older phones
- `app-x86_64-release.apk` (~24 MB) — emulators
- `app-x86-release.apk` (~24 MB) — emulators
- `app-universal-release.apk` (~81 MB) — all architectures in one

Workflow file: `.github/workflows/build.yml`

To manually trigger: **Actions** → **Build Android APK** → **Run workflow**

---

## Download APK / دانلود APK

Go to [Releases](https://github.com/masezahedi/maseAccountant/releases) page and download the latest APK for your device architecture.

---

## License / مجوز

MIT
