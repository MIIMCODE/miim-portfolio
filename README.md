# رسانه میم — پورتفولیوی مجتبی میدانی

پورتفولیوی فارسی و راستبه‌چپ برای **مجتبی میدانی (رسانه میم)**؛ طراح گرافیک، طراح وب، عکاس و تدوین‌گر.
طراحی تیره با لهجه‌ی طلایی، کارت‌های شیشه‌ای، پس‌زمینه‌ی زنده و کاروسل سه‌بعدی، همراه با **پنل مدیریت واقعی** روی Supabase.

## لینک‌ها

- سایت: `https://miimcode.github.io/miim-portfolio/`
- پنل مدیریت: `https://miimcode.github.io/miim-portfolio/admin/`
- ورود: `https://miimcode.github.io/miim-portfolio/admin/login.html`
- ریپو: `https://github.com/MIIMCODE/miim-portfolio`

## امکانات

- لودر با درصد پیشرفت و لوگوی حلقه‌ی مداری
- ناوبری شناور با pill متحرک و scroll-spy
- هیرو با پرتره، halo/ring، آیکون نرم‌افزارها، آمار شمارنده‌ای و پارالاکس
- کارت معرفی، تجربه‌ها و مهارت‌ها با نوار درصد
- کاروسل سه‌بعدی با درگ/لمس/کلید جهت، شمارنده، ریل پیشرفت و لایت‌باکس
- بخش CTA با حلقه‌های مداری و دکمه‌ی مغناطیسی
- تماس با سه کارت و نمایش «به‌زودی» برای فیلدهای خالی
- ظهور تدریجی، `prefers-reduced-motion`، ریسپانسیو و دسترس‌پذیری
- پنل مدیریت با ورود Supabase Auth، KPI، آپلود چندتایی، ویرایش، ترتیب، حذف و ذخیره/انتشار
- تغییرات زنده با Supabase Realtime؛ در صورت قطع اتصال، سایت از `data.json` بالا می‌آید

## ساختار

```
index.html          صفحه‌ی اصلی
style.css           استایل سایت
script.js           رفتار سایت (کاروسل، لایت‌باکس، ...)
store.js            لایه‌ی داده و احراز هویت Supabase
config.js           آدرس پروژه و کلید publishable
data.json           داده‌ی seed (fallback)
assets/             تصاویر placeholder (SVG)
font/               فونت Vazirmatn (woff2)
vendor/             Supabase JS (UMD)
admin/              پنل مدیریت و صفحه‌ی ورود
  index.html
  login.html
  admin.css
  admin.js
  login.js
```

## بک‌اند Supabase

- **Auth:** ورود با ایمیل/رمز. ثبت‌نام غیرفعال است.
- **جدول‌ها:** `works`، `skills`، `site_content`، `contact` (با `sort_order` و `updated_at`).
- **RLS:** خواندن عمومی برای همه؛ نوشتن/ویرایش/حذف فقط برای ایمیل مدیر.
- **Storage:** باکت عمومی `media` با محدودیت ۸ مگابایت و انواع PNG/JPEG/WEBP/GIF؛ آپلود/حذف فقط برای مدیر.
- **کلیدها:** فقط کلید publishable در `config.js` قرار دارد. کلید service_role در هیچ فایلی نیست.

### تغییر رمز مدیر

رمز مدیر در ریپو ذخیره نمی‌شود. برای تغییر آن در داشبورد Supabase:

1. به **Authentication → Users** بروید و کاربر `resane.Miim@gmail.com` را انتخاب کنید.
2. **Reset password** را بزنید یا رمز جدید را از طریق کنسول تنظیم کنید.

## اجرا به‌صورت محلی

```bash
python3 -m http.server 8080
```

سپس `http://localhost:8080/` و `http://localhost:8080/admin/` را باز کنید.
برای شبیه‌سازی زیرمسیر GitHub Pages، پوشه را در یک زیرپوشه سرو کنید؛ مسیرها نسبی هستند.

## استقرار روی GitHub Pages

1. کد را روی `main` پوش کنید.
2. در **Settings → Pages**، منبع را **GitHub Actions** یا **Deploy from a branch** ( شاخهی `main`، پوشهی `/`) بگذارید.
3. فایل `.nojekyll` در ریشه قرار دارد تا Jekyll فایل‌ها را نادیده نگیرد.

## نکته‌ی فونت

فونت اصلی **Vazirmatn** است (در پوشهی `font/`). اگر فایل‌های `Rokh-*.woff2` را در همان پوشه قرار دهید، کافی است بخش `@font-face` مربوط به Rokh را در `style.css` فعال کنید تا جایگزین شود.

## داده‌ی اولیه

- نام: مجتبی میدانی
- نقش: طراح گرافیک و وب دیزاینر
- برند: رسانه میم
- تلفن: ۰۹۳۹۹۸۸۷۹۵۰
- ایمیل: `resane.Miim@gmail.com`
- اینستاگرام/تلگرام: `Resane_miim`
- دسته‌های آثار: طراحی وب، گرافیک، عکاسی، تدوین
- عکس‌ها و پرتره فعلاً placeholder هستند و از پنل قابل جایگزینی‌اند.
