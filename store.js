/* =====================================================================
   store.js — لایه‌ی داده و احراز هویت (Supabase)
   ---------------------------------------------------------------------
   • خواندن عمومی سایت فقط با کلید publishable (anon) انجام می‌شود.
   • نوشتن/ویرایش/حذف با RLS سمت سرور به کاربر ادمین محدود شده است؛
     حتی اگر کسی این فایل را دست‌کاری کند، دیتابیس اجازه‌ی نوشتن نمی‌دهد.
   • اگر Supabase در دسترس نبود یا پاسخی نداد، سایت از data.json
     (فایل seed داخل ریپو) بالا می‌آید تا هیچ‌وقت خالی نماند.
   • هیچ داده‌ی کاربری با innerHTML تزریق نمی‌شود.

   نقشه‌ی جدول‌ها (همه با ستون ترتیب sort_order و updated_at):
     site_content  → یک سند JSON کامل متن‌های سایت در ستون value
     works         → title, category, description, storage_path, sort_order, is_published
     skills        → name, percent, sort_order
     stats         → label, value, suffix, sort_order
     experiences   → role, place, period, sort_order
     contact       → تک‌ردیف (id = 1): phone, social_id, email
     contact_links → key, label, url, sort_order
   ===================================================================== */
(() => {
  "use strict";

  const CFG = window.MIIM_CONFIG;
  const BUCKET = CFG.MEDIA_BUCKET;
  const MAX_FILE = 8 * 1024 * 1024; // ۸ مگابایت
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const PLATFORM_KEYS = ["instagram", "telegram", "whatsapp", "linkedin", "behance", "dribbble", "x", "youtube", "link"];
  const MAX_LINKS = 12; // حداکثر تعداد شبکه‌های اجتماعی

  let client = null;
  let channel = null;
  let state = emptyState();
  const listeners = new Set();

  function emptyState() {
    return { content: {}, contact: {}, skills: [], works: [], source: "seed", updatedAt: null, error: null };
  }

  /* ===================================================================
     ۱) ابزارهای پایه: عدد فارسی، پاک‌سازی متن، اعتبارسنجی
     =================================================================== */

  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  /** تبدیل ارقام لاتین به فارسی (برای نمایش) */
  const toFa = (v) => String(v ?? "").replace(/\d/g, (d) => FA_DIGITS[+d]);

  /** تبدیل ارقام فارسی/عربی به لاتین (برای ذخیره و محاسبه) */
  const toEn = (v) =>
    String(v ?? "")
      .replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d))
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  /** عدد با جداکننده‌ی هزارگان و ارقام فارسی */
  function faNum(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "۰";
    return toFa(num.toLocaleString("en-US"));
  }

  /** پاک‌سازی متن تک‌خطی: حذف کاراکترهای کنترلی و «<>» و فشرده‌کردن فاصله‌ها */
  function cleanText(value, max = 500) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  /** پاک‌سازی متن چندخطی (توضیحات، درباره‌ی من) */
  function cleanMultiline(value, max = 2000) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .replace(/[<>]/g, "")
      .replace(/\r\n/g, "\n")
      .trim()
      .slice(0, max);
  }

  /**
   * اعتبارسنجی URL: فقط http/https و مسیرهای نسبی امن داخل ریپو.
   * هر چیز دیگری (javascript:, data:, ...) حذف می‌شود.
   */
  function safeUrl(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\/[^\s"'<>]{3,500}$/i.test(raw)) {
      try {
        const u = new URL(raw);
        if (u.protocol === "http:" || u.protocol === "https:") return u.href;
      } catch {
        return "";
      }
    }
    // مسیرهای نسبی مجاز (مثل assets/work-1.svg یا SVG داده‌ای امن تولید خودمان)
    if (/^(assets|font)\/[A-Za-z0-9._-]{1,120}$/.test(raw)) return raw;
    if (/^data:image\/svg\+xml;charset=utf-8,/i.test(raw)) return raw;
    return "";
  }

  /** آیا مقدار فقط ستاره است؟ (قرارداد «به‌زودی») */
  const isPlaceholder = (v) => /^[\s*]*\*+[\s*]*$/.test(String(v ?? ""));

  /** شماره‌ی تماس: فقط ارقام و + ، بین ۱۰ تا ۱۵ رقم */
  function safePhone(value) {
    if (isPlaceholder(value)) return "";
    const raw = toEn(value).replace(/[^\d+]/g, "");
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return "";
    return raw.startsWith("+") ? "+" + digits : digits;
  }

  /** ایمیل معتبر */
  function safeEmail(value) {
    if (isPlaceholder(value)) return "";
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) ? raw.slice(0, 120) : "";
  }

  /** شناسه‌ی شبکه‌های اجتماعی: حذف @ و فاصله، حداکثر ۶۰ کاراکتر */
  function safeHandle(value) {
    const raw = cleanText(value, 60).replace(/^@+/, "").replace(/\s/g, "");
    // مقدارهای جای‌نگهدار مثل «****» به‌معنی «هنوز ثبت نشده» هستند
    return /^\*+$/.test(raw) ? "" : raw;
  }

  /**
   * فهرست پلتفرم‌ها: کلید مجاز، برچسب و لینک امن (حداکثر ۱۲ مورد).
   * شبکه‌ای که لینک ندارد هم نگه داشته می‌شود تا در سایت با برچسب
   * «به‌زودی» و بدون لینک نمایش داده شود.
   */
  function safePlatforms(list) {
    if (!Array.isArray(list)) return [];
    return list
      .slice(0, MAX_LINKS)
      .map((p) => {
        const item = p && typeof p === "object" ? p : {};
        const key = PLATFORM_KEYS.includes(item.key) ? item.key : "link";
        return {
          key,
          label: cleanText(item.label, 30) || PLATFORM_LABELS[key] || key,
          url: safeUrl(item.url),
        };
      });
  }

  const PLATFORM_LABELS = {
    instagram: "اینستاگرام",
    telegram: "تلگرام",
    whatsapp: "واتساپ",
    linkedin: "لینکدین",
    behance: "بهانس",
    dribbble: "دریبل",
    x: "ایکس",
    youtube: "یوتیوب",
    link: "لینک",
  };

  /* ===================================================================
     ۲) نرمال‌سازی داده (هر چیزی که از شبکه می‌آید در اینجا ایمن می‌شود)
     =================================================================== */

  /** ساخت آدرس عمومی یک فایل داخل باکت `media` */
  function publicUrlFor(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return safeUrl(path);
    const base = CFG.SUPABASE_URL.replace(/\/$/, "");
    const clean = String(path).replace(/^\/+/, "").replace(/\.\./g, "");
    return `${base}/storage/v1/object/public/${BUCKET}/${encodeURI(clean)}`;
  }

  /** متن‌های سایت: هر کلید شناخته‌شده پاک‌سازی و با پیش‌فرض seed تکمیل می‌شود */
  function normalizeContent(raw) {
    const base = SEED.content;
    const d = raw && typeof raw === "object" ? raw : {};
    const out = { ...base };

    for (const key of Object.keys(base)) {
      if (["experiences", "stats", "heroPhoto"].includes(key)) continue;
      if (typeof d[key] === "string") out[key] = cleanMultiline(d[key], key === "aboutText" ? 1200 : 400);
    }

    out.experiences = Array.isArray(d.experiences)
      ? d.experiences.slice(0, 12).map((x) => ({
          role: cleanText(x && x.role, 80),
          place: cleanText(x && x.place, 80),
          period: cleanText(x && x.period, 40),
        }))
      : base.experiences;

    out.stats = Array.isArray(d.stats)
      ? d.stats.slice(0, 6).map((x) => ({
          label: cleanText(x && x.label, 40),
          value: Math.max(0, Math.min(99999, Math.round(Number(toEn(x && x.value)) || 0))),
          suffix: cleanText(x && x.suffix, 4),
        }))
      : base.stats;

    out.heroPhoto = safeUrl(d.heroPhoto) || base.heroPhoto;
    return out;
  }

  /** اطلاعات تماس: از ردیف contact + ردیف‌های contact_links ساخته می‌شود */
  function normalizeContact(row, links) {
    const base = SEED.contact;
    const d = row && typeof row === "object" ? row : {};
    const list = Array.isArray(links) && links.length ? links : d.platforms || base.platforms;

    return {
      phone: safePhone(d.phone ?? base.phone),
      socialId: safeHandle(d.socialId ?? d.social_id ?? base.socialId),
      email: safeEmail(d.email ?? base.email),
      platforms: safePlatforms(list),
    };
  }

  function normalizeSkills(rows) {
    if (!Array.isArray(rows)) return [];
    return rows
      .map((s, i) => ({
        id: (s && s.id) || null,
        name: cleanText(s && s.name, 40),
        percent: Math.max(0, Math.min(100, Math.round(Number(s && s.percent) || 0))),
        sortOrder: Number((s && (s.sort_order ?? s.sortOrder)) ?? i + 1),
      }))
      .filter((s) => s.name)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function normalizeStats(rows) {
    if (!Array.isArray(rows)) return [];
    return rows
      .map((r, i) => ({
        id: (r && r.id) || null,
        label: cleanText(r && r.label, 40),
        value: Math.max(0, Math.min(99999, Math.round(Number(toEn(r && r.value)) || 0))),
        suffix: cleanText(r && r.suffix, 4),
        sortOrder: Number((r && (r.sort_order ?? r.sortOrder)) ?? i + 1),
      }))
      .filter((r) => r.label)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function normalizeExperiences(rows) {
    if (!Array.isArray(rows)) return [];
    return rows
      .map((r, i) => ({
        id: (r && r.id) || null,
        role: cleanText(r && r.role, 80),
        place: cleanText(r && r.place, 80),
        period: cleanText(r && r.period, 40),
        sortOrder: Number((r && (r.sort_order ?? r.sortOrder)) ?? i + 1),
      }))
      .filter((r) => r.role)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * آثار: ورودی می‌تواند ردیف دیتابیس یا داده‌ی seed باشد.
   * تصویر: از storage_path (باکت) یا imageUrl (seed) خوانده می‌شود.
   */
  function normalizeWorks(rows, onlyPublished = false) {
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((w) => (onlyPublished ? (w.is_published ?? w.isPublished) !== false : true))
      .map((w, i) => {
        const path = w.storage_path ?? w.imagePath ?? null;
        const direct = w.imageUrl ?? w.image_url ?? null;
        const src = path ? publicUrlFor(path) : safeUrl(direct) || "assets/work-1.svg";
        return {
          id: w.id || null,
          title: cleanText(w.title, 120) || "بدون عنوان",
          category: cleanText(w.category, 40) || "بدون دسته",
          description: cleanMultiline(w.description, 600),
          imageUrl: src,
          imagePath: path,
          sortOrder: Number(w.sort_order ?? w.sortOrder ?? i + 1),
          isPublished: (w.is_published ?? w.isPublished) !== false,
          createdAt: w.created_at ?? w.createdAt ?? null,
          updatedAt: w.updated_at ?? w.updatedAt ?? null,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** تبدیل مسیر نسبی (assets/...) به آدرس کامل نسبت به ریشه‌ی سایت */
  function resolveAsset(url) {
    const safe = safeUrl(url);
    if (!safe) return "";
    if (/^(https?:|data:|blob:)/i.test(safe)) return safe;
    try {
      return new URL(safe, CFG.SITE_BASE).href;
    } catch {
      return safe;
    }
  }

  /* ===================================================================
     ۳) داده‌ی seed (پشتیبان آفلاین؛ آینه‌ی data.json)
     =================================================================== */

  const SEED = {
    content: {
      brand: "رسانه میم",
      name: "مجتبی میدانی",
      roleFa: "طراح گرافیک و وب دیزاینر",
      roleEn: "Graphic & Web Designer",
      heroGreet: "سلام، من مجتبی‌ام",
      heroPhoto: "assets/portrait.svg",
      navHero: "خانه",
      navAbout: "درباره‌ی من",
      navWorks: "آثار",
      navContact: "تماس",
      aboutEyebrow: "درباره‌ی من",
      aboutHeading: "طراحی می‌کنم تا دیده شوی",
      aboutText:
        "من مجتبی میدانی هستم؛ طراح گرافیک، طراح وب، عکاس و تدوین‌گر، و بنیان‌گذار رسانه میم. کار من ساختن تصویری است که یک کسب‌وکار را از بقیه جدا کند: از هویت بصری و لوگو تا وب‌سایت، عکاسی و تدوین ویدیو.",
      expHeading: "مسیر تجربه",
      experiences: [
        { role: "طراح گرافیک و وب", place: "رسانه میم", period: "۱۴۰۲ — اکنون" },
        { role: "طراح وب‌سایت و فروشگاه‌ساز", place: "پروژه‌های آزاد با برندها", period: "۱۴۰۰ — اکنون" },
        { role: "عکاس و تدوین‌گر", place: "محصول، تبلیغات و تیزر کوتاه", period: "۱۳۹۹ — اکنون" },
      ],
      stats: [
        { label: "اثر منتخب", value: 24, suffix: "+" },
        { label: "سال تجربه", value: 6, suffix: "" },
        { label: "نرم‌افزار تخصصی", value: 5, suffix: "" },
      ],
      skillsEyebrow: "مهارت‌ها",
      skillsHeading: "ابزارهایی که با آن‌ها می‌سازم",
      worksEyebrow: "گالری آثار",
      worksHeading: "نمونه‌ای از کارها",
      ctaText: "وقتشه کسب‌وکارت بهتر دیده بشه؟",
      ctaButton: "شروع گفتگو",
      contactEyebrow: "تماس",
      contactHeading: "بیا در ارتباط باشیم",
      contactLead: "برای همکاری، سفارش طراحی یا فقط یک گفتگوی دوستانه، در دسترس هستم.",
      footerLegal: "© رسانه میم — تمامی حقوق محتوای این وب‌سایت متعلق به مجتبی میدانی است.",
    },
    contact: {
      phone: "09399887950",
      socialId: "Resane_miim",
      email: "resane.Miim@gmail.com",
      platforms: [
        { key: "instagram", label: "اینستاگرام", url: "https://instagram.com/Resane_miim" },
        { key: "telegram", label: "تلگرام", url: "https://t.me/Resane_miim" },
        { key: "whatsapp", label: "واتساپ", url: "https://wa.me/989399887950" },
      ],
    },
    skills: [
      { name: "Photoshop", percent: 88 },
      { name: "Illustrator", percent: 76 },
      { name: "Premiere Pro", percent: 70 },
      { name: "Figma", percent: 82 },
      { name: "Lightroom", percent: 68 },
    ],
    works: [
      { title: "وب‌سایت استودیو نور", category: "طراحی وب", description: "", imageUrl: "assets/work-1.svg", sortOrder: 1, isPublished: true },
      { title: "هویت بصری آفتاب", category: "گرافیک", description: "", imageUrl: "assets/work-2.svg", sortOrder: 2, isPublished: true },
      { title: "کمپین تبلیغاتی رها", category: "گرافیک", description: "", imageUrl: "assets/work-3.svg", sortOrder: 3, isPublished: true },
      { title: "پوستر رویداد مدیا", category: "گرافیک", description: "", imageUrl: "assets/work-4.svg", sortOrder: 4, isPublished: true },
      { title: "عکاسی محصول آرکا", category: "عکاسی", description: "", imageUrl: "assets/work-5.svg", sortOrder: 5, isPublished: true },
      { title: "تیزر برند مانا", category: "تدوین", description: "", imageUrl: "assets/work-6.svg", sortOrder: 6, isPublished: true },
    ],
  };

  let seedCache = null;

  /** نسخه‌ی سنکرون seed برای رندر فوری (قبل از رسیدن پاسخ شبکه) */
  function immediateSeed() {
    return {
      content: normalizeContent(SEED.content),
      contact: normalizeContact(SEED.contact),
      skills: normalizeSkills(SEED.skills),
      works: normalizeWorks(SEED.works),
      source: "seed",
      updatedAt: null,
      error: null,
    };
  }

  /** خواندن data.json؛ اگر حتی آن هم نبود، از SEED داخلی استفاده می‌شود */
  async function loadSeed() {
    if (seedCache) return seedCache;
    try {
      const res = await fetch(new URL("data.json", CFG.SITE_BASE).href, { cache: "no-cache" });
      if (!res.ok) throw new Error("seed http " + res.status);
      const json = await res.json();
      seedCache = {
        content: normalizeContent(json.content),
        contact: normalizeContact(json.contact),
        skills: normalizeSkills(json.skills),
        works: normalizeWorks(json.works),
        source: "seed",
        updatedAt: null,
        error: null,
      };
    } catch {
      seedCache = {
        content: normalizeContent(SEED.content),
        contact: normalizeContact(SEED.contact),
        skills: normalizeSkills(SEED.skills),
        works: normalizeWorks(SEED.works),
        source: "seed",
        updatedAt: null,
        error: null,
      };
    }
    return seedCache;
  }

  /* ===================================================================
     ۴) کلاینت Supabase
     =================================================================== */

  function getClient() {
    if (client) return client;
    if (!window.supabase || !CFG) return null;
    client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // کلید ثابت: جلسه بین صفحه‌ی ورود و پنل (پوشه‌ی /admin/) به اشتراک گذاشته می‌شود
        storageKey: "miim-portfolio-auth",
        flowType: "pkce",
      },
      global: { headers: { "x-application-name": "miim-portfolio" } },
    });
    return client;
  }

  function emit() {
    for (const fn of listeners) {
      try {
        fn(state);
      } catch (e) {
        console.warn("[MiimStore] listener error", e);
      }
    }
  }

  /** Promise با مهلت؛ برای اینکه سایت روی شبکه‌ی کند قفل نشود */
  function withTimeout(promise, ms, message) {
    return Promise.race([
      promise,
      new Promise((_resolve, reject) => window.setTimeout(() => reject(new Error(message || "timeout")), ms)),
    ]);
  }

  /**
   * خواندن کل داده‌ی سایت از Supabase.
   * اگر هر بخشی خطا بدهد، مقدار پیش‌فرض همان بخش از seed می‌آید
   * (به‌جای اینکه کل سایت خراب شود).
   */
  async function fetchSiteData(c) {
    const [contentRes, worksRes, skillsRes, statsRes, expRes, contactRes, linksRes] = await Promise.all([
      c.from("site_content").select("value, updated_at").eq("key", "site").maybeSingle(),
      c.from("works").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      c.from("skills").select("*").order("sort_order", { ascending: true }),
      c.from("stats").select("*").order("sort_order", { ascending: true }),
      c.from("experiences").select("*").order("sort_order", { ascending: true }),
      c.from("contact").select("*").eq("id", 1).maybeSingle(),
      c.from("contact_links").select("*").order("sort_order", { ascending: true }),
    ]);

    let doc = null;
    if (!contentRes.error && contentRes.data && contentRes.data.value) {
      try {
        doc = JSON.parse(contentRes.data.value);
      } catch {
        doc = null;
      }
    }

    const hasAnything = !!(doc || contactRes.data || (worksRes.data || []).length || (skillsRes.data || []).length);
    if (!hasAnything) return null;

    const touch = [
      contentRes.data && contentRes.data.updated_at,
      contactRes.data && contactRes.data.updated_at,
      ...(worksRes.data || []).map((w) => w.updated_at),
      ...(skillsRes.data || []).map((s) => s.updated_at),
      ...(statsRes.data || []).map((s) => s.updated_at),
      ...(expRes.data || []).map((e) => e.updated_at),
    ]
      .filter(Boolean)
      .sort()
      .pop();

    return {
      content: normalizeContent(doc),
      works: normalizeWorks(worksRes.error ? [] : worksRes.data, true),
      skills: normalizeSkills(skillsRes.error ? SEED.skills : skillsRes.data),
      stats: statsRes.error ? null : normalizeStats(statsRes.data),
      experiences: expRes.error ? null : normalizeExperiences(expRes.data),
      contact: normalizeContact(contactRes.error ? SEED.contact : contactRes.data, linksRes.error ? null : linksRes.data),
      updatedAt: touch || null,
    };
  }

  /* ===================================================================
     ۵) API عمومی سایت
     =================================================================== */

  /** بارگذاری داده‌ی سایت (Supabase → در صورت خطا seed) */
  async function loadSite() {
    const c = getClient();
    if (!c) {
      state = await loadSeed();
      emit();
      return state;
    }
    try {
      const data = await withTimeout(fetchSiteData(c), 8000, "supabase timeout");
      if (!data) {
        state = await loadSeed();
        emit();
        return state;
      }
      // آمار و تجربه‌ها هم از جدول‌های اختصاصی می‌آیند و بر سند اولویت دارند
      if (data.stats && data.stats.length) data.content.stats = data.stats;
      if (data.experiences && data.experiences.length) data.content.experiences = data.experiences;

      state = {
        content: data.content,
        contact: data.contact,
        skills: data.skills,
        works: data.works,
        source: "supabase",
        updatedAt: data.updatedAt,
        error: null,
      };
    } catch (e) {
      console.warn("[MiimStore] Supabase در دسترس نیست؛ استفاده از seed:", e && e.message);
      state = await loadSeed();
      state.error = (e && e.message) || "connection error";
    }
    emit();
    return state;
  }

  function getState() {
    return state;
  }

  /**
   * داده‌ی فوری: اولین بار که فراخوانی شود، seed را برمی‌گرداند
   * تا صفحه بلافاصله پر شود و بعد با داده‌ی واقعی جایگزین شود.
   */
  function getInitialState() {
    if (state.source === "seed" && !Object.keys(state.content || {}).length) {
      state = immediateSeed();
    }
    return state;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  /**
   * اشتراک تغییرات زنده (Supabase Realtime).
   * با هر تغییر در پنل، سایت بدون نیاز به deploy مجدد به‌روز می‌شود.
   */
  function subscribeLive(onChange) {
    const c = getClient();
    if (!c) return () => {};
    if (channel) return () => {};
    const tables = ["works", "skills", "stats", "experiences", "contact", "contact_links", "site_content"];
    let ch = c.channel("miim-live");
    for (const table of tables) {
      ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        // چند تغییر پشت‌سرهم را در یک بارگذاری جمع می‌کنیم
        window.clearTimeout(subscribeLive._t);
        subscribeLive._t = window.setTimeout(() => onChange(), 250);
      });
    }
    channel = ch.subscribe();
    return () => {
      if (channel) {
        c.removeChannel(channel);
        channel = null;
      }
    };
  }

  /* ===================================================================
     ۶) احراز هویت (Supabase Auth)
     =================================================================== */

  function friendlyAuthError(error) {
    const msg = String((error && error.message) || "").toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) return "ایمیل یا رمز عبور درست نیست.";
    if (msg.includes("email not confirmed")) return "ایمیل شما تأیید نشده است.";
    if (msg.includes("rate limit") || msg.includes("too many")) return "تلاش‌های ناموفق زیاد بود؛ کمی بعد دوباره امتحان کنید.";
    if (msg.includes("failed to fetch") || msg.includes("network")) return "اتصال به سرور برقرار نشد. اینترنت را بررسی کنید.";
    return (error && error.message) || "ورود ناموفق بود.";
  }

  async function signIn(email, password) {
    const c = getClient();
    if (!c) throw new Error("سرویس احراز هویت در دسترس نیست.");
    const { data, error } = await c.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || ""),
    });
    if (error) throw new Error(friendlyAuthError(error));
    return data.session;
  }

  async function signOut() {
    const c = getClient();
    if (c) await c.auth.signOut();
  }

  /** خواندن نشست فعلی با مهلت؛ در نبود شبکه null برمی‌گرداند */
  async function getSession() {
    const c = getClient();
    if (!c) return null;
    try {
      const result = await withTimeout(c.auth.getSession(), 5000, "session timeout");
      return (result && result.data && result.data.session) || null;
    } catch {
      return null;
    }
  }

  /** آیا کاربر واردشده همان ادمین است؟ (بررسی سمت کلاینت؛ مرجع نهایی RLS است) */
  async function isAdmin() {
    const session = await getSession();
    const email = session && session.user && session.user.email ? session.user.email.toLowerCase() : "";
    return email === String(CFG.ADMIN_EMAIL || "").toLowerCase();
  }

  function onAuthChange(cb) {
    const c = getClient();
    if (!c) return () => {};
    const { data } = c.auth.onAuthStateChange((_event, session) => cb(session));
    return () => data.subscription.unsubscribe();
  }

  /* ===================================================================
     ۷) اعتبارسنجی و آپلود فایل
     =================================================================== */

  function validateImage(file) {
    if (!file) throw new Error("فایلی انتخاب نشده است.");
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error("نوع فایل مجاز نیست؛ فقط PNG، JPG، WEBP یا GIF.");
    if (file.size > MAX_FILE) throw new Error("حجم عکس بیش از ۸ مگابایت است.");
    if (file.size < 100) throw new Error("فایل عکس معتبر نیست.");
    return true;
  }

  /** نام فایل امن: فقط حروف لاتین/ارقام/خط تیره */
  function safeFileName(name) {
    const base = String(name || "image").replace(/\.[^.]+$/, "");
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return slug || "image";
  }

  async function uploadMedia(file, folder = "works") {
    validateImage(file);
    const c = getClient();
    if (!c) throw new Error("سرویس ذخیره‌سازی در دسترس نیست.");
    const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
    const rand = window.crypto && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
    const path = `${folder}/${Date.now().toString(36)}-${rand}-${safeFileName(file.name)}.${ext}`;
    const { error } = await c.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw new Error("آپلود عکس ناموفق بود: " + (error.message || "خطای نامشخص"));
    return { path, url: publicUrlFor(path) };
  }

  async function deleteMedia(path) {
    if (!path) return;
    const c = getClient();
    if (!c) return;
    const { error } = await c.storage.from(BUCKET).remove([path]);
    if (error) console.warn("[MiimStore] delete media:", error.message);
  }

  /* ===================================================================
     ۸) عملیات پنل مدیریت (فقط با نشست ادمین کار می‌کند؛ RLS تضمین می‌کند)
     =================================================================== */

  /** خواندن کامل داده برای پنل: شامل همه‌ی آثار (منتشرشده و پیش‌نویس) */
  async function adminLoadAll() {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const [worksRes, skillsRes, statsRes, expRes, contentRes, contactRes, linksRes] = await Promise.all([
      c.from("works").select("*").order("sort_order", { ascending: true }),
      c.from("skills").select("*").order("sort_order", { ascending: true }),
      c.from("stats").select("*").order("sort_order", { ascending: true }),
      c.from("experiences").select("*").order("sort_order", { ascending: true }),
      c.from("site_content").select("value, updated_at").eq("key", "site").maybeSingle(),
      c.from("contact").select("*").eq("id", 1).maybeSingle(),
      c.from("contact_links").select("*").order("sort_order", { ascending: true }),
    ]);

    const firstError = worksRes.error || skillsRes.error || contentRes.error || contactRes.error;
    if (firstError) throw new Error(firstError.message || "خواندن داده ناموفق بود.");

    let doc = null;
    if (contentRes.data && contentRes.data.value) {
      try {
        doc = JSON.parse(contentRes.data.value);
      } catch {
        doc = null;
      }
    }

    const content = normalizeContent(doc);
    if (!statsRes.error && (statsRes.data || []).length) content.stats = normalizeStats(statsRes.data);
    if (!expRes.error && (expRes.data || []).length) content.experiences = normalizeExperiences(expRes.data);

    const touch = [
      contentRes.data && contentRes.data.updated_at,
      contactRes.data && contactRes.data.updated_at,
      ...(worksRes.data || []).map((w) => w.updated_at),
      ...(skillsRes.data || []).map((s) => s.updated_at),
    ]
      .filter(Boolean)
      .sort()
      .pop();

    return {
      works: normalizeWorks(worksRes.data),
      skills: normalizeSkills(skillsRes.data),
      content,
      contact: normalizeContact(contactRes.data || SEED.contact, linksRes.error ? null : linksRes.data),
      updatedAt: touch || null,
    };
  }

  /** افزودن اثر: آپلود فایل + درج ردیف با ترتیب دلخواه */
  async function adminCreateWork({ file, title, category, description, publishFirst, autoPublish }) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    validateImage(file);
    const uploaded = await uploadMedia(file, "works");
    const cleanTitle = cleanText(title, 120) || "اثر بدون عنوان";
    const cleanCategory = cleanText(category, 40) || "بدون دسته";
    const cleanDesc = cleanMultiline(description, 600);

    // تعیین ترتیب: اول فهرست یا آخر فهرست
    let order = 1;
    const edge = await c
      .from("works")
      .select("sort_order")
      .order("sort_order", { ascending: !publishFirst })
      .limit(1);
    const edgeVal = edge.data && edge.data[0] ? Number(edge.data[0].sort_order) : 0;
    order = publishFirst ? edgeVal - 1 : edgeVal + 1;

    const { data, error } = await c
      .from("works")
      .insert({
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDesc,
        storage_path: uploaded.path,
        sort_order: order,
        is_published: !!autoPublish,
      })
      .select()
      .single();

    if (error) {
      await deleteMedia(uploaded.path); // اگر درج نشد، فایل بی‌استفاده نماند
      throw new Error(error.message || "افزودن اثر ناموفق بود.");
    }
    return normalizeWorks([data])[0];
  }

  async function adminUpdateWork(id, patch) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const body = {};
    if (typeof patch.title === "string") body.title = cleanText(patch.title, 120) || "اثر بدون عنوان";
    if (typeof patch.category === "string") body.category = cleanText(patch.category, 40) || "بدون دسته";
    if (typeof patch.description === "string") body.description = cleanMultiline(patch.description, 600);
    if (typeof patch.isPublished === "boolean") body.is_published = patch.isPublished;
    if (typeof patch.sortOrder === "number") body.sort_order = Math.round(patch.sortOrder);
    if (!Object.keys(body).length) return;
    const { error } = await c.from("works").update(body).eq("id", id);
    if (error) throw new Error(error.message || "ویرایش اثر ناموفق بود.");
  }

  async function adminReplaceWorkImage(id, file) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    validateImage(file);
    const old = await c.from("works").select("storage_path").eq("id", id).maybeSingle();
    const uploaded = await uploadMedia(file, "works");
    const { error } = await c.from("works").update({ storage_path: uploaded.path }).eq("id", id);
    if (error) {
      await deleteMedia(uploaded.path);
      throw new Error(error.message || "تغییر عکس ناموفق بود.");
    }
    if (old.data && old.data.storage_path) await deleteMedia(old.data.storage_path);
  }

  async function adminDeleteWork(id) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const row = await c.from("works").select("storage_path").eq("id", id).maybeSingle();
    const { error } = await c.from("works").delete().eq("id", id);
    if (error) throw new Error(error.message || "حذف اثر ناموفق بود.");
    if (row.data && row.data.storage_path) await deleteMedia(row.data.storage_path);
  }

  async function adminReorderWorks(orderedIds) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const results = await Promise.all(
      orderedIds.map((id, index) => c.from("works").update({ sort_order: index + 1 }).eq("id", id))
    );
    const err = results.find((r) => r.error);
    if (err) throw new Error(err.error.message || "تغییر ترتیب ناموفق بود.");
  }

  /** جایگزینی کامل مهارت‌ها: حذف موارد حذف‌شده، ویرایش موجودها و درج جدیدها */
  async function replaceSkills(items) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const clean = (items || [])
      .map((s, i) => ({
        id: (s && s.id) || null,
        name: cleanText(s && s.name, 40),
        percent: Math.max(0, Math.min(100, Math.round(Number(toEn(s && s.percent)) || 0))),
        sortOrder: i + 1,
      }))
      .filter((s) => s.name);
    if (!clean.length) throw new Error("حداقل یک مهارت لازم است.");

    const keepIds = clean.map((s) => s.id).filter(Boolean);
    const existing = await c.from("skills").select("id");
    if (existing.error) throw new Error(existing.error.message);
    const removeIds = (existing.data || []).map((r) => r.id).filter((id) => !keepIds.includes(id));
    if (removeIds.length) {
      const del = await c.from("skills").delete().in("id", removeIds);
      if (del.error) throw new Error(del.error.message);
    }
    for (const s of clean) {
      const body = { name: s.name, percent: s.percent, sort_order: s.sortOrder };
      const res = s.id
        ? await c.from("skills").update(body).eq("id", s.id)
        : await c.from("skills").insert(body);
      if (res.error) throw new Error(res.error.message);
    }
  }

  /** جایگزینی کامل شمارنده‌های هیرو */
  async function replaceStats(items) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const clean = (items || [])
      .slice(0, 6)
      .map((s, i) => ({
        id: (s && s.id) || null,
        label: cleanText(s && s.label, 40),
        value: Math.max(0, Math.min(99999, Math.round(Number(toEn(s && s.value)) || 0))),
        suffix: cleanText(s && s.suffix, 4),
        sortOrder: i + 1,
      }))
      .filter((s) => s.label);
    if (!clean.length) throw new Error("حداقل یک شمارنده لازم است.");

    const keepIds = clean.map((s) => s.id).filter(Boolean);
    const existing = await c.from("stats").select("id");
    if (existing.error) throw new Error(existing.error.message);
    const removeIds = (existing.data || []).map((r) => r.id).filter((id) => !keepIds.includes(id));
    if (removeIds.length) {
      const del = await c.from("stats").delete().in("id", removeIds);
      if (del.error) throw new Error(del.error.message);
    }
    for (const s of clean) {
      const body = { label: s.label, value: s.value, suffix: s.suffix, sort_order: s.sortOrder };
      const res = s.id ? await c.from("stats").update(body).eq("id", s.id) : await c.from("stats").insert(body);
      if (res.error) throw new Error(res.error.message);
    }
  }

  /** جایگزینی کامل مسیر تجربه */
  async function replaceExperiences(items) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const clean = (items || [])
      .slice(0, 12)
      .map((s, i) => ({
        id: (s && s.id) || null,
        role: cleanText(s && s.role, 80),
        place: cleanText(s && s.place, 80),
        period: cleanText(s && s.period, 40),
        sortOrder: i + 1,
      }))
      .filter((s) => s.role);

    const keepIds = clean.map((s) => s.id).filter(Boolean);
    const existing = await c.from("experiences").select("id");
    if (existing.error) throw new Error(existing.error.message);
    const removeIds = (existing.data || []).map((r) => r.id).filter((id) => !keepIds.includes(id));
    if (removeIds.length) {
      const del = await c.from("experiences").delete().in("id", removeIds);
      if (del.error) throw new Error(del.error.message);
    }
    for (const s of clean) {
      const body = { role: s.role, place: s.place, period: s.period, sort_order: s.sortOrder };
      const res = s.id
        ? await c.from("experiences").update(body).eq("id", s.id)
        : await c.from("experiences").insert(body);
      if (res.error) throw new Error(res.error.message);
    }
  }

  /** ذخیره‌ی متن‌های سایت به‌صورت یک سند JSON */
  async function saveContent(data) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const payload = normalizeContent(data);
    const { error } = await c
      .from("site_content")
      .upsert({ key: "site", value: JSON.stringify(payload), kind: "json", label: "محتوای سایت", grp: "identity" }, { onConflict: "key" });
    if (error) throw new Error(error.message || "ذخیره‌ی متن‌ها ناموفق بود.");
    return payload;
  }

  /** ذخیره‌ی تماس: ردیف contact + بازنویسی contact_links */
  async function saveContact(contact) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const payload = normalizeContact(contact);

    const { error } = await c
      .from("contact")
      .upsert({ id: 1, phone: payload.phone, social_id: payload.socialId, email: payload.email }, { onConflict: "id" });
    if (error) throw new Error(error.message || "ذخیره‌ی اطلاعات تماس ناموفق بود.");

    // لینک‌های شبکه‌های اجتماعی کامل بازنویسی می‌شوند (چون تعدادشان کم است)
    const del = await c.from("contact_links").delete().neq("key", "");
    if (del.error) throw new Error(del.error.message);

    const rows = (payload.platforms || []).slice(0, MAX_LINKS).map((p, i) => ({
      key: p.key,
      label: p.label,
      url: p.url,
      sort_order: i + 1,
    }));
    if (rows.length) {
      const ins = await c.from("contact_links").insert(rows);
      if (ins.error) throw new Error(ins.error.message);
    }
    return payload;
  }

  /* ===================================================================
     ۹) خروجی ماژول
     =================================================================== */

  window.MiimStore = {
    // عمومی
    loadSite,
    getState,
    getInitialState,
    subscribe,
    subscribeLive,
    resolveAsset,
    publicUrlFor,
    // کمکی و اعتبارسنجی
    faNum,
    toFa,
    toEn,
    cleanText,
    cleanMultiline,
    safeUrl,
    safePhone,
    safeEmail,
    safeHandle,
    safePlatforms,
    validateImage,
    PLATFORM_KEYS,
    PLATFORM_LABELS,
    MAX_FILE,
    // احراز هویت
    signIn,
    signOut,
    getSession,
    isAdmin,
    onAuthChange,
    // پنل مدیریت
    adminLoadAll,
    adminCreateWork,
    adminUpdateWork,
    adminReplaceWorkImage,
    adminDeleteWork,
    adminReorderWorks,
    replaceSkills,
    replaceStats,
    replaceExperiences,
    saveContent,
    saveContact,
    uploadMedia,
    deleteMedia,
  };
})();
