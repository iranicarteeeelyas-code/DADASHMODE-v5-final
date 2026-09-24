# راهنمای نصب و اجرای DADASHMODE v5 در گوشی اندروید

## نسخهٔ اپ

**DADASHMODE v5 Ultimate** — ترکیب کاملٔ فازهای 1-5
- حافظهٔ دائمی (auto-save، backup، undo)
- انیمیشن‌های زنده (سرعت قابل تنظیم، بنرهای دیناميک)
- دستیار کارگردان (لیست و چک‌لیست لوازم، یادیاوری‌های سکانس)
- ضبط صدای Gemini (تقسیم خودکار، mapping خودکار)
- سبک‌های سینماتیک (پنج نمایش، chroma keying، dual output CapCut)
- **کاملاً Offline** — بعد از بارگذاری اول نیاز به اینترنت ندارد

---

## مرحلهٔ 1: دانلود و نصب

### روی کامپیوتر:
1. بسته `DADASHMODE-v5-final.zip` را دانلود کن
2. آن را بسط بده (`Extract All`)
3. بسته را کپی کن

### روی گوشی:
1. **Chrome** یا **Samsung Internet** یا **Firefox** باز کن
2. یک کیابل USB استفاده کن یا بسته را به گوگل‌درایو/Telegram بفرست تا از اونجا دسترسی داشته باشی
3. یا اگر روی سرور یا FTP بود آن آدرس را باز کن

---

## مرحلهٔ 2: اجرا به‌عنوان وب‌اپ

### گزینهٔ الف: محلی (پیشنهادی برای shooting بدون وای‌فای)

```bash
# روی کامپیوتر، در پوشهٔ بسته:
cd DADASHMODE-v5-final

# ایجاد یک وب‌سرور ساده (Python 3):
python -m http.server 8000

# یا (Node):
npx http-server . -p 8000 -c-1
```

سپس اتصالی بین گوشی و کامپیوتر برقرار کن (موبایل هات‌اسپات یا WiFi محلی) و سپس:
1. روی گوشی، مرورگر را باز کن
2. این آدرس را وارد کن: `http://<IP-کامپیوتر>:8000`
   - جای `<IP-کامپیوتر>` IP محلی کامپیوتر را قرار بده (مثلاً `192.168.1.50`)
   - اگر نمی‌دانی IP را چی است، روی کامپیوتر ترمینال بزن و `ipconfig` (Windows) یا `ifconfig` (Mac/Linux) تایپ کن

### گزینهٔ ب: افزودن به صفحهٔ خانگی (PWA Install)

1. روی گوشی، اپ را در مرورگر باز کن
2. به دنبال دکمهٔ «نصب» یا سه‌نقطه → **Add to Home Screen** بگرد
3. نام را تأیید کن
4. اپ حالا مثل یک اپ عادی از Home Screen باز می‌شود

---

## مرحلهٔ 3: اولین استفاده

### ۱. داده‌های پروژه بارگذاری کن
- **Load from File**: پرونده `episodes.json` خود را انتخاب کن
- یا **New Project**: یک پروژهٔ جدید شروع کن

### ۲. صدا و فیلم‌نامه
- **Voice Tab**: Gemini API key خود را وارد کن (یا خالی بگذار اگر از صدای مسابقه به‌عنوان Reference استفاده می‌کنی)
- **Director Tab**: یک قسمت را انتخاب کن و **Auto Shot List** یا **Edit Props** را ببین

### ۳. ضبط و رندر
1. **Director**: روی خود گوشی، دوربین را شروع کن
2. **Cinema**: سبک را انتخاب کن (Cinema / Arena / Broadcast / Noir / Studio3D)
3. **Export**: ویدیو را دو حالت بگیر:
   - **Chroma**: برای CapCut (بک‌گراند سبز/آبی، بدون انیمیشن پس‌زمینه)
   - **Full Screen**: انیمیشن و بنرهای کاملٔ صفحهٔ نمایش

### ۴. پشتیبان و ریکاوری
- **Memory Button** (پایین صفحه): وضعیت حافظه را ببین
- **Create Backup**: دستی backup کن
- **Restore**: از backup قدیمی‌تری بازگشت کن

---

## مشکل‌زدایی

| مشکل | راه‌حل |
|------|--------|
| **صفحه سفید است** | Ctrl+Shift+I (DevTools) را باز کن و **Console** را ببین برای خطاها. F5 یا صفحه را بارگذاری کن. |
| **صدا نمی‌آید** | گوشی Mute نیست؟ برنامه را مسدود کردی؟ صدای خطوط صحیح ذخیره شده؟ |
| **ویدیو export نمی‌شود** | Storage permission را اجازه داده‌ای؟ فضای خالی دارد؟ |
| **Gemini API خطا** | کلید را دوباره چک کن. برنامه یک خط را درک نمی‌تواند؟ دستی ضبط کن. |
| **chroma color غلط انتخاب شد** | **Cinema Settings** → **Override Chroma Color** → رنگ دستی انتخاب کن. |

---

## فایل‌های مهم

- **index.html** — صفحهٔ شروع
- **sw.js** — Service Worker (offline caching)
- **manifest.webmanifest** — تنظیمات PWA
- **js/p345-core.js** — هسته‌ی مشترک (persistence، UI)
- **js/p3-director.js** — Director Assistant
- **js/p4-voicecapture.js** — Voice Capture & Gemini
- **js/p5-cinema.js** — Cinematic Looks & Export
- **js/p5-three.js** — 3D Studio (three.js bundle)

---

## نکات مهم برای Shooting

1. **قبل از رفتن به مسابقه:**
   - پروژه خود را بارگذاری کن
   - یک backup کامل بگیر
   - Gemini API key را آزمایش کن (اگر استفاده می‌کنی)
   - تمام‌صفحه را test کن

2. **در مسابقه:**
   - گوشی را Hot Spot کن اگر نیاز به Gemini داشتی
   - اگر اینترنت قطع شد، نگران نباش—اپ کار می‌کند
   - ویدیو را دو حالت (chroma + full) بگیر
   - بعد از هر سکانس **Memory** دکمه را بزن تا backup شود

3. **بعد از مسابقه:**
   - ویدیوها را به کامپیوتر منتقل کن
   - در CapCut:
     - Chroma version را باز کن
     - بک‌گراند به خود ویدیو مسابقه بزن
     - انیمیشن‌های Full Screen را overlay کن
   - ادیت کن و render کن

---

## اطلاعات فنی

- **مرورگر تحت پوشش:** Chrome 90+، Firefox 88+، Samsung Internet 14+
- **اندازهٔ حافظهٔ Cache:** تا ۵۰ MB (شامل three.js bundle)
- **حداقل فضای Offline:** ۵۰ MB برای نسخهٔ بدون ویدیو cached
- **Supported Exports:** MP4 (H.264), WebM
- **Storage:** IndexedDB (25 versions + daily snapshots)

---

## پشتیبانی

اگر مشکلی پیدا شد:
1. **Memory Button** → وضعیت را screenshot کن
2. **Console خطاها** را کپی کن
3. پیام دهید با screenshot و توضیح

---

**آخرین بروز:** 2026-09-24  
**نسخه:** v5 (Ultimate — All Phases)
