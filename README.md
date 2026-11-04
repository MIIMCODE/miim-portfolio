# رسانه میم — پورتفولیوی سبک

پورتفولیوی فارسی و راست‌به‌چپ **مجتبی میدانی / رسانه میم** با هیروی پرتره‌ی قوسی، لیست ساده‌ی مهارت‌ها،
کاروسل نمونه‌کار، فرم سفارش متصل به تابع `miim-rubika` و پنل مدیریت متصل به Supabase.

## لینک‌ها

| بخش | آدرس |
| --- | --- |
| سایت | `https://miimcode.github.io/miim-portfolio/` |
| پنل مدیریت | `https://miimcode.github.io/miim-portfolio/admin/` |

## ساختار

```
index.html            صفحه‌ی اصلی
style.css             استایل‌ها (توکن‌های CSS در :root)
script.js             رفتار سایت (لودر، پارالاکس هیرو، نوارهای مهارت، کاروسل، لایت‌باکس، فرم)
content.js            لایه‌ی محتوای ابری/آفلاین
store.js              لایه‌ی داده و احراز هویت Supabase
content-guard.js      محافظ کپی و درگ تصاویر عمومی
data.json             داده‌ی seed (فقط پشتیبان آفلاین)
Image/  font/  vendor/  lib/   دارایی‌ها، فونت، Supabase JS و لایه‌ی ابری
admin/                پنل مدیریت
supabase/             توابع لبه (بدون تغییر)
tests/                تست‌های واحد (node --test)
scripts/              نسخه‌گذاری هش دارایی‌ها
```

## کارهای روزمره

```bash
npm ci                 # نصب وابستگی‌ها
npm test               # تست‌های واحد
node scripts/version-assets.cjs   # به‌روزرسانی ?v= هش فایل‌ها بعد از هر تغییر CSS/JS/HTML
```

## استقرار

`.github/workflows/pages.yml` روی هر push به `main` ریشه‌ی ریپو را با `actions/upload-pages-artifact`
آپلود و با `actions/deploy-pages` منتشر می‌کند. منبع Pages باید **GitHub Actions** باشد.
