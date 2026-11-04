/* =====================================================================
   RESANE MIIM STUDIO — موتور سینمایی ۶۰ فریم بر ثانیه وب‌سایت رسانه میم
   شامل: پرده لودر سینمایی، بوم ذرات طلایی، هدر کپسولی قرص لغزنده،
   نشانگر مغناطیسی، اسکرول سینمایی هیرو، چرخش سه‌بعدی کارت‌ها و گالری اینرسی‌دار
   ===================================================================== */

const DEFAULT_SITE = {
  imagesPath: "Image/",
  theme: "dark",
  identity: {
    brand: "رسانه میم",
    brandSub: "استودیو طراحی گرافیک و وب",
    name: "مجتبی میدانی",
    roleFa: "طراح ارشد گرافیک، رابط کاربری و وب",
    roleEn: "Creative Director · UI/UX & Web Designer",
    availability: "آماده پذیرش پروژه جدید",
    available: true,
    heroEyebrow: "استودیو خلاقیت دیجیتال — رسانه میم",
    heroTitle: "خلق هویت‌های ماندگار در مرز هنر و تکنولوژی",
    heroAccent: "هنر و تکنولوژی",
    heroBio: "من مجتبی میدانی هستم؛ با ترکیب طراحی استراتژیک، هویت بصری اصیل و مهندسی وب مدرن، به کسب‌وکارها کمک می‌کنم در ذهن مخاطب بدرخشند و فروش خود را متحول کنند.",
    photo: "My-photo.png",
    logo: "logo.png",
  },
  stats: [
    { value: 8, prefix: "+", suffix: " سال", label: "تجربه تخصصی طراحی", dynamicWorks: false },
    { value: 180, prefix: "+", suffix: "", label: "مشتری و برند خرسند", dynamicWorks: false },
    { value: 6, prefix: "", suffix: " اثر", label: "پروژه منتخب ویترین", dynamicWorks: true },
    { value: 100, prefix: "", suffix: "٪", label: "تعهد و پشتیبانی واقعی", dynamicWorks: false },
  ],
  about: {
    eyebrow: "داستان رسانه میم",
    heading: "طراحی فقط زیبایی نیست؛ زبانِ اعتماد و رشد کسب‌وکار شماست",
    text: "بیش از ۸ سال است که در استودیو «رسانه میم» همراه استارتاپ‌ها، فروشگاه‌ها و برندهای پیشرو هستم. باور من این است که هر برند داستان و شخصیت منحصر‌به‌فردی دارد؛ وظیفه من ترجمه این شخصیت به یک تصویر بصری خیره‌کننده و وب‌سایتی سریع، کاربرپسند و نتیجه‌محور است.",
    highlights: [
      "طراحی ۱۰۰٪ اختصاصی متناسب با پرسونای مخاطب هدف شما",
      "کدنویسی استاندارد، فوق‌سریع و بهینه‌شده برای موتورهای جستجو (SEO)",
      "تحویل دقیق طبق زمان‌بندی توافق‌شده به همراه فایل‌های لایه‌باز استاندارد",
      "پشتیبانی مستمر و همراهی فنی پس از تحویل نهایی پروژه",
    ],
  },
  services: [
    {
      id: "web",
      icon: "code",
      title: "طراحی و توسعه وب‌سایت",
      subtitle: "Web Design & Development",
      badge: "پرتقاضا",
      description: "طراحی سایت‌های شرکتی، فروشگاهی و شخصی با سرعت لود فوق‌العاده، نمایش بی‌نقص در موبایل و ساختار اصولی سئو.",
      deliverables: ["طراحی اختصاصی و ریسپانسیو", "بهینه‌سازی سرعت و سئو", "پنل مدیریت آسان", "پشتیبانی فنی"],
    },
    {
      id: "uiux",
      icon: "layers",
      title: "طراحی رابط و تجربه کاربری",
      subtitle: "UI / UX Design (Figma)",
      badge: "استاندارد جهانی",
      description: "خلق تجربه کاربری روان و رابط‌های بصری مدرن برای اپلیکیشن‌های موبایل، سامانه‌های تحت وب و داشبوردهای مدیریتی.",
      deliverables: ["وایرفریم و معماری اطلاعات", "پروتوتایپ تعاملی در فیگما", "دیزاین سیستم یکپارچه", "تحویل آماده کدنویسی"],
    },
    {
      id: "branding",
      icon: "pen",
      title: "هویت بصری، لوگو و بسته‌بندی",
      subtitle: "Brand Identity & Packaging",
      badge: "اصالت برند",
      description: "از خلق لوگوی ماندگار و کتابچه هویت بصری تا طراحی حرفه‌ای بسته‌بندی محصول و اقلام تبلیغاتی چاپی.",
      deliverables: ["طراحی لوگو و نشان تجاری", "پالت رنگ و تایپوگرافی برند", "طراحی بسته‌بندی و لیبل", "ست اداری و کاتالوگ"],
    },
    {
      id: "motion",
      icon: "play",
      title: "موشن گرافیک و محتوای بصری",
      subtitle: "Motion Graphics & Social",
      badge: "جذب مخاطب",
      description: "ساخت تیزرهای تبلیغاتی دوبعدی، لوگو موشن و قالب‌های گرافیکی شبکه‌های اجتماعی برای افزایش نرخ تعامل و فروش.",
      deliverables: ["لوگو موشن اختصاصی", "تیزر معرفی محصول و خدمات", "طراحی کاور و قالب اینستاگرام", "بنرهای تبلیغاتی کمپین"],
    },
  ],
  skills: [
    { name: "UI/UX Design & Prototyping", percent: 95, tag: "Figma" },
    { name: "Modern Web Design & Front-End", percent: 90, tag: "HTML · CSS · JS" },
    { name: "Brand Identity & Illustration", percent: 88, tag: "Photoshop · Illustrator" },
    { name: "Motion Graphics & Visuals", percent: 82, tag: "After Effects" },
  ],
  works: [
    {
      file: "proj-1.jpg",
      url: "https://miimdev.github.io/STYLE-LAND/",
      title: "فروشگاه آنلاین مد و پوشاک «استایلند»",
      tag: "طراحی وب",
      year: "۱۴۰۴",
      client: "برند پوشاک استایلند",
      tools: "Figma · HTML/CSS · JS",
      description: "طراحی تجربه خرید مدرن و مینیمال برای فروشگاه آنلاین مد و استایل؛ با تمرکز بر فیلتر هوشمند سایز و رنگ، کارت محصول تعاملی و فرآیند تسویه‌حساب ۳ مرحله‌ای که نرخ تبدیل موبایل را به شکل چشمگیری افزایش داد.",
    },
    {
      file: "proj-3.jpg",
      title: "هویت بصری و بسته‌بندی «کافه رستا»",
      tag: "برندینگ",
      year: "۱۴۰۳",
      client: "کافه تخصصی رستا",
      tools: "Illustrator · Photoshop",
      description: "خلق هویت بصری گرم و اصیل برای کافه رستری تخصصی قهوه؛ شامل طراحی لوگوتایپ فارسی، پترن اختصاصی، پاکت‌های قهوه، لیوان بیرون‌بر، منو و تابلوهای محیطی.",
    },
    {
      file: "proj-4.jpg",
      url: "https://miimdev.github.io/IDEA/",
      title: "وب‌سایت استودیو خلاقیت «ایده‌پردازان»",
      tag: "طراحی وب",
      year: "۱۴۰۴",
      client: "آژانس دیجیتال ایده‌پردازان",
      tools: "Figma · CSS3 · Motion",
      description: "طراحی وب‌سایت تعاملی با اتمسفر تاریک استودیویی، تایپوگرافی جسورانه و انیمیشن‌های اسکرول نرم برای نمایش قدرتمند پروژه‌ها و جذب مشتریان سازمانی.",
    },
    {
      file: "proj-6.jpg",
      title: "بسته‌بندی محصولات ارگانیک «طبیعت سبز»",
      tag: "برندینگ",
      year: "۱۴۰۳",
      client: "صنایع غذایی طبیعت سبز",
      tools: "Illustrator · Packaging",
      description: "طراحی سری بسته‌بندی پاکت ایستاده و جعبه هدیه دمنوش‌های گیاهی ارگانیک با تصویرسازی اختصاصی گیاهان دارویی و تفکیک رنگی هوشمند در قفسه فروشگاه.",
    },
  ],
  process: [
    { step: "۰۱", title: "مشاوره رایگان و کشف نیاز", desc: "بررسی دقیق اهداف کسب‌وکار شما، شناخت مخاطب هدف، تحلیل رقبا و تعیین بهترین نقشه راه و زمان‌بندی پروژه." },
    { step: "۰۲", title: "معماری بصری و اتود اولیه", desc: "ایده‌پردازی خلاقانه، طراحی وایرفریم یا اتودهای اولیه هویت بصری و هم‌فکری با شما برای رسیدن به بهترین مسیر." },
    { step: "۰۳", title: "اجرای دقیق و ظرافت‌کاری", desc: "پیاده‌سازی نهایی با بالاترین استاندارد گرافیکی و فنی، همراه با ارائه پیش‌نمایش زنده و اعمال بازخوردهای شما." },
    { step: "۰۴", title: "تحویل استاندارد و پشتیبانی", desc: "ارائه کامل فایل‌های سورس و لایه‌باز، راه‌اندازی نهایی، آموزش کار با پنل و پشتیبانی واقعی پس از تحویل." },
  ],
  testimonials: [
    { name: "امیرحسین رضایی", role: "مدیر فروشگاه اینترنتی استایلند", quote: "همکاری با آقای میدانی تجربه فوق‌العاده‌ای بود. علاوه بر سلیقه گرافیکی عالی، درک دقیقی از فروش آنلاین داشتند و سایت جدیدمان هم خیلی سریع‌تر شده و هم اعتماد مشتریان دوچندان شده است.", rating: 5 },
    { name: "سارا محمدی", role: "بنیان‌گذار کافه تخصصی رستا", quote: "از لوگو تا بسته‌بندی پاکت‌های قهوه‌مان را به رسانه میم سپردیم. نتیجه کار دقیقاً همان حس اصالت و گرمایی بود که دنبالش بودیم و بازخورد مشتری‌هایمان بی‌نظیر بوده.", rating: 5 },
    { name: "کاوه نادری", role: "مدیر محصول استارتاپ فین‌تک", quote: "نظم در زمان‌بندی، تحویل دیزاین سیستم تمیز در فیگما و حوصله بالا در جلسات بازبینی باعث شد تیم فنی ما بدون هیچ ابهامی رابط کاربری اپلیکیشن را پیاده‌سازی کند.", rating: 5 },
  ],
  contact: {
    eyebrow: "شروع یک همکاری ماندگار",
    heading: "پروژه بعدی که همه درباره‌اش صحبت می‌کنند، مال شماست",
    lead: "فرم هوشمند زیر را تکمیل کنید یا مستقیماً از طریق تماس، واتساپ یا تلگرام پیام دهید؛ معمولاً در کمتر از ۲ ساعت پاسخگوی شما هستم.",
    phone: "09399887950",
    id: "@Resane_miim",
    email: "resane.Miim@gmail.com",
    address: "خراسان جنوبی، شهرستان خوسف، روستای تقاب",
    formspree: "https://formspree.io/f/mbdvppnp",
    platforms: [
      { key: "rubika", label: "روبیکا", url: "https://rubika.ir/MIIM_DEV" },
      { key: "instagram", label: "اینستاگرام", url: "https://instagram.com/Resane_miim" },
      { key: "telegram", label: "تلگرام", url: "https://t.me/Resane_miim" },
      { key: "whatsapp", label: "واتساپ", url: "https://wa.me/989399887950" },
    ],
  },
  footer: {
    legal: "© تمامی حقوق مادی و معنوی این وب‌سایت متعلق به استودیو خلاقیت «رسانه میم» (مجتبی میدانی) است.",
  },
};

