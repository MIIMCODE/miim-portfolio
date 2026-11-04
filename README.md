# رسانه میم — پورتفولیوی مجتبی میدانی

پورتفولیوی فارسی و راست‌به‌چپ برای **مجتبی میدانی (رسانه میم)**؛ طراح گرافیک، طراح وب، عکاس و تدوین‌گر.
طراحی تیره با لهجه‌ی طلایی، کارت‌های شیشه‌ای، پس‌زمینه‌ی زنده و کاروسل سه‌بعدی، همراه با **پنل مدیریت واقعی** روی Supabase.

## لینک‌ها

| بخش | آدرس |
| --- | --- |
| سایت | `https://miimcode.github.io/miim-portfolio/` |
| پنل «اتاق فرمان» | `https://miimcode.github.io/miim-portfolio/admin/` |
| صفحه‌ی ورود | `https://miimcode.github.io/miim-portfolio/admin/login.html` |
| ریپو | `https://github.com/MIIMCODE/miim-portfolio` |

> همه‌ی مسیرها **نسبی** هستند تا روی زیرمسیر GitHub Pages (مثل `/miim-portfolio/`) هم درست کار کنند.

## امکانات سایت

- لودر با درصد پیشرفت و لوگوی حلقه‌ی مداری
- ناوبری شناور گرد با pill متحرک و scroll-spy و دکمه‌ی «اتاق فرمان»
- هیرو با پرتره و halo/ring، چهار آیکون شناور نرم‌افزار، آمار شمارنده‌ای و پارالاکس
- کارت معرفی، مسیر تجربه و مهارت‌ها با نوار درصد
- کاروسل سه‌بعدی با درگ/لمس/کلید جهت، شمارنده، برچسب دسته، ریل پیشرفت و لایت‌باکس
- بخش CTA با حلقه‌های مداری و دکمه‌ی مغناطیسی
- تماس با سه کارت (تماس، شناسه + شبکه‌ها، ایمیل)؛ هر فیلد خالی یا `****` با «به‌زودی» نمایش داده می‌شود
- ظهور تدریجی هنگام اسکرول، احترام به `prefers-reduced-motion`، ریسپانسیو کامل و دسترس‌پذیری (aria، فوکوس کیبورد)

## امکانات پنل «اتاق فرمان»

- ورود با ایمیل/رمز Supabase Auth؛ بدون ورود هیچ داده‌ای رندر نمی‌شود و صفحه‌ها `noindex` هستند
- تب‌های **آثار / تماس / مهارت‌ها / متن‌ها** + چهار کارت KPI
- آپلود drag & drop چندتایی، انتخاب دسته با datalist، «اثر جدید اول باشد»، «انتشار خودکار»،
  فیلتر دسته با chip، ویرایش عنوان/دسته/توضیح، جابه‌جایی ترتیب (دکمه یا کشیدن) و حذف با مودال تأیید
- ویرایش تماس، شناسه، ایمیل و تا ۱۲ شبکه‌ی اجتماعی
- ویرایش مهارت‌ها، تجربه‌ها، شمارنده‌ها و همه‌ی متن‌های سایت (هویت، درباره، CTA، تماس، فوتر)
- نوار «ذخیره و انتشار / انصراف» و toast وضعیت

## ساختار پروژه

```
index.html          صفحه‌ی اصلی
style.css           استایل سایت (توکن‌های CSS در :root)
script.js           رفتار سایت (لودر، کاروسل، لایت‌باکس، انیمیشن‌ها)
store.js            لایه‌ی داده و احراز هویت Supabase
config.js           آدرس پروژه و کلید publishable
data.json           داده‌ی seed (فقط پشتیبان آفلاین)
assets/             تصاویر placeholder (SVG گرادیانی)
font/               فونت Vazirmatn (woff2) — با Rokh جایگزین‌پذیر است
vendor/             Supabase JS (۲.۱۱۸)
admin/              پنل مدیریت
  index.html        اتاق فرمان
  login.html        ورود
  admin.css admin.js login.js
.github/workflows/pages.yml   استقرار خودکار روی GitHub Pages
```

## بک‌اند Supabase

پروژه: `jexftkwqetrerjozztqp`

### جدول‌ها

همه‌ی جدول‌ها ستون `sort_order` (ترتیب) و `updated_at` (با تریگر خودکار) دارند.

| جدول | ستون‌ها |
| --- | --- |
| `site_content` | `key`, `value` (سند JSON کامل متن‌ها), `kind`, `label`, `grp`, `sort_order` |
| `works` | `title`, `category`, `description`, `storage_path`, `sort_order`, `is_published` |
| `skills` | `name`, `percent`, `sort_order` |
| `stats` | `label`, `value`, `suffix`, `sort_order` |
| `experiences` | `role`, `place`, `period`, `sort_order` |
| `contact` | تک‌ردیف `id = 1`: `phone`, `social_id`, `email` |
| `contact_links` | `key`, `label`, `url`, `sort_order` |

### امنیت (RLS)

- **خواندن:** همه‌ی جدول‌ها برای `anon` و `authenticated` قابل خواندن‌اند.
- **نوشتن/ویرایش/حذف:** فقط تابع `is_site_admin()` که ایمیل JWT یا جدول `site_admins` را بررسی می‌کند.
  حتی `INSERT/UPDATE/DELETE` از نقش `anon` با `REVOKE` هم بسته شده است.
- **Storage:** باکت عمومی `media`؛ خواندن برای همه، آپلود/حذف فقط ادمین.
  محدودیت حجم ۸ مگابایت و انواع `image/png`, `image/jpeg`, `image/webp`, `image/gif`.
- **کلیدها:** فقط کلید publishable در `config.js` است. کلید `service_role` در هیچ فایلی نیست.

### تغییرات زنده

جدول‌ها به publication `supabase_realtime` اضافه شده‌اند و `REPLICA IDENTITY FULL` دارند.
با هر ذخیره در پنل، صفحه‌ی اصلی بدون deploy مجدد به‌روز می‌شود.
اگر Supabase در دسترس نباشد، سایت از `data.json` بالا می‌آید.

### تغییر رمز مدیر

رمز در ریپو ذخیره نمی‌شود. برای بازنشانی، در داشبورد Supabase →
**Authentication → Users** → کاربر `resane.Miim@gmail.com` → **Reset password**.
ثبت‌نام عمومی غیرفعال است؛ کاربر جدید فقط از داشبورد ساخته می‌شود.

## اجرا به‌صورت محلی

```bash
python3 -m http.server 8080
# سایت:  http://localhost:8080/
# پنل:   http://localhost:8080/admin/
```

## استقرار

فایل `.github/workflows/pages.yml` با هر push روی `main` سایت را روی GitHub Pages مستقر می‌کند
(منبع Pages: **GitHub Actions**). فایل `.nojekyll` در ریشه است تا Jekyll فایل‌ها را دست‌کاری نکند.

## داده‌ی اولیه

- نام: مجتبی میدانی — برند: رسانه میم
- نقش: طراح گرافیک و وب دیزاینر
- تلفن: ۰۹۳۹۹۸۸۷۹۵۰ — ایمیل: `resane.Miim@gmail.com` — اینستاگرام/تلگرام: `Resane_miim`
- دسته‌های آثار: طراحی وب، گرافیک، عکاسی، تدوین
- تصاویر فعلی placeholder هستند و از پنل قابل جایگزینی‌اند.
