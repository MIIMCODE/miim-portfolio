/* =====================================================================
   store.js — لایه‌ی ذخیره‌سازی مشترک سایت و پنل (بدون نیاز به سرور)
   • داده‌ی منتشرشده:  data.json (کنار index.html)  +  نسخه‌ی محلی مرورگر
   • عکس‌های آپلودی:   IndexedDB مرورگر  (و در صورت اتصال، پوشه‌ی Image پروژه)
   ===================================================================== */
(() => {
  "use strict";

  const LS_DATA = "pf:data";
  const LS_AUTH = "pf:auth";
  const LS_FAIL = "pf:fail";
  const LS_CRED = "pf:cred";
  /* SHA-256 پیش‌فرض برای نام کاربری resanemiim و رمز Miim1405 */
  const DEFAULT_AUTH_HASH = "6341c0a8fe5009bbc707a3b0c02c511924186201b6f17981cc83cd457078e395";
  const SESSION_MS = 8 * 3600 * 1000;
  const PLATFORM_KEYS = ["instagram", "telegram", "whatsapp", "linkedin", "behance", "dribbble", "x", "youtube", "link"];

  /* ---------- SHA-256 (خالص، بدون وابستگی به HTTPS) ---------- */
  function sha256(str) {
    const bytes = Array.from(new TextEncoder().encode(str));
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    for (const v of [hi, lo]) bytes.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < bytes.length; i += 64) {
      const w = new Array(64);
      for (let t = 0; t < 16; t++) w[t] = (bytes[i + 4 * t] << 24) | (bytes[i + 4 * t + 1] << 16) | (bytes[i + 4 * t + 2] << 8) | bytes[i + 4 * t + 3];
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }

  /* ---------- ورود ---------- */
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch { /* خالی */ } };

  function activeAuthHash() {
    const custom = lsGet(LS_CRED);
    if (custom && /^[0-9a-f]{64}$/.test(custom)) return custom;
    try {
      const loc = JSON.parse(lsGet(LS_DATA) || "null");
      if (loc && typeof loc.authHash === "string" && /^[0-9a-f]{64}$/.test(loc.authHash)) return loc.authHash;
    } catch { /* خالی */ }
    return DEFAULT_AUTH_HASH;
  }

  function lockedFor() {
    try {
      const f = JSON.parse(lsGet(LS_FAIL) || "{}");
      return f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0;
    } catch { return 0; }
  }

  function login(user, pass, remoteHash = "") {
    const wait = lockedFor();
    if (wait) return { ok: false, error: `تلاش‌های ناموفق زیاد بود. ${wait} ثانیه‌ی دیگر دوباره امتحان کنید.` };
    const expected = (remoteHash && /^[0-9a-f]{64}$/.test(remoteHash) && !lsGet(LS_CRED)) ? remoteHash : activeAuthHash();
    if (sha256(String(user).trim() + "\u0000" + pass) === expected) {
      lsDel(LS_FAIL);
      if (!lsSet(LS_AUTH, String(Date.now() + SESSION_MS))) return { ok: false, error: "ذخیره‌سازی مرورگر در دسترس نیست. اجازهٔ ذخیره‌سازی را فعال کنید." };
      return { ok: true };
    }
    let f = {};
    try { f = JSON.parse(lsGet(LS_FAIL) || "{}"); } catch { /* خالی */ }
    f.n = (f.n || 0) + 1;
    if (f.n >= 5) { f.until = Date.now() + 5 * 60 * 1000; f.n = 0; }
    lsSet(LS_FAIL, JSON.stringify(f));
    return { ok: false, error: "نام کاربری یا رمز عبور درست نیست." };
  }

  function setCredentials(newUser, newPass) {
    const u = String(newUser || "").trim();
    const p = String(newPass || "");
    if (u.length < 3) throw new Error("نام کاربری باید حداقل ۳ کاراکتر باشد.");
    if (p.length < 6) throw new Error("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
    const h = sha256(u + "\u0000" + p);
    if (!lsSet(LS_CRED, h)) throw new Error("ذخیرهٔ مشخصات ورود ممکن نشد. اجازهٔ ذخیره‌سازی مرورگر را بررسی کنید.");
    return h;
  }

  const isLoggedIn = () => +(lsGet(LS_AUTH) || 0) > Date.now();
  const logout = () => lsDel(LS_AUTH);

  /* ---------- IndexedDB: عکس‌ها و تنظیمات ---------- */
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      if (!("indexedDB" in window)) return rej(new Error("IndexedDB پشتیبانی نمی‌شود"));
      const r = indexedDB.open("pf-store", 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("blobs"); r.result.createObjectStore("kv"); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function run(store, mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req ? req.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error("abort"));
    });
  }
  const putBlob = (name, blob) => run("blobs", "readwrite", (s) => s.put(blob, name));
  const getBlob = (name) => run("blobs", "readonly", (s) => s.get(name));
  const delBlob = (name) => run("blobs", "readwrite", (s) => s.delete(name));
  const blobNames = () => run("blobs", "readonly", (s) => s.getAllKeys());
  const kvGet = (k) => run("kv", "readonly", (s) => s.get(k));
  const kvSet = (k, v) => run("kv", "readwrite", (s) => s.put(v, k));
  const kvDel = (k) => run("kv", "readwrite", (s) => s.delete(k));

  const blobs = {};
  async function attachBlobs(files) {
    try {
      for (const f of files) {
        if (blobs[f] || !/^up-/.test(f)) continue;
        const b = await getBlob(f);
        if (b) blobs[f] = URL.createObjectURL(b);
      }
    } catch { /* بدون IndexedDB: همان مسیر پوشه‌ی Image */ }
  }

  /* ---------- داده‌ی محلی ---------- */
  function readLocal() {
    try { const d = JSON.parse(lsGet(LS_DATA) || "null"); return d && typeof d === "object" ? d : null; } catch { return null; }
  }
  const writeLocal = (d) => lsSet(LS_DATA, JSON.stringify(d));
  const clearLocal = () => lsDel(LS_DATA);

  /* ---------- اعتبارسنجی و پاک‌سازی ---------- */
  const fail = (m) => { throw new Error(m); };
  const str = (v, max) => String(v ?? "").replace(/[<>"`\\]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  const latin = (s) => String(s).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

  function clean(body) {
    if (!body || typeof body !== "object") fail("اطلاعات نامعتبر است.");
    if (!Array.isArray(body.works) || body.works.length > 300) fail("فهرست آثار نامعتبر است.");
    const seen = new Set();
    const works = body.works.map((w) => {
      const file = String(w && w.file || "");
      if (!/^[A-Za-z0-9._-]{1,120}$/.test(file) || !/\.(png|jpe?g|webp|gif)$/i.test(file)) fail("نام فایل یک اثر نامعتبر است.");
      if (seen.has(file)) fail("یک عکس بیش از یک‌بار در آثار آمده است.");
      seen.add(file);
      const url = String(w.url ?? "").trim();
      if (url) {
        let parsed;
        try { parsed = new URL(url); } catch { fail("لینک سایت نمونه‌کار معتبر نیست."); }
        if (!["https:", "http:"].includes(parsed.protocol) || url.length > 2048) fail("لینک سایت نمونه‌کار باید با http:// یا https:// شروع شود.");
      }
      return { file, title: str(w.title, 150), client: str(w.client, 120), year: str(w.year, 10), tools: str(w.tools, 200), tag: str(w.tag, 40) || "بدون دسته", description: str(w.description, 400), ...(w.url != null ? { url } : {}) };
    });
    if (!Array.isArray(body.skills) || body.skills.length > 30) fail("فهرست مهارت‌ها نامعتبر است.");
    const skills = body.skills.map((s) => {
      const name = str(s && s.name, 40);
      if (!name) fail("نام مهارت خالی است.");
      const percent = Math.max(0, Math.min(100, Math.round(Number(s.percent))));
      if (!Number.isFinite(percent)) fail("درصد مهارت نامعتبر است.");
      return { name, percent, ...(s.tag != null ? { tag: str(s.tag, 80) } : {}) };
    });
    const c = body.contact || {};
    const phone = latin(c.phone).replace(/[^\d+]/g, "");
    if (phone.replace(/\D/g, "").length < 10 || phone.length > 16) fail("شماره‌ی تماس معتبر نیست.");
    const email = str(c.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("ایمیل معتبر نیست.");
    if (!Array.isArray(c.platforms) || c.platforms.length > 12) fail("فهرست شبکه‌ها نامعتبر است.");
    const platforms = c.platforms.map((p) => {
      const key = PLATFORM_KEYS.includes(p && p.key) ? p.key : "link";
      const url = String(p && p.url || "").trim();
      if (url && !/^https?:\/\/[^\s<>"'`]{3,300}$/i.test(url)) fail("لینک باید با http:// یا https:// شروع شود.");
      return { key, label: str(p.label, 30) || key, url };
    });
    const out = { works, skills, contact: { phone, id: str(c.id, 60), email, platforms }, updatedAt: new Date().toISOString() };
    const customHash = lsGet(LS_CRED) || (typeof body.authHash === "string" ? body.authHash : "");
    if (customHash && /^[0-9a-f]{64}$/.test(customHash)) out.authHash = customHash;
    return out;
  }

  function sniffImage(u8) {
    if (u8.length < 12) return null;
    if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return "png";
    if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return "jpg";
    const a = (i, n) => String.fromCharCode(...u8.slice(i, i + n));
    if (a(0, 4) === "RIFF" && a(8, 4) === "WEBP") return "webp";
    if (a(0, 3) === "GIF") return "gif";
    return null;
  }

  /* ---------- پوشه‌ی پروژه (File System Access API) ---------- */
  const canPickDir = () => typeof window.showDirectoryPicker === "function";
  async function permission(handle, ask) {
    const opts = { mode: "readwrite" };
    if ((await handle.queryPermission(opts)) === "granted") return true;
    return ask && (await handle.requestPermission(opts)) === "granted";
  }
  async function writeFile(dir, name, data) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(data);
    await w.close();
  }
  async function exists(dir, name) {
    try { await dir.getFileHandle(name); return true; } catch { return false; }
  }
  async function writeProject(handle, data) {
    const written = [];
    const img = await handle.getDirectoryHandle("Image", { create: true });
    for (const w of data.works) {
      if (!/^up-/.test(w.file) || (await exists(img, w.file))) continue;
      const b = await getBlob(w.file);
      if (b) { await writeFile(img, w.file, b); written.push(w.file); }
    }
    await writeFile(handle, "data.json", JSON.stringify(data, null, 2) + "\n");
    return written;
  }

  /* ---------- ZIP (بدون فشرده‌سازی؛ سازگار با همه‌ی نرم‌افزارها) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function buildZip(entries) {
    const enc = new TextEncoder(), parts = [], central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const e of entries) {
      const name = enc.encode(e.name), crc = crc32(e.data), size = e.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true); lh.setUint32(22, size, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, e.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, size, true); ch.setUint32(24, size, true); ch.setUint16(28, name.length, true);
      ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + size;
    }
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
  }
  async function packageZip(data) {
    const enc = new TextEncoder();
    const entries = [{ name: "data.json", data: enc.encode(JSON.stringify(data, null, 2) + "\n") }];
    for (const w of data.works) {
      if (!/^up-/.test(w.file)) continue;
      const b = await getBlob(w.file);
      if (b) entries.push({ name: "Image/" + w.file, data: new Uint8Array(await b.arrayBuffer()) });
    }
    return buildZip(entries);
  }

  window.PF = {
    sha256, login, setCredentials, isLoggedIn, logout,
    putBlob, getBlob, delBlob, blobNames, kvGet, kvSet, kvDel, blobs, attachBlobs,
    readLocal, writeLocal, clearLocal, clean, sniffImage,
    canPickDir, permission, writeProject, packageZip, buildZip,
  };
})();
