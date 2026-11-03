/* =====================================================================
   config.js — تنظیمات عمومی سایت
   فقط کلید publishable/anon در کد فرانت قرار دارد.
   کلید service_role هرگز نباید در این فایل یا هیچ فایل دیگری در ریپو بیاید.
   ===================================================================== */
(() => {
  "use strict";

  // آدرس پروژه در Supabase
  const SUPABASE_URL = "https://jexftkwqetrerjozztqp.supabase.co";

  // کلید publishable (عمومی) — امن برای قرار گرفتن در کد فرانت
  const SUPABASE_ANON_KEY = "sb_publishable_ccfqUlSh-s7msdy0VzdLYA_m580MRej";

  // ایمیل کاربر ادمین (برای سیاست‌های RLS در سمت سرور هم بررسی می‌شود)
  const ADMIN_EMAIL = "resane.Miim@gmail.com";

  // نام باکت عمومی عکس‌ها
  const MEDIA_BUCKET = "media";

  // ریشه‌ی سایت نسبت به مسیر فعلی (پشتیبانی از زیرمسیر GitHub Pages)
  const SITE_BASE = (() => {
    const path = window.location.pathname;
    const inAdmin = /\/admin(?:\/|$)/.test(path);
    return new URL(inAdmin ? "../" : "./", window.location.href).href;
  })();

  window.MIIM_CONFIG = Object.freeze({
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    ADMIN_EMAIL,
    MEDIA_BUCKET,
    SITE_BASE,
  });
})();