(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const fa = (v) => String(v).replace(/\d/g, (d) => FA[+d]);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let SITE = JSON.parse(JSON.stringify(DEFAULT_SITE));
  let scrollVelocity = 0;

  const imgSrc = (file) => {
    if (!file) return "";
    if (window.MiimContent && file.startsWith(window.MiimContent.MEDIA)) { try { return window.MiimContent.image(file); } catch { return ""; } }
    if (window.PF && window.PF.blobs && window.PF.blobs[file]) return window.PF.blobs[file];
    return (SITE.imagesPath || "Image/") + file.split("/").map(encodeURIComponent).join("/");
  };

  const SRV_ICONS = {
    code: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-10-4 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    layers: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pen: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 19l7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5ZM2 2l7.5 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="11" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="4" width="18" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/></svg>',
  };

  const SOCIAL_ICONS = {
    rubika: '<img class="social-pill__icon" src="Image/rubika.png" width="22" height="22" alt="" aria-hidden="true" draggable="false">',
    instagram: '<svg viewBox="0 0 24 24" width="17" height="17"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M20.5 4.5 3.8 11.1c-.9.4-.9 1.1 0 1.4l4.2 1.3 1.6 5c.2.5.8.6 1.2.2l2.3-2.1 4.4 3.2c.6.4 1.3.1 1.5-.7l3-14c.2-.9-.6-1.4-1.5-.9Z" fill="currentColor"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" width="17" height="17"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 10.5v5.5M8 7.9v.1M11.5 16v-5.5m0 2.6c0-1.6 1-2.6 2.4-2.6s2.1 1 2.1 2.6V16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    behance: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M3.5 7.5h5a2.3 2.3 0 0 1 0 4.5h-5zm0 4.5h5.6a2.4 2.4 0 0 1 0 4.8H3.5zM14 8.2h5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    dribbble: '<svg viewBox="0 0 24 24" width="17" height="17"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M5 4.5 19 19.5M19 4.5 5 19.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" width="17" height="17"><rect x="3" y="6" width="18" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m10.5 9.6 4 2.4-4 2.4z" fill="currentColor"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  };

  /* ---------- دریافت داده‌ها از data.json و اتاق فرمان ---------- */
  function mergeData(d) {
    if (!d || typeof d !== "object") return;
    if (d.theme === "light" || d.theme === "dark") SITE.theme = d.theme;
    if (d.identity && typeof d.identity === "object") Object.assign(SITE.identity, d.identity);
    if (Array.isArray(d.stats)) SITE.stats = d.stats;
    if (d.about && typeof d.about === "object") Object.assign(SITE.about, d.about);
    if (Array.isArray(d.services)) SITE.services = d.services;
    if (Array.isArray(d.skills)) SITE.skills = d.skills;
    // نمونه‌کارهای رابط کاربری در داده‌های ذخیره‌شده‌ی قدیمی هم نمایش داده نشوند.
    if (Array.isArray(d.works)) {
      SITE.works = d.works
        .filter((w) => w.visible !== false && (w.tag || "").trim() !== "رابط کاربری")
        .map((w) => ({
          ...w,
          // نسخه‌های محلی قدیمی ممکن است هنوز فیلد لینک پروژه را نداشته باشند.
          url: w.url ?? DEFAULT_SITE.works.find((item) => item.file === w.file)?.url ?? "",
        }));
    }
    if (Array.isArray(d.process)) SITE.process = d.process;
    if (Array.isArray(d.testimonials)) SITE.testimonials = d.testimonials;
    if (d.contact && typeof d.contact === "object") Object.assign(SITE.contact, d.contact);
    if (d.footer && typeof d.footer === "object") Object.assign(SITE.footer, d.footer);
    if (d.seo && typeof d.seo === "object") SITE.seo = d.seo;
  }

  async function loadStudioData() {
    let remote = null;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch("data.json", { cache: "no-store", signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) remote = await r.json();
    } catch {}
    // Cloud is authoritative; old local drafts must never override published content.
    if (window.MiimCloud) {
      try {
        const cloud = await window.MiimCloud.read(2500);
        if (cloud?.data) { mergeData(remote); mergeData(cloud.data); return; }
      } catch { /* Public site remains available from the checked-in snapshot. */ }
      if (remote) { mergeData(remote); return; }
      return;
    }
    const loc = window.PF ? window.PF.readLocal() : null;
    const chosen = (loc && (!remote || String(loc.updatedAt || "") > String(remote.updatedAt || ""))) ? loc : remote;
    if (chosen) {
      mergeData(chosen);
      if (window.PF) {
        const files = [SITE.identity.photo, SITE.identity.logo, ...SITE.works.map((w) => w.file)].filter(Boolean);
        await window.PF.attachBlobs(files);
      }
    }
  }

  /* ---------- اعلان کوچک (Toast) ---------- */
  let toastTimer = 0;
  function showToast(msg) {
    const el = $("#site-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-in");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-in"), 2600);
  }

  /* ---------- تم تاریک / روشن ---------- */
  function applyTheme(t, persist = false) {
    const theme = t === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#faf7f1" : "#070709");
    if (persist) {
      try { localStorage.setItem("miim:theme", theme); } catch {}
    }
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("miim:theme"); } catch {}
    applyTheme(saved || SITE.theme || "dark", false);
    $("#theme-toggle")?.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "light" ? "dark" : "light";
      applyTheme(next, true);
      showToast(next === "light" ? "تم روشن مجله‌ای فعال شد" : "تم تاریک مشکی-طلایی فعال شد");
    });
  }

  /* ---------- رندر کلمه به کلمه سینمایی تیتر هیرو ---------- */
  function renderMaskedHeroTitle(fullText, accentText) {
    const h1 = $("#hero-title");
    if (!h1) return;
    const full = (fullText || "").trim();
    const acc = (accentText || "").trim();

    let segments = [{ text: full, gold: false }];
    if (acc && full.includes(acc)) {
      const idx = full.indexOf(acc);
      segments = [
        { text: full.slice(0, idx), gold: false },
        { text: acc, gold: true },
        { text: full.slice(idx + acc.length), gold: false },
      ].filter((s) => s.text.trim());
    }

    let wIdx = 0;
    h1.innerHTML = segments.map((seg) => {
      const words = seg.text.trim().split(/\s+/);
      return words.map((w) => {
        const delay = (0.08 + wIdx++ * 0.065).toFixed(2);
        const cls = seg.gold ? "word-inner hero__title-gold" : "word-inner";
        return `<span class="word-mask"><span class="${cls}" style="--wd:${delay}s">${esc(w)}</span></span>`;
      }).join(" ");
    }).join(" ");
  }

  /* ---------- رندر بخش‌ها ---------- */
  function renderIdentityAndHero() {
    const id = SITE.identity;
    const map = {
      brand: id.brand,
      name: id.name,
      roleFa: id.roleFa,
      roleEn: id.roleEn,
      availability: id.availability,
      heroEyebrow: id.heroEyebrow,
      heroBio: id.heroBio,
      aboutEyebrow: SITE.about.eyebrow,
      aboutHeading: SITE.about.heading,
      aboutText: SITE.about.text,
      contactEyebrow: SITE.contact.eyebrow,
      contactHeading: SITE.contact.heading,
      contactLead: SITE.contact.lead,
    };
    $$("[data-bind]").forEach((el) => {
      if (map[el.dataset.bind] !== undefined) el.textContent = map[el.dataset.bind];
    });

    renderMaskedHeroTitle(id.heroTitle, id.heroAccent);

    const availPill = $("#availability-pill");
    const availDot = $("#hero-avail-dot");
    if (availPill) {
      availPill.style.background = id.available !== false ? "rgba(34, 197, 94, 0.14)" : "rgba(224, 175, 83, 0.16)";
      availPill.style.color = id.available !== false ? "var(--ok)" : "var(--gold)";
    }
    if (availDot) availDot.classList.toggle("eyebrow-pill__dot--live", id.available !== false);

    const logoUrl = imgSrc(id.logo || "logo.png");
    ["#loader-logo", "#nav-logo", "#badge-logo", "#footer-logo"].forEach((sel) => {
      const img = $(sel);
      if (img) img.src = logoUrl;
    });
    const heroPhoto = $("#hero-photo");
    if (heroPhoto) {
      heroPhoto.src = imgSrc(id.photo || "My-photo.png");
      heroPhoto.alt = `${id.name} — ${id.brand}`;
    }
    document.title = SITE.seo?.title || `${id.brand} | ${id.name} — ${id.roleFa}`;
    const description = SITE.seo?.description || id.heroBio;
    $('meta[name="description"]')?.setAttribute('content', description);
    $('meta[property="og:description"]')?.setAttribute('content', description);
    $('meta[property="og:title"]')?.setAttribute('content', document.title);

    const strip = $("#stats-strip");
    if (strip) {
      strip.innerHTML = SITE.stats.map((s) => {
        const num = s.dynamicWorks ? SITE.works.length : (+s.value || 0);
        return `
          <div class="stat-card">
            <span class="stat-card__val" data-count="${num}" data-prefix="${esc(s.prefix || "")}" data-suffix="${esc(s.suffix || "")}">${esc(s.prefix || "")}۰${esc(s.suffix || "")}</span>
            <span class="stat-card__lbl">${esc(s.label)}</span>
          </div>`;
      }).join("");
    }
  }

  function renderAboutAndSkills() {
    const pillars = $("#about-pillars");
    if (pillars) {
      pillars.innerHTML = (SITE.about.highlights || []).map((h) => `
        <li class="pillar">
          <span class="pillar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="m5 12 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span>${esc(h)}</span>
        </li>`).join("");
    }

    const slist = $("#skills-list");
    if (slist) {
      slist.innerHTML = SITE.skills.map((s) => {
        const p = clamp(Math.round(+s.percent || 0), 0, 100);
        return `
          <div class="skill-row">
            <div class="skill-row__top">
              <span class="skill-row__name">${esc(s.name)}</span>
              <span class="skill-row__meta">
                ${s.tag ? `<span class="skill-row__tag" dir="ltr">${esc(s.tag)}</span>` : ""}
                <span class="skill-row__pct" data-count="${p}" data-suffix="٪">۰٪</span>
              </span>
            </div>
            <div class="skill-row__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}">
              <span class="skill-row__fill" data-width="${p}"></span>
            </div>
          </div>`;
      }).join("");
    }
  }

  function renderServices() {
    const grid = $("#services-grid");
    if (!grid) return;
    grid.innerHTML = SITE.services.map((srv, i) => `
      <article class="srv-card" data-tilt data-cinematic style="--cd:${(i * 0.09).toFixed(2)}s">
        <span class="card-glare" aria-hidden="true"></span>
        <div class="srv-card__head">
          <span class="srv-card__icon">${SRV_ICONS[srv.icon] || SRV_ICONS.layers}</span>
          ${srv.badge ? `<span class="srv-card__badge">${esc(srv.badge)}</span>` : ""}
        </div>
        <div>
          <h3 class="srv-card__title">${esc(srv.title)}</h3>
          <div class="srv-card__sub" dir="ltr">${esc(srv.subtitle || "")}</div>
        </div>
        <p class="srv-card__desc">${esc(srv.description)}</p>
        <div class="srv-card__chips">
          ${(srv.deliverables || []).map((d) => `<span class="srv-chip">${esc(d)}</span>`).join("")}
        </div>
        <button class="srv-card__cta" type="button" data-select-service="${esc(srv.title)}">
          <span>سفارش این خدمت</span>
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 12H5m0 0 6-6m-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </article>`).join("");

    const chips = $("#service-chips");
    if (chips) {
      const titles = SITE.services.length ? SITE.services.map(s => s.title) : ['مشاوره و راهنمایی'];
      const selected = $("#selected-service").value;
      const active = titles.includes(selected) ? selected : titles[0];
      chips.innerHTML = titles.map(title => `<button type="button" class="choice-chip ${title === active ? 'is-selected' : ''}" data-val="${esc(title)}">${esc(title)}</button>`).join('');
      $("#selected-service").value = active;
    }
    $$("[data-select-service]", grid).forEach((btn) => {
      btn.addEventListener("click", () => preselectServiceAndScroll(btn.dataset.selectService));
    });
  }

  function renderProcessAndTestimonials() {
    const pgrid = $("#process-grid");
    if (pgrid) {
      pgrid.innerHTML = SITE.process.map((st, i) => `
        <article class="step-card" data-tilt data-cinematic style="--cd:${(i * 0.08).toFixed(2)}s">
          <span class="card-glare" aria-hidden="true"></span>
          <span class="step-card__num">${esc(st.step || fa("0" + (i + 1)))}</span>
          <h3 class="step-card__title">${esc(st.title)}</h3>
          <p class="step-card__desc">${esc(st.desc)}</p>
        </article>`).join("");
    }

    const tsec = $("#testimonials");
    const tgrid = $("#testi-grid");
    if (tgrid && tsec) {
      if (!SITE.testimonials || !SITE.testimonials.length) {
        tsec.hidden = true;
      } else {
        tsec.hidden = false;
        tgrid.innerHTML = SITE.testimonials.map((t, i) => {
          const stars = "★".repeat(clamp(+t.rating || 5, 1, 5));
          const initial = (t.name || "م").trim().charAt(0);
          return `
            <article class="testi-card" data-tilt data-cinematic style="--cd:${(i * 0.09).toFixed(2)}s">
              <span class="card-glare" aria-hidden="true"></span>
              <div>
                <div class="testi-card__stars" aria-label="امتیاز ۵ از ۵">${stars}</div>
                <p class="testi-card__quote" style="margin-top:10px">«${esc(t.quote)}»</p>
              </div>
              <div class="testi-card__author">
                <span class="testi-card__avatar">${esc(initial)}</span>
                <div>
                  <div class="testi-card__name">${esc(t.name)}</div>
                  <div class="testi-card__role">${esc(t.role || "")}</div>
                </div>
              </div>
            </article>`;
        }).join("");
      }
    }
  }

  function renderContactAndFooter() {
    const c = SITE.contact;
    const digits = String(c.phone || "").replace(/\D/g, "");
    const intl = digits.startsWith("0") ? "+98" + digits.slice(1) : "+" + digits;
    const pretty = digits.length === 11
      ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
      : digits;

    const pLink = $("#c-phone-link");
    if (pLink) { pLink.href = `tel:${intl}`; pLink.textContent = fa(pretty); }
    const idTxt = $("#c-id-text");
    if (idTxt) idTxt.textContent = c.id ? (c.id.startsWith("@") ? c.id : "@" + c.id) : "—";
    const mLink = $("#c-mail-link");
    if (mLink) { mLink.href = `mailto:${c.email || ""}`; mLink.textContent = c.email || "—"; }

    const addrCard = $("#address-card");
    const addrTxt = $("#c-address-text");
    if (addrCard && addrTxt) {
      addrCard.hidden = !c.address;
      if (c.address) addrTxt.textContent = c.address;
    }

    const orderForm = $("#order-form");
    if (orderForm) orderForm.action = 'https://icpuwsultralrxbeukqw.supabase.co/functions/v1/miim-rubika';

    const waDigits = intl.replace("+", "");
    const quickWa = $("#quick-wa");
    if (quickWa) quickWa.href = `https://wa.me/${waDigits}?text=${encodeURIComponent("سلام آقای میدانی، از وب‌سایت رسانه میم برای مشاوره پروژه پیام می‌دهم.")}`;

    const slinks = $("#social-links");
    if (slinks) {
      slinks.innerHTML = (c.platforms || []).map((p) => {
        const icon = SOCIAL_ICONS[p.key] || SOCIAL_ICONS.link;
        let url = p.url || "";
        if (!url && p.key === "whatsapp") url = `https://wa.me/${waDigits}`;
        url = projectSiteUrl(url);
        if (!url) return "";
        return `<a class="social-pill" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon}<span>${esc(p.label)}</span></a>`;
      }).join("");
    }

    $("#footer-legal").textContent = SITE.footer?.legal || "";
    const faYear = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric" }).format(new Date()).replace(/\D/g, "");
    $("#footer-year").textContent = `سال ${fa(faYear)} خورشیدی`;
  }

  /* ---------- انتخاب بخش فعال (تابع خالص، بدون دسترسی به DOM) ---------- */
  function pickActiveSection(tops, probe, atBottom, fallback) {
    let id = fallback;
    for (const item of tops) {
      if (item.top === null || item.top === undefined) continue;
      if (probe >= item.top) id = item.id;
    }
    if (atBottom) {
      for (const item of tops) if (item.top !== null && item.top !== undefined) id = item.id;
    }
    return id;
  }

  /* ---------- هدر کپسولی: هندسه‌ی کش‌شده، scroll-spy با rAF و قرص بدون layout thrash ---------- */
  function initSmoothHeader() {
    const header = $(".site-header");
    const menu = $(".nav__menu");
    const pill = $(".nav__pill");
    const nav = $(".nav");
    const links = $$(".nav__link");
    if (!links.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const items = links.map((link) => {
      const href = link.getAttribute("href") || "";
      return { id: href.slice(1), link, section: $(href), top: null };
    });
    const boxes = links.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));
    let maxScroll = 1;
    let currentId = null;
    let previewed = null;
    let lockedId = null;
    let lockTimer = 0;
    let spyQueued = false;
    let measureQueued = false;

    const activeLink = () => links.find((l) => l.classList.contains("is-active")) || links[0];

    /* style writes only (no layout reads) */
    const paintPill = (link) => {
      if (!pill || !link) return;
      const box = boxes[links.indexOf(link)];
      if (!box || !box.w) return;
      pill.style.width = box.w + "px";
      if (box.h) pill.style.height = box.h + "px";   // rows can wrap on phones
      pill.style.transform = `translate(${box.x}px, ${box.y}px)`;
      pill.style.opacity = "1";
    };

    const setActive = (id) => {
      if (!id || id === currentId) return false;
      currentId = id;
      for (const l of links) {
        const on = l.dataset.nav === id;
        l.classList.toggle("is-active", on);
        if (on) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      }
      // On narrow screens the menu scrolls horizontally: keep the active pill reachable.
      if (menu && menu.scrollWidth > menu.clientWidth + 4) {
        const link = links.find((l) => l.dataset.nav === id);
        if (link && typeof link.scrollIntoView === "function") link.scrollIntoView({ block: "nearest", inline: "center" });
      }
      return true;
    };

    /* one rAF per scroll burst; reads scrollY only, never the layout */
    const spy = () => {
      spyQueued = false;
      if (document.hidden || lockedId) return;
      const hadPreview = previewed !== null;
      previewed = null;                                  // scrolling wins over the hover preview
      const y = window.scrollY;
      const id = pickActiveSection(items, y + window.innerHeight * 0.38, y >= maxScroll - 4, items[0]?.id || "hero");
      const changed = setActive(id);
      if (changed || hadPreview) paintPill(activeLink());
    };

    const queueSpy = () => {
      if (spyQueued || lockedId) return;
      spyQueued = true;
      requestAnimationFrame(spy);
    };

    /* the only routine that forces layout: resize / font load / content resize */
    const measure = () => {
      measureQueued = false;
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      for (const item of items) {
        item.top = item.section ? Math.round(item.section.getBoundingClientRect().top + window.scrollY) : null;
      }
      links.forEach((link, i) => {
        boxes[i] = { x: link.offsetLeft, y: link.offsetTop, w: link.offsetWidth, h: link.offsetHeight };
      });
      if (header) {
        const h = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--header-offset", Math.round(h + 18) + "px");
      }
      paintPill(previewed || activeLink());
    };

    const queueMeasure = () => {
      if (measureQueued) return;
      measureQueued = true;
      requestAnimationFrame(measure);
    };

    const releaseLock = () => {
      clearTimeout(lockTimer);
      if (!lockedId) return;
      lockedId = null;
      queueMeasure();
      queueSpy();
    };

    const jumpTo = (link, target) => {
      if (!target) return;
      previewed = link;
      paintPill(link);
      setActive(items[links.indexOf(link)].id);          // click wins immediately
      lockedId = items[links.indexOf(link)].id;          // ...and the spy stays quiet until the scroll ends
      clearTimeout(lockTimer);
      lockTimer = setTimeout(releaseLock, 1600);
      const behavior = reduceMotion.matches ? "auto" : "smooth";
      if (target.id === "hero") {
        window.scrollTo({ top: 0, behavior });
      } else if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior, block: "start" });     // the offset comes from CSS scroll-margin-top
      } else {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior });
      }
    };

    links.forEach((link, i) => {
      link.addEventListener("click", (e) => {
        if (!items[i].section) return;
        e.preventDefault();
        jumpTo(link, items[i].section);
      });
    });

    /* delegated hover/focus preview: cached geometry, so moving the pointer triggers no reflow */
    menu?.addEventListener("pointerover", (e) => {
      const link = e.target instanceof Element ? e.target.closest(".nav__link") : null;
      if (!link || lockedId) return;
      previewed = link;
      paintPill(link);
    });
    menu?.addEventListener("pointerleave", () => {
      previewed = null;
      paintPill(activeLink());
    });
    menu?.addEventListener("focusin", (e) => {
      const link = e.target instanceof Element ? e.target.closest(".nav__link") : null;
      if (!link) return;
      previewed = link;
      paintPill(link);
    });
    menu?.addEventListener("focusout", () => {
      previewed = null;
      paintPill(activeLink());
    });

    $(".nav__brand")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });

    window.addEventListener("scroll", queueSpy, { passive: true });
    window.addEventListener("scrollend", releaseLock, { passive: true });
    window.addEventListener("resize", queueMeasure);
    window.addEventListener("orientationchange", queueMeasure);
    window.addEventListener("load", queueMeasure, { once: true });
    document.fonts?.ready.then(queueMeasure);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      queueMeasure();
      queueSpy();
    });
    if ("ResizeObserver" in window && nav) {
      // Fonts, images and cloud content change the nav width and the section offsets.
      const ro = new ResizeObserver(queueMeasure);
      ro.observe(nav);
      ro.observe(document.body);
    }

    measure();
    queueSpy();
  }

  /* ---------- بودجه‌ی حرکت: بخش‌های بیرون از دید انیمیشن اجرا نمی‌کنند ---------- */
  function initMotionBudget() {
    if (!("IntersectionObserver" in window)) return;
    const zones = [$("#hero"), $(".orbit-portal")].filter(Boolean);
    if (!zones.length) return;
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) en.target.removeAttribute("data-motion-paused");
        else en.target.setAttribute("data-motion-paused", "");
      }
    }, { rootMargin: "160px 0px" });
    zones.forEach((zone) => io.observe(zone));
  }

  /* ---------- دکمه‌های مغناطیسی نرم ---------- */
  function bindMagnetic() {
    if (!FINE_POINTER) return;
    $$("[data-magnetic]:not([data-mag-bound])").forEach((el) => {
      el.dataset.magBound = "1";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.24;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- چرخش سه‌بعدی کارت‌ها و درخشش نوری (3D Specular Tilt) ---------- */
  function bindTiltCards() {
    if (!FINE_POINTER) return;
    $$("[data-tilt]:not([data-tilt-bound])").forEach((card) => {
      card.dataset.tiltBound = "1";
      let rx = 0, ry = 0, cx = 0, cy = 0, raf = 0;
      const tick = () => {
        cx = lerp(cx, rx, 0.12);
        cy = lerp(cy, ry, 0.12);
        card.style.transform = `perspective(1000px) rotateX(${cx.toFixed(2)}deg) rotateY(${cy.toFixed(2)}deg) translateZ(0)`;
        if (Math.abs(cx - rx) > 0.04 || Math.abs(cy - ry) > 0.04) raf = requestAnimationFrame(tick);
        else {
          raf = 0;
          if (rx === 0 && ry === 0) card.style.transform = "";
        }
      };
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
        rx = (0.5 - py) * 7;
        ry = (px - 0.5) * 7;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      card.addEventListener("pointerleave", () => {
        rx = 0; ry = 0;
        if (!raf) raf = requestAnimationFrame(tick);
      });
    });
  }

  /* ---------- نشانگر ماوس سینمایی + هاله طلایی ---------- */
  function initCinemaCursor() {
    if (!FINE_POINTER) return;
    const dot = $("#cursor-dot");
    const ring = $("#cursor-ring");
    const glow = $("#cursor-glow");
    const txt = $("#cursor-txt");
    if (!dot || !ring || !glow) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my, gx = mx, gy = my;
    let visible = false;
    let cursorRaf = 0;

    const loop = () => {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      gx = lerp(gx, mx, 0.065);
      gy = lerp(gy, my, 0.065);
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
      // The follower ring only needs frames while it is still travelling towards the pointer.
      const settled = Math.abs(rx - mx) < 0.2 && Math.abs(ry - my) < 0.2 && Math.abs(gx - mx) < 0.2 && Math.abs(gy - my) < 0.2;
      if (settled) { cursorRaf = 0; return; }
      cursorRaf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!cursorRaf && !document.hidden) cursorRaf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        glow.style.opacity = "1";
      }
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;

      const workTarget = e.target.closest(".stage-card, .work-tile");
      const interactive = e.target.closest("a, button, input, textarea, select, .choice-chip, .filter-tab");
      if (workTarget) {
        ring.classList.add("is-view");
        ring.classList.remove("is-hover");
        if (txt) txt.textContent = "مشاهده";
        dot.style.opacity = "0";
      } else if (interactive) {
        ring.classList.add("is-hover");
        ring.classList.remove("is-view");
        dot.style.opacity = "1";
      } else {
        ring.classList.remove("is-hover", "is-view");
        dot.style.opacity = "1";
      }
      wake();
    }, { passive: true });
  }

  /* ---------- بوم ذرات طلایی معلق در فضا (Ambient Gold Dust Canvas) ---------- */
  function initGoldCanvas() {
    const canvas = $("#cinema-canvas");
    if (!canvas) return;
    // Ambient dust is decoration: only spend frames on precise pointers, healthy CPUs,
    // enough device memory and when the visitor has not asked for reduced motion.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cores = navigator.hardwareConcurrency || 0;
    const memory = navigator.deviceMemory || 0;
    if (!fine || calm || cores <= 4 || memory <= 4) {
      canvas.style.display = "none";
      return;
    }
    let ctx = null;
    try { ctx = canvas.getContext("2d"); } catch { return; }
    if (!ctx) return;
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = Math.min(26, Math.max(14, Math.floor(window.innerWidth / 60)));
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.9 + Math.random() * 2.4,
      vy: -(0.18 + Math.random() * 0.42),
      vx: (Math.random() - 0.5) * 0.25,
      a: 0.14 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
    }));

    let dustRaf = 0;
    const draw = (now) => {
      {
        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        const rgb = isLight ? "180, 125, 30" : "224, 175, 83";
        const boost = clamp(scrollVelocity * 0.08, -3.5, 3.5);

        for (const p of particles) {
          p.phase += 0.015;
          p.x += p.vx + Math.sin(p.phase) * 0.18;
          p.y += p.vy - boost;
          if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
          if (p.y > h + 12) { p.y = -12; p.x = Math.random() * w; }
          if (p.x < -12) p.x = w + 12;
          if (p.x > w + 12) p.x = -12;

          const alpha = p.a * (0.65 + 0.35 * Math.sin(now * 0.002 + p.phase));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }
      dustRaf = requestAnimationFrame(draw);
    };
    const startDust = () => {
      if (dustRaf || document.hidden) return;
      dustRaf = requestAnimationFrame(draw);
    };
    const stopDust = () => {
      if (!dustRaf) return;
      cancelAnimationFrame(dustRaf);
      dustRaf = 0;
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopDust();
      else startDust();
    });
    startDust();
  }

  /* ---------- ویترین ترکیبی نمونه کارها با موتور فیزیک اینرسی 60fps ---------- */
  let activeCategory = "ALL";
  let viewMode = "stage";
  let filteredWorks = [];
  let stageIdx = 0;
  let stageTarget = 0;
  let stageCurrent = 0;
  let stageRaf = 0;
  let stageCards = [];
  let modalIdx = 0;

  function getFilteredWorks() {
    if (activeCategory === "ALL") return SITE.works.map((w, idx) => ({ ...w, _orig: idx }));
    return SITE.works.map((w, idx) => ({ ...w, _orig: idx })).filter((w) => (w.tag || "").trim() === activeCategory);
  }

  function renderFilterTabs() {
    if (activeCategory !== "ALL" && !SITE.works.some(w => (w.tag || "").trim() === activeCategory)) activeCategory = "ALL";
    const wrap = $("#filter-tabs");
    if (!wrap) return;
    const counts = new Map();
    SITE.works.forEach((w) => {
      const t = (w.tag || "سایر").trim();
      counts.set(t, (counts.get(t) || 0) + 1);
    });

    let html = `<button class="filter-tab ${activeCategory === "ALL" ? "is-active" : ""}" type="button" data-cat="ALL">
      <span>همه آثار</span><span class="filter-tab__cnt">(${fa(SITE.works.length)})</span>
    </button>`;
    for (const [cat, cnt] of counts.entries()) {
      html += `<button class="filter-tab ${activeCategory === cat ? "is-active" : ""}" type="button" data-cat="${esc(cat)}">
        <span>${esc(cat)}</span><span class="filter-tab__cnt">(${fa(cnt)})</span>
      </button>`;
    }
    wrap.innerHTML = html;

    $$(".filter-tab", wrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        stageIdx = 0;
        stageTarget = 0;
        stageCurrent = 0.35; // انیمیشن نرم ورود هنگام تغییر دسته
        renderFilterTabs();
        rebuildWorksShowcase();
      });
    });
  }

  function renderStageFrame(p) {
    const n = stageCards.length;
    if (!n) return;
    const vp = $("#stage-viewport");
    const vw = vp.clientWidth || 840;
    const DIR = -1; // RTL

    stageCards.forEach((el, i) => {
      const d = i - p;
      const k = Math.abs(d);
      if (k > 2.8) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.transform = `translate3d(${Math.sign(d) * DIR * vw * 0.65}px, 0, -320px) scale(0.62)`;
        return;
      }
      const x = d * DIR * Math.min(vw * 0.33, 300);
      const scale = Math.max(0.66, 1 - k * 0.145);
      const rotY = clamp(d * DIR * 22, -34, 34);
      const z = -k * 130;
      const op = k < 0.25 ? 1 : Math.max(0.22, 0.78 - (k - 1) * 0.28);

      el.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateY(${rotY.toFixed(2)}deg)`;
      el.style.opacity = op.toFixed(3);
      // Depth now comes from scale/opacity only: a per-frame filter blur forced a repaint per card.
      const depth = String(Math.round(30 - k * 6));
      if (el.style.zIndex !== depth) el.style.zIndex = depth;
      if (el.style.pointerEvents !== "auto") el.style.pointerEvents = "auto";
      el.classList.toggle("is-active", i === stageIdx);
    });
  }

  function pumpStagePhysics() {
    if (stageRaf) return;
    const step = () => {
      stageCurrent = lerp(stageCurrent, stageTarget, 0.092);
      renderStageFrame(stageCurrent);
      if (Math.abs(stageCurrent - stageTarget) > 0.0015) {
        stageRaf = requestAnimationFrame(step);
      } else {
        stageCurrent = stageTarget;
        renderStageFrame(stageCurrent);
        stageRaf = 0;
      }
    };
    stageRaf = requestAnimationFrame(step);
  }

  function updateStageBar() {
    const n = filteredWorks.length;
    if (!n) return;
    const cur = filteredWorks[stageIdx] || filteredWorks[0];
    $("#stage-counter").textContent = `${fa(stageIdx + 1)} از ${fa(n)}`;
    $("#stage-active-title").textContent = cur.title || cur.tag || "";
    $("#stage-active-sub").textContent = [cur.client, cur.year ? `سال ${fa(cur.year)}` : ""].filter(Boolean).join(" • ");

    const thumb = $("#stage-thumb");
    if (thumb) {
      const w = 100 / n;
      thumb.style.width = `${w}%`;
      thumb.style.transform = `translateX(${-stageIdx * 100}%)`;
    }
  }

  function goStage(idx) {
    const n = filteredWorks.length;
    if (!n) return;
    stageIdx = clamp(idx, 0, n - 1);
    stageTarget = stageIdx;
    updateStageBar();
    pumpStagePhysics();
  }

  function rebuildWorksShowcase() {
    filteredWorks = getFilteredWorks();
    const stageWrap = $("#works-stage-wrap");
    const bentoWrap = $("#works-bento");
    const vp = $("#stage-viewport");

    stageWrap.hidden = viewMode !== "stage" || !filteredWorks.length;
    bentoWrap.hidden = viewMode !== "grid" || !filteredWorks.length;
    let empty = $("#works-empty");
    if (!empty) { empty = document.createElement('p'); empty.id='works-empty';empty.style.cssText='text-align:center;padding:40px;color:var(--txt-3)';empty.textContent='هنوز نمونه‌کاری در این دسته منتشر نشده است.';stageWrap.before(empty); }
    empty.hidden = filteredWorks.length > 0;

    $$(".stage-card", vp).forEach((el) => el.remove());
    stageCards = filteredWorks.map((w, i) => {
      const el = document.createElement("article");
      el.className = "stage-card";
      el.dataset.i = String(i);
      el.innerHTML = `
        <img src="${esc(imgSrc(w.file))}" alt="${esc(w.title || w.tag)}" draggable="false" decoding="async">
        <div class="stage-card__overlay">
          <div>
            <span class="stage-card__tag">${esc(w.tag)}</span>
            <h3 class="stage-card__title">${esc(w.title || w.tag)}</h3>
          </div>
          <span class="stage-card__open" title="مشاهده جزئیات کامل">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 3h6v6M21 3l-8 8M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>`;
      vp.appendChild(el);
      return el;
    });

    stageIdx = clamp(stageIdx, 0, Math.max(0, filteredWorks.length - 1));
    stageTarget = stageIdx;
    updateStageBar();
    pumpStagePhysics();

    bentoWrap.innerHTML = filteredWorks.map((w, i) => {
      const wide = i % 5 === 0 || i % 5 === 3;
      return `
        <article class="work-tile ${wide ? "work-tile--wide" : ""}" style="--ti:${i}" data-case-i="${i}">
          <div class="work-tile__media">
            <img src="${esc(imgSrc(w.file))}" alt="${esc(w.title || w.tag)}" loading="lazy" decoding="async">
            <span class="work-tile__badge">${esc(w.tag)}</span>
          </div>
          <div class="work-tile__body">
            <div>
              <h3 class="work-tile__title">${esc(w.title || w.tag)}</h3>
              <p class="work-tile__desc">${esc(w.description || "")}</p>
            </div>
            <div class="work-tile__foot">
              <span dir="ltr">${esc(w.tools || w.year || "")}</span>
              <span class="work-tile__more">مشاهده پروژه ←</span>
            </div>
          </div>
        </article>`;
    }).join("");

    $$("[data-case-i]", bentoWrap).forEach((card) => {
      card.addEventListener("click", () => openCaseModal(+card.dataset.caseI));
    });
  }

  function initWorksInteractions() {
    $$(".view-switch__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        viewMode = btn.dataset.view;
        $$(".view-switch__btn").forEach((b) => b.classList.toggle("is-active", b === btn));
        rebuildWorksShowcase();
      });
    });

    const vp = $("#stage-viewport");
    $("#stage-prev")?.addEventListener("click", (e) => {
      e.stopPropagation();
      goStage(stageIdx > 0 ? stageIdx - 1 : filteredWorks.length - 1);
    });
    $("#stage-next")?.addEventListener("click", (e) => {
      e.stopPropagation();
      goStage(stageIdx < filteredWorks.length - 1 ? stageIdx + 1 : 0);
    });
    $("#stage-open-case")?.addEventListener("click", () => openCaseModal(stageIdx));

    // کشیدن با اینرسی فیزیکی (Inertial Flick Drag)
    let dragging = false, startX = 0, startTarget = 0, lastX = 0, lastT = 0, vel = 0, moved = false, clickedCard = null;
    vp.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".stage-nav")) return;
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      lastT = performance.now();
      vel = 0;
      startTarget = stageCurrent;
      clickedCard = e.target.closest(".stage-card");
      vp.setPointerCapture?.(e.pointerId);
    });
    vp.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      const now = performance.now();
      vel = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
      const raw = startTarget + dx / 250;
      const max = Math.max(0, filteredWorks.length - 1);
      stageTarget = raw < 0 ? raw * 0.32 : raw > max ? max + (raw - max) * 0.32 : raw;
      pumpStagePhysics();
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      vp.releasePointerCapture?.(e.pointerId);
      if (!moved && clickedCard) {
        const ci = +clickedCard.dataset.i;
        if (ci === stageIdx) openCaseModal(ci);
        else goStage(ci);
        return;
      }
      const fling = clamp(vel * 12, -1.2, 1.2);
      goStage(Math.round(stageTarget + fling));
    };
    vp.addEventListener("pointerup", endDrag);
    vp.addEventListener("pointercancel", endDrag);

    // اسکرول افقی تاچ‌پد
    let wheelLock = false;
    vp.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 10) return;
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      goStage(stageIdx + (e.deltaX > 0 ? 1 : -1));
      setTimeout(() => { wheelLock = false; }, 420);
    }, { passive: false });

    vp.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goStage(stageIdx + 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goStage(stageIdx - 1); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCaseModal(stageIdx); }
    });

    window.addEventListener("resize", () => renderStageFrame(stageCurrent));

    $$("[data-case-close]").forEach((el) => el.addEventListener("click", closeCaseModal));
    $("#case-prev")?.addEventListener("click", () => fillCaseModal(modalIdx - 1));
    $("#case-next")?.addEventListener("click", () => fillCaseModal(modalIdx + 1));
    $("#case-order-btn")?.addEventListener("click", () => {
      const cur = filteredWorks[modalIdx];
      closeCaseModal();
      if (cur) preselectServiceAndScroll(cur.tag, `سلام، پروژه‌ای مشابه نمونه کار «${cur.title || cur.tag}» مدنظرم هست.`);
    });
    document.addEventListener("keydown", (e) => {
      const modal = $("#case-modal");
      if (!modal || modal.hidden) return;
      if (e.key === "Escape") closeCaseModal();
      if (e.key === "ArrowLeft") fillCaseModal(modalIdx + 1);
      if (e.key === "ArrowRight") fillCaseModal(modalIdx - 1);
    });
  }

  function projectSiteUrl(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function fillCaseModal(idx) {
    const n = filteredWorks.length;
    if (!n) return;
    modalIdx = ((idx % n) + n) % n;
    const w = filteredWorks[modalIdx];
    $("#case-img").src = imgSrc(w.file);
    $("#case-img").alt = w.title || w.tag;
    $("#case-tag").textContent = w.tag || "پروژه";
    $("#case-title").textContent = w.title || w.tag;
    $("#case-client").textContent = w.client || "پروژه اختصاصی رسانه میم";
    $("#case-year").textContent = fa(w.year || "۱۴۰۴");
    $("#case-tools").textContent = w.tools || "Design & Development";
    $("#case-desc").textContent = w.description || "";
    const siteLink = $("#case-site-link");
    const siteUrl = projectSiteUrl(w.url);
    siteLink.hidden = !siteUrl;
    if (siteUrl) siteLink.href = siteUrl;
    else siteLink.removeAttribute("href");
    goStage(modalIdx);
  }

  function openCaseModal(idx) {
    if (!filteredWorks.length) return;
    fillCaseModal(idx);
    const modal = $("#case-modal");
    modal.hidden = false;
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => modal.classList.add("is-open"));
  }

  function closeCaseModal() {
    const modal = $("#case-modal");
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    setTimeout(() => { modal.hidden = true; }, 340);
  }

  /* ---------- فرم هوشمند سفارش و کپی سریع ---------- */
  function preselectServiceAndScroll(keyword, noteText = "") {
    const chips = $$("#service-chips .choice-chip");
    const kw = (keyword || "").trim();
    let matched = chips.find((c) => c.dataset.val.includes(kw) || kw.includes(c.dataset.val.split(" ")[0]));
    if (!matched && kw.includes("وب")) matched = chips.find(c => /وب|سایت/.test(c.dataset.val));
    if (!matched && /برند|گرافیک/.test(kw)) matched = chips.find(c => /برند|گرافیک|بصری/.test(c.dataset.val));
    if (matched) {
      chips.forEach((c) => c.classList.toggle("is-selected", c === matched));
      $("#selected-service").value = matched.dataset.val;
    }
    if (noteText && !$("#f-msg").value.trim()) $("#f-msg").value = noteText;
    $("#contact")?.scrollIntoView({ behavior: "smooth" });
  }

  function initOrderAndCopy() {
    const bindChips = (wrapSel, inputSel) => {
      const wrap = $(wrapSel);
      const hidden = $(inputSel);
      if (!wrap || !hidden) return;
      wrap.addEventListener("click", (e) => {
        const chip = e.target.closest(".choice-chip");
        if (!chip) return;
        $$(".choice-chip", wrap).forEach((c) => c.classList.toggle("is-selected", c === chip));
        hidden.value = chip.dataset.val;
      });
    };
    bindChips("#service-chips", "#selected-service");
    bindChips("#budget-chips", "#selected-budget");

    $("#order-wa-btn")?.addEventListener("click", () => {
      const srv = $("#selected-service").value;
      const bdg = $("#selected-budget").value;
      const name = $("#f-name").value.trim();
      const msg = $("#f-msg").value.trim();
      const digits = String(SITE.contact.phone || "09399887950").replace(/\D/g, "");
      const wa = digits.startsWith("0") ? "98" + digits.slice(1) : digits;
      const lines = [
        "سلام آقای میدانی وقت بخیر،",
        name ? `نام من: ${name}` : "",
        `خدمت موردنیاز: ${srv}`,
        `سطح پروژه: ${bdg}`,
        msg ? `توضیحات: ${msg}` : "",
      ].filter(Boolean).join("\n");
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(lines)}`, "_blank", "noopener");
    });

    const form = $("#order-form");
    const status = $("#order-status");
    const submitBtn = $("#order-submit");
    const latinDigits = (s) => String(s).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

    let pendingOrder = null;
    form?.addEventListener("submit", (e) => {
      if (submitBtn.disabled) { e.preventDefault(); return; }
      e.preventDefault();
      status.className = "order-status";
      status.textContent = "";

      let ok = true;
      $$("[required]", form).forEach((inp) => {
        const wrap = inp.closest(".field");
        let v = inp.value.trim();
        if (inp.name === "phone") v = latinDigits(v);
        let valid = !!v;
        if (valid && inp.name === "phone") valid = /^09\d{9}$/.test(v);
        wrap?.classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
      });

      if (!ok) {
        status.className = "order-status is-err";
        status.textContent = "لطفاً نام، شماره موبایل معتبر (۰۹...) و توضیح پروژه را وارد کنید.";
        return;
      }

      const span = submitBtn.querySelector("span");
      const prevTxt = span.textContent;
      span.textContent = "در حال ثبت درخواست…";
      submitBtn.disabled = true;

      const payload = Object.fromEntries(new FormData(form));
      const fingerprint = JSON.stringify(payload);
      if (!pendingOrder || pendingOrder.fingerprint !== fingerprint) pendingOrder = { fingerprint, id: crypto.randomUUID() };
      form.querySelectorAll('input,textarea,button').forEach(el => { el.disabled = true; });
      const request = window.MiimCloud?.bot('order', { ...payload, id: pendingOrder.id });
      Promise.resolve(request || Promise.reject(new Error('سرویس سفارش بارگذاری نشده است.')))
        .then((result) => {
          if (!result?.ok) throw new Error('ثبت درخواست تأیید نشد؛ دوباره تلاش کنید.');
          const service = $('#selected-service').value, budget = $('#selected-budget').value;
          form.reset(); pendingOrder = null;
          $('#selected-service').value = service; $('#selected-budget').value = budget;
          status.className = "order-status is-ok";
          status.textContent = result.delivery === 'sent'
            ? "درخواست ثبت شد و از طریق ربات روبیکا به مدیر رسید."
            : "درخواست شما در صندوق سفارش‌های مدیر ثبت شد؛ به‌زودی با شما تماس می‌گیرم.";
          showToast("سفارش شما با موفقیت ثبت شد");
        })
        .catch((error) => {
          status.className = "order-status is-err";
          status.textContent = error.message || "ارسال تأیید نشد؛ دوباره تلاش کنید یا مستقیم پیام بدهید.";
        })
        .finally(() => {
          span.textContent = prevTxt;
          form.querySelectorAll('input,textarea,button').forEach(el => { el.disabled = false; });
          submitBtn.disabled = false;
        });
    });

    $$("[data-copy-key]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const val = SITE.contact[btn.dataset.copyKey] || "";
        if (!val) return;
        try {
          await navigator.clipboard.writeText(val);
          showToast(`«${val}» در حافظه کپی شد`);
        } catch {
          showToast(val);
        }
      });
    });
  }

  /* ---------- شمارنده اعداد و ظهور سینمایی بخش‌ها ---------- */
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = +el.dataset.count || 0;
    const pre = el.dataset.prefix || "";
    const suf = el.dataset.suffix || "";
    const dur = 1450, t0 = performance.now();
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fa(Math.round(target * ease)) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function observeCinematicReveals() {
    const els = $$("[data-cinematic]:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      $$("#skills-list .skill-row__fill").forEach((f) => (f.style.width = f.dataset.width + "%"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-visible");
        $$("[data-count]", el).forEach(countUp);
        if (el.id === "skills-card" || $$("#skills-list .skill-row__fill", el).length) {
          $$("#skills-list .skill-row__fill", el).forEach((f, idx) => {
            setTimeout(() => { f.style.width = f.dataset.width + "%"; }, 220 + idx * 130);
          });
        }
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -5% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- حلقه سینمایی اسکرول، عمق هیرو، پارالاکس پرتره و Marquee ---------- */
  function initScrollytellingLoop() {
    const fill = $("#scroll-fill");
    const toTop = $("#to-top");
    const hero = $("#hero");
    const heroSticky = $("#hero-sticky");
    const heroPhoto = $("#hero-photo");
    const heroArch = $("#portrait-arch");
    const heroIcons = $("#hero-icons");
    const heroHalo = $("#hero-halo");
    const marqueeTrack = $("#marquee-track");

    const calmScroll = () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    toTop?.addEventListener("click", calmScroll);

    let lastY = window.scrollY;
    let marqueeX = 0;
    let maxScroll = 1;
    let frameCount = 0;
    let raf = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let heroHeight = hero ? (hero.offsetHeight || window.innerHeight) : 0;
    let heroStyled = false;
    const refreshHeroHeight = () => { if (hero) heroHeight = hero.offsetHeight || window.innerHeight; };
    window.addEventListener("resize", refreshHeroHeight, { passive: true });

    let marqueeHalf = 0;
    const measureMarquee = () => { marqueeHalf = marqueeTrack ? marqueeTrack.scrollWidth / 2 : 0; };
    measureMarquee();
    window.addEventListener("resize", measureMarquee, { passive: true });
    document.fonts?.ready.then(measureMarquee);

    // پارالاکس ماوس روی صحنه پرتره هیرو
    let ptx = 0, pty = 0, pcx = 0, pcy = 0;
    if (FINE_POINTER && hero) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        ptx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1..1
        pty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }, { passive: true });
      hero.addEventListener("pointerleave", () => { ptx = 0; pty = 0; });
    }

    const frame = () => {
      if (document.hidden) { raf = 0; return; }
      raf = requestAnimationFrame(frame);

      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      scrollVelocity = lerp(scrollVelocity, dy, 0.18);

      // Reading scrollHeight forces layout, so it is cached and refreshed once every 30 frames.
      if (frameCount++ % 30 === 0) maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      // نوار پیشرفت اسکرول
      if (fill) fill.style.width = clamp((y / maxScroll) * 100, 0, 100).toFixed(2) + "%";
      if (toTop) toTop.classList.toggle("is-visible", y > 500);

      // افکت دوربین سینمایی عقب‌نشینی هیرو هنگام بالا آمدن شیت محتوا (دسکتاپ)
      // Styles are only written while the hero is actually receding, so a scrolled-away hero
      // stops repainting the layer that sits behind the floating header.
      if (heroSticky && window.innerWidth > 980 && !reduceMotion.matches) {
        const p = clamp(y / (heroHeight * 0.9), 0, 1);
        if (p < 1) {
          const sc = 1 - p * 0.085;
          const ty = p * -46;
          const op = clamp(1 - p * 1.15, 0, 1);
          heroSticky.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
          heroSticky.style.opacity = op.toFixed(3);
          heroStyled = true;
        } else if (heroStyled || !heroSticky.style.opacity) {
          heroSticky.style.transform = "translate3d(0, -46px, 0) scale(0.9150)";
          heroSticky.style.opacity = "0";
          heroStyled = false;
        }
      } else if (heroStyled) {
        heroSticky.style.transform = "";
        heroSticky.style.opacity = "";
        heroStyled = false;
      }

      // پارالاکس ۳بعدی چندلایه روی پرتره و آیکون‌های شناور
      // Only repaint while the pointer easing is still converging; an idle cursor costs nothing.
      if (FINE_POINTER && y < window.innerHeight * 1.2) {
        const ncx = lerp(pcx, ptx, 0.075);
        const ncy = lerp(pcy, pty, 0.075);
        if (Math.abs(ncx - pcx) > 0.0005 || Math.abs(ncy - pcy) > 0.0005) {
          pcx = ncx;
          pcy = ncy;
          if (heroPhoto) heroPhoto.style.transform = `translate3d(${(pcx * 14).toFixed(1)}px, ${(pcy * 9).toFixed(1)}px, 0)`;
          if (heroArch) heroArch.style.transform = `rotateY(${(pcx * 6).toFixed(2)}deg) rotateX(${(-pcy * 5).toFixed(2)}deg)`;
          if (heroIcons) heroIcons.style.transform = `translate3d(${(-pcx * 18).toFixed(1)}px, ${(-pcy * 12).toFixed(1)}px, 0)`;
          if (heroHalo) heroHalo.style.transform = `translate3d(${(-pcx * 24).toFixed(1)}px, ${(-pcy * 16).toFixed(1)}px, 0)`;
        }
      }

      // حرکت پیوسته Marquee واکنش‌گرا به سرعت اسکرول
      // (عرض نوار کش می‌شود؛ خواندن scrollWidth در هر فریم یک layout اجباری بود)
      if (marqueeTrack && marqueeHalf > 0) {
        const speed = 0.65 + Math.min(4.5, Math.abs(scrollVelocity) * 0.15);
        marqueeX -= speed;
        if (Math.abs(marqueeX) >= marqueeHalf) marqueeX += marqueeHalf;
        marqueeTrack.style.transform = `translate3d(${marqueeX.toFixed(1)}px, 0, 0)`;
      }
    };

    // Hidden tabs burn no frames: the loop is cancelled and resumed with visibilitychange.
    const start = () => {
      if (raf || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastY = window.scrollY;
        maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        start();
      }
    });
    start();
  }

  /* ---------- پرده لودر سینمایی دو تکه (Split-Shutter Loader) ---------- */
  function initCinemaLoader() {
    const loader = $("#loader");
    const arc = $("#loader-arc");
    const pctEl = $("#loader-pct");
    const CIRC = 339.292;

    const revealHeroNow = () => {
      document.documentElement.classList.add("is-ready");
      document.body.classList.remove("is-loading");
      setTimeout(() => {
        $$("#stats-strip [data-count]").forEach(countUp);
      }, 360);
    };

    if (!loader) { revealHeroNow(); return; }

    let prog = 0;
    const t0 = performance.now();
    const MIN_MS = 1050;

    const finish = () => {
      if (arc) arc.style.strokeDashoffset = "0";
      if (pctEl) pctEl.textContent = fa(100) + "٪";
      loader.classList.add("is-parting");
      setTimeout(() => {
        loader.classList.add("is-open");
        revealHeroNow();
        setTimeout(() => loader.remove(), 1200);
      }, 280);
    };

    const tick = (now) => {
      prog = Math.min(100, prog + (100 - prog) * 0.11 + 1.8);
      const rounded = Math.round(prog);
      if (arc) arc.style.strokeDashoffset = String(CIRC * (1 - prog / 100));
      if (pctEl) pctEl.textContent = fa(rounded) + "٪";

      if (prog >= 99.2 && now - t0 >= MIN_MS) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- رندر کل اجزا ---------- */
  function renderAll() {
    renderIdentityAndHero();
    renderAboutAndSkills();
    renderServices();
    renderFilterTabs();
    rebuildWorksShowcase();
    renderProcessAndTestimonials();
    renderContactAndFooter();
    bindMagnetic();
    bindTiltCards();
    observeCinematicReveals();
  }

  async function boot() {
    await loadStudioData();
    initTheme();
    renderAll();
    initSmoothHeader();
    initMotionBudget();
    initWorksInteractions();
    initOrderAndCopy();
    initCinemaCursor();
    initGoldCanvas();
    initScrollytellingLoop();
    initCinemaLoader();

    if ("BroadcastChannel" in window) {
      const ch = new BroadcastChannel("pf:sync");
      ch.addEventListener("message", async () => {
        await loadStudioData();
        renderAll();
        if (document.documentElement.classList.contains("is-ready")) {
          $$("#stats-strip [data-count]").forEach((el) => { delete el.dataset.counted; countUp(el); });
        }
        showToast("تغییرات اتاق فرمان به‌صورت زنده اعمال شد");
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
