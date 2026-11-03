/* =====================================================================
   store.js — لایه‌ی داده و احراز هویت (Supabase)
   • خواندن عمومی سایت با کلید publishable
   • نوشتن فقط برای کاربر ادمین (RLS در سمت سرور)
   • در صورت قطع اتصال، داده از data.json (seed) خوانده می‌شود
   ===================================================================== */
(() => {
  "use strict";

  const CFG = window.MIIM_CONFIG;
  const BUCKET = CFG.MEDIA_BUCKET;
  const MAX_FILE = 8 * 1024 * 1024; // ۸ مگابایت
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const PLATFORM_KEYS = ["instagram", "telegram", "whatsapp", "linkedin", "behance", "youtube", "link"];

  let client = null;
  let channel = null;
  let state = emptyState();
  const listeners = new Set();

  function emptyState() {
    return { content: {}, contact: {}, skills: [], works: [], source: "seed", updatedAt: null, error: null };
  }

  /* ---------- ابزارهای عمومی ---------- */
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const toFa = (v) => String(v ?? "").replace(/\d/g, (d) => faDigits[+d]);
  const toEn = (v) => String(v ?? "").replace(/[۰-۹]/g, (d) => faDigits.indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  function faNum(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "۰";
    return toFa(num.toLocaleString("en-US"));
  }

  function cleanText(value, max = 500) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function cleanMultiline(value, max = 2000) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .replace(/[<>]/g, "")
      .replace(/\r\n/g, "\n")
      .trim()
      .slice(0, max);
  }

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
    // مسیرهای نسبی مجاز داخل ریپو (مثل assets/work-1.svg)
    if (/^assets\/[A-Za-z0-9._-]{1,120}$/.test(raw)) return raw;
    return "";
  }

  function safePhone(value) {
    const raw = toEn(value).replace(/[^\d+]/g, "");
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return "";
    return raw.startsWith("+") ? "+" + digits : digits;
  }

  function safeEmail(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) ? raw : "";
  }

  function safePlatforms(list) {
    if (!Array.isArray(list)) return [];
    return list.slice(0, 12).map((p) => {
      const key = PLATFORM_KEYS.includes(p && p.key) ? p.key : "link";
      return {
        key,
        label: cleanText(p && p.label, 30) || key,
        url: safeUrl(p && p.url),
      };
    });
  }

  function normalizeContent(raw) {
    const base = SEED.content;
    const d = raw && typeof raw === "object" ? raw : {};
    const out = { ...base };
    for (const key of Object.keys(base)) {
      if (key === "experiences" || key === "stats") continue;
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
          value: Math.max(0, Math.min(9999, Math.round(Number(toEn(x && x.value)) || 0))),
          suffix: cleanText(x && x.suffix, 4),
        }))
      : base.stats;
    out.heroPhoto = safeUrl(d.heroPhoto) || base.heroPhoto;
    return out;
  }

  function normalizeContact(raw) {
    const base = SEED.contact;
    const d = raw && typeof raw === "object" ? raw : {};
    return {
      phone: safePhone(d.phone ?? base.phone),
      socialId: cleanText(d.socialId ?? d.social_id, 60).replace(/^@/, ""),
      email: safeEmail(d.email ?? base.email),
      platforms: safePlatforms(d.platforms ?? base.platforms),
    };
  }

  function normalizeSkills(rows) {
    if (!Array.isArray(rows)) return [];
    return rows
      .map((s, i) => ({
        id: s.id || null,
        name: cleanText(s.name, 40),
        percent: Math.max(0, Math.min(100, Math.round(Number(s.percent) || 0))),
        sortOrder: Number(s.sort_order ?? s.sortOrder ?? i + 1),
      }))
      .filter((s) => s.name)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function normalizeWorks(rows, onlyPublished = false) {
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((w) => (onlyPublished ? (w.is_published ?? w.isPublished) !== false : true))
      .map((w, i) => ({
        id: w.id || null,
        title: cleanText(w.title, 120) || "بدون عنوان",
        category: cleanText(w.category, 40) || "بدون دسته",
        description: cleanMultiline(w.description, 600),
        imageUrl: safeUrl(w.image_url ?? w.imageUrl) || "assets/work-1.svg",
        imagePath: w.image_path ?? w.imagePath ?? null,
        sortOrder: Number(w.sort_order ?? w.sortOrder ?? i + 1),
        isPublished: (w.is_published ?? w.isPublished) !== false,
        createdAt: w.created_at ?? w.createdAt ?? null,
        updatedAt: w.updated_at ?? w.updatedAt ?? null,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

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

  /* ---------- seed (data.json) ---------- */
  const SEED = {
    content: {
      brand: "رسانه میم",
      name: "مجتبی میدانی",
      roleFa: "طراح گرافیک و وب دیزاینر",
      roleEn: "Graphic & Web Designer",
      heroGreet: "سلام، من مجتبیام",
      heroPhoto: "assets/portrait.svg",
      navHero: "خانه",
      navAbout: "درباره",
      navWorks: "آثار",
      navContact: "تماس",
      aboutEyebrow: "درباره‌ی من",
      aboutHeading: "طراحی می‌کنم تا دیده شوی",
      aboutText: "من مجتبی میدانی هستم؛ طراح گرافیک و وب دیزاینر با تمرکز روی هویت بصری، رابط کاربری و روایت تصویری.",
      expHeading: "مسیر تجربه",
      experiences: [
        { role: "طراح گرافیک مستقل", place: "رسانه میم", period: "۱۴۰۲ — اکنون" },
        { role: "طراح وب و رابط کاربری", place: "پروژه‌های آزاد", period: "۱۴۰۰ — اکنون" },
        { role: "عکاس و تدوین‌گر", place: "همکاری با برندها", period: "۱۳۹۹ — اکنون" },
      ],
      stats: [
        { label: "اثر منتخب", value: 24, suffix: "+" },
        { label: "سال تجربه", value: 6, suffix: "" },
        { label: "نرم‌افزار تخصصی", value: 4, suffix: "" },
      ],
      skillsEyebrow: "مهارت‌ها",
      skillsHeading: "ابزارهایی که با آن‌ها می‌سازم",
      worksEyebrow: "گالری آثار",
      worksHeading: "نمونه‌ای از کارها",
      ctaText: "پروژه‌ای در ذهن داری؟ بیا درباره‌اش حرف بزنیم.",
      ctaButton: "شروع گفتگو",
      contactEyebrow: "تماس",
      contactHeading: "بیا در ارتباط باشیم",
      contactLead: "برای همکاری، سفارش طراحی یا فقط یک گفتگوی دوستانه، در دسترس هستم.",
      footerLegal: "© رسانه میم — تمامی حقوق محفوظ است. طراحی و توسعه با دقت و وسواس.",
    },
    contact: {
      phone: "09399887950",
      socialId: "Resane_miim",
      email: "resane.Miim@gmail.com",
      platforms: [
        { key: "instagram", label: "اینستاگرام", url: "https://instagram.com/Resane_miim" },
        { key: "telegram", label: "تلگرام", url: "https://t.me/Resane_miim" },
        { key: "whatsapp", label: "واتساپ", url: "https://wa.me/989399887950" },
        { key: "behance", label: "بهانس", url: "" },
        { key: "linkedin", label: "لینکدین", url: "" },
        { key: "youtube", label: "یوتیوب", url: "" },
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

  /* ---------- کلاینت ---------- */
  function getClient() {
    if (client) return client;
    if (!window.supabase || !CFG) return null;
    client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
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

  /* ---------- خواندن عمومی ---------- */
  async function loadSite() {
    const c = getClient();
    if (!c) {
      state = await loadSeed();
      emit();
      return state;
    }
    try {
      const queries = Promise.all([
        c.from("site_content").select("data, updated_at").eq("key", "main").maybeSingle(),
        c.from("works").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
        c.from("skills").select("*").order("sort_order", { ascending: true }),
        c.from("contact").select("*").eq("id", 1).maybeSingle(),
      ]);
      // اگر Supabase در دسترس نبود، سریع به seed برگرد
      const timeout = new Promise((_resolve, reject) => {
        window.setTimeout(() => reject(new Error("supabase timeout")), 7000);
      });
      const [contentRes, worksRes, skillsRes, contactRes] = await Promise.race([queries, timeout]);
      const firstError = contentRes.error || worksRes.error || skillsRes.error || contactRes.error;
      if (firstError) throw firstError;

      const contentRow = contentRes.data;
      const contactRow = contactRes.data;
      const hasAnything = !!contentRow || !!(worksRes.data && worksRes.data.length) || !!(skillsRes.data && skillsRes.data.length) || !!contactRow;
      if (!hasAnything) {
        state = await loadSeed();
        emit();
        return state;
      }

      const updatedAt = [contentRow?.updated_at, contactRow?.updated_at, ...(worksRes.data || []).map((w) => w.updated_at), ...(skillsRes.data || []).map((s) => s.updated_at)]
        .filter(Boolean)
        .sort()
        .pop();

      state = {
        content: normalizeContent(contentRow?.data),
        contact: normalizeContact(contactRow || SEED.contact),
        skills: normalizeSkills(skillsRes.data),
        works: normalizeWorks(worksRes.data, true),
        source: "supabase",
        updatedAt: updatedAt || null,
        error: null,
      };
    } catch (e) {
      console.warn("[MiimStore] Supabase unavailable, falling back to seed:", e && e.message);
      state = await loadSeed();
      state.error = e && e.message ? e.message : "connection error";
    }
    emit();
    return state;
  }

  function getState() {
    return state;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  /* ---------- تغییرات زنده ---------- */
  function subscribeLive(onChange) {
    const c = getClient();
    if (!c) return () => {};
    if (channel) return () => {};
    channel = c
      .channel("miim-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "works" }, () => onChange())
      .on("postgres_changes", { event: "*", schema: "public", table: "skills" }, () => onChange())
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => onChange())
      .on("postgres_changes", { event: "*", schema: "public", table: "contact" }, () => onChange())
      .subscribe();
    return () => {
      if (channel) {
        c.removeChannel(channel);
        channel = null;
      }
    };
  }

  /* ---------- احراز هویت ---------- */
  function friendlyAuthError(error) {
    const msg = String((error && error.message) || "").toLowerCase();
    if (msg.includes("invalid login")) return "ایمیل یا رمز عبور درست نیست.";
    if (msg.includes("email not confirmed")) return "ایمیل شما تأیید نشده است.";
    if (msg.includes("rate limit") || msg.includes("too many")) return "تلاش‌های ناموفق زیاد بود؛ کمی بعد دوباره امتحان کنید.";
    if (msg.includes("failed to fetch") || msg.includes("network")) return "اتصال به سرور برقرار نشد. اینترنت را بررسی کنید.";
    return (error && error.message) || "ورود ناموفق بود.";
  }

  async function signIn(email, password) {
    const c = getClient();
    if (!c) throw new Error("سرویس احراز هویت در دسترس نیست.");
    const { data, error } = await c.auth.signInWithPassword({ email: String(email || "").trim(), password: String(password || "") });
    if (error) throw new Error(friendlyAuthError(error));
    return data.session;
  }

  async function signOut() {
    const c = getClient();
    if (c) await c.auth.signOut();
  }

  async function getSession() {
    const c = getClient();
    if (!c) return null;
    const timeout = new Promise((resolve) => {
      window.setTimeout(() => resolve(null), 5000);
    });
    const result = await Promise.race([c.auth.getSession(), timeout]);
    return (result && result.data && result.data.session) || null;
  }

  async function isAdmin() {
    const session = await getSession();
    const email = session && session.user && session.user.email ? session.user.email.toLowerCase() : "";
    return email === CFG.ADMIN_EMAIL.toLowerCase();
  }

  function onAuthChange(cb) {
    const c = getClient();
    if (!c) return () => {};
    const { data } = c.auth.onAuthStateChange((_event, session) => cb(session));
    return () => data.subscription.unsubscribe();
  }

  /* ---------- اعتبارسنجی فایل ---------- */
  function validateImage(file) {
    if (!file) throw new Error("فایلی انتخاب نشده است.");
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error("نوع فایل مجاز نیست؛ فقط PNG، JPG، WEBP یا GIF.");
    if (file.size > MAX_FILE) throw new Error("حجم عکس بیش از ۸ مگابایت است.");
    if (file.size < 100) throw new Error("فایل عکس معتبر نیست.");
    return true;
  }

  function safeFileName(name) {
    const base = String(name || "image").replace(/\.[^.]+$/, "");
    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return slug || "image";
  }

  async function uploadMedia(file, folder = "works") {
    validateImage(file);
    const c = getClient();
    if (!c) throw new Error("سرویس ذخیره‌سازی در دسترس نیست.");
    const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
    const rand = (window.crypto && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));
    const path = `${folder}/${Date.now().toString(36)}-${rand}-${safeFileName(file.name)}.${ext}`;
    const { error } = await c.storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw new Error("آپلود عکس ناموفق بود: " + (error.message || "خطای نامشخص"));
    const { data } = c.storage.from(BUCKET).getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  async function deleteMedia(path) {
    if (!path) return;
    const c = getClient();
    if (!c) return;
    const { error } = await c.storage.from(BUCKET).remove([path]);
    if (error) console.warn("[MiimStore] delete media:", error.message);
  }

  /* ---------- عملیات ادمین ---------- */
  async function adminLoadAll() {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const [worksRes, skillsRes, contentRes, contactRes] = await Promise.all([
      c.from("works").select("*").order("sort_order", { ascending: true }),
      c.from("skills").select("*").order("sort_order", { ascending: true }),
      c.from("site_content").select("data, updated_at").eq("key", "main").maybeSingle(),
      c.from("contact").select("*").eq("id", 1).maybeSingle(),
    ]);
    const firstError = worksRes.error || skillsRes.error || contentRes.error || contactRes.error;
    if (firstError) throw new Error(firstError.message || "خواندن داده ناموفق بود.");
    const updatedAt = [
      contentRes.data?.updated_at,
      contactRes.data?.updated_at,
      ...(worksRes.data || []).map((w) => w.updated_at),
      ...(skillsRes.data || []).map((s) => s.updated_at),
    ]
      .filter(Boolean)
      .sort()
      .pop();
    return {
      works: normalizeWorks(worksRes.data),
      skills: normalizeSkills(skillsRes.data),
      content: normalizeContent(contentRes.data?.data),
      contact: normalizeContact(contactRes.data || SEED.contact),
      updatedAt: updatedAt || null,
    };
  }

  async function adminCreateWork({ file, title, category, description, publishFirst, autoPublish }) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    validateImage(file);
    const uploaded = await uploadMedia(file, "works");
    const cleanTitle = cleanText(title, 120) || "اثر بدون عنوان";
    const cleanCategory = cleanText(category, 40) || "بدون دسته";
    const cleanDesc = cleanMultiline(description, 600);

    let order = 1;
    if (publishFirst) {
      const first = await c.from("works").select("sort_order").order("sort_order", { ascending: true }).limit(1);
      order = (first.data && first.data[0] ? Number(first.data[0].sort_order) : 1) - 1;
    } else {
      const last = await c.from("works").select("sort_order").order("sort_order", { ascending: false }).limit(1);
      order = (last.data && last.data[0] ? Number(last.data[0].sort_order) : 0) + 1;
    }

    const { data, error } = await c
      .from("works")
      .insert({
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDesc,
        image_url: uploaded.url,
        image_path: uploaded.path,
        sort_order: order,
        is_published: !!autoPublish,
      })
      .select()
      .single();
    if (error) {
      await deleteMedia(uploaded.path);
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
    const old = await c.from("works").select("image_path").eq("id", id).maybeSingle();
    const uploaded = await uploadMedia(file, "works");
    const { error } = await c.from("works").update({ image_url: uploaded.url, image_path: uploaded.path }).eq("id", id);
    if (error) {
      await deleteMedia(uploaded.path);
      throw new Error(error.message || "تغییر عکس ناموفق بود.");
    }
    if (old.data && old.data.image_path) await deleteMedia(old.data.image_path);
  }

  async function adminDeleteWork(id) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const row = await c.from("works").select("image_path").eq("id", id).maybeSingle();
    const { error } = await c.from("works").delete().eq("id", id);
    if (error) throw new Error(error.message || "حذف اثر ناموفق بود.");
    if (row.data && row.data.image_path) await deleteMedia(row.data.image_path);
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

  async function replaceSkills(items) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const clean = items
      .map((s, i) => ({
        id: s.id || null,
        name: cleanText(s.name, 40),
        percent: Math.max(0, Math.min(100, Math.round(Number(s.percent) || 0))),
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
      if (s.id) {
        const upd = await c.from("skills").update({ name: s.name, percent: s.percent, sort_order: s.sortOrder }).eq("id", s.id);
        if (upd.error) throw new Error(upd.error.message);
      } else {
        const ins = await c.from("skills").insert({ name: s.name, percent: s.percent, sort_order: s.sortOrder });
        if (ins.error) throw new Error(ins.error.message);
      }
    }
  }

  async function saveContent(data) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const payload = normalizeContent(data);
    const { error } = await c.from("site_content").upsert({ key: "main", data: payload }, { onConflict: "key" });
    if (error) throw new Error(error.message || "ذخیره‌ی متن‌ها ناموفق بود.");
    return payload;
  }

  async function saveContact(contact) {
    const c = getClient();
    if (!c) throw new Error("سرویس داده در دسترس نیست.");
    const payload = normalizeContact(contact);
    const { error } = await c.from("contact").upsert(
      {
        id: 1,
        phone: payload.phone,
        social_id: payload.socialId,
        email: payload.email,
        platforms: payload.platforms,
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(error.message || "ذخیره‌ی اطلاعات تماس ناموفق بود.");
    return payload;
  }

  /* ---------- API ---------- */
  window.MiimStore = {
    // عمومی
    loadSite,
    getState,
    subscribe,
    subscribeLive,
    resolveAsset,
    // کمکی
    faNum,
    toFa,
    toEn,
    cleanText,
    cleanMultiline,
    safeUrl,
    safePhone,
    safeEmail,
    safePlatforms,
    validateImage,
    // احراز هویت
    signIn,
    signOut,
    getSession,
    isAdmin,
    onAuthChange,
    // ادمین
    adminLoadAll,
    adminCreateWork,
    adminUpdateWork,
    adminReplaceWorkImage,
    adminDeleteWork,
    adminReorderWorks,
    replaceSkills,
    saveContent,
    saveContact,
    uploadMedia,
    deleteMedia,
  };
})();
