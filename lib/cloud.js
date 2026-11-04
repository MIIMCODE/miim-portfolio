/* Only the public browser key belongs here. RLS, not key secrecy, protects writes. */
import { createClient } from '@supabase/supabase-js';
const client = createClient('https://jmpwryddrxmuwzmbmhsb.supabase.co', 'sb_publishable_E7s-ifIkDJ_zzLa_gt7xNQ_37xhuA-w', {
  auth: { storageKey: 'miim:cloud-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});
const adminEmail = 'resane.miim@gmail.com';
const adminUsername = 'mojtaba';
function resolveIdentity(identity) {
  const value = String(identity || '').trim().toLowerCase();
  return value === adminUsername ? adminEmail : value;
}
const redirectTo = 'https://miimdev.github.io/TEST/admin/';
function check(error) { if (error) throw error; }
function publicData(data) {
  const result = { ...data };
  delete result.authHash;
  return result;
}
window.MiimCloud = {
  async bot(action, payload = {}) {
    const { data, error } = await client.functions.invoke('miim-rubika', { body: { ...payload, action }, signal: AbortSignal.timeout(30000) });
    if (error || data?.ok === false) {
      let code = data?.error;
      if (!code && error?.context) { try { code = (await error.context.json()).error; } catch {} }
      const messages = {
        rate_limited:'تعداد درخواست‌ها زیاد است؛ چند دقیقه بعد تلاش کنید.',
        pairing_expired:'کد اتصال منقضی شده؛ کد جدید بسازید.',
        pairing_message_not_found:'پیام کد اتصال هنوز پیدا نشد. کد را در پیوی ربات بفرستید و دوباره بررسی کنید.',
        bot_not_configured:'توکن ربات در سرور ثبت نشده است.',
        bot_rejected:'روبیکا درخواست را نپذیرفت؛ توکن یا دسترسی ربات را بررسی کنید.',
        bot_delivery_uncertain:'پاسخ روبیکا مشخص نیست؛ پیش از تلاش دوباره پیوی ربات را بررسی کنید.',
        pairing_required:'ابتدا پیوی خودتان را به ربات متصل کنید.',
        invalid_order:'اطلاعات سفارش معتبر نیست؛ فیلدها را بررسی کنید.',
      };
      throw new Error(messages[code] || 'ارتباط با سرویس سفارش برقرار نشد؛ دوباره تلاش کنید یا مستقیم پیام بدهید.');
    }
    return data;
  },
  adminEmail,
  adminUsername,
  async read(timeout = 7000) {
    const { data, error } = await client.from('miim_content').select('data,revision,updated_at').eq('id', 'main').single().abortSignal(AbortSignal.timeout(timeout));
    check(error); return data;
  },
  async session() {
    const { data, error } = await client.auth.getSession(); check(error); return data.session;
  },
  async isAdmin() {
    const { data, error } = await client.rpc('miim_is_admin'); check(error); return data === true;
  },
  async login(identity, password) {
    const email = resolveIdentity(identity);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    check(error); return data.session;
  },
  async recover(identity) {
    const email = resolveIdentity(identity);
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo }); check(error);
  },
  async password(password) { const { error } = await client.auth.updateUser({ password }); check(error); },
  async logout() { const { error } = await client.auth.signOut(); check(error); },
  onAuth(callback) { return client.auth.onAuthStateChange(callback); },
  async history() {
    const { data, error } = await client.from('miim_revisions').select('revision,saved_at,archived_at').order('revision', { ascending: false }).limit(30);
    check(error); return data;
  },
  async revision(revision) {
    const { data, error } = await client.from('miim_revisions').select('data,revision').eq('revision', revision).single();
    check(error); return data;
  },
  async upload(file) {
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const ext = window.PF.sniffImage(bytes);
    if (!ext || file.size > 5 * 1024 * 1024 || !file.size) throw new Error('تصویر PNG، JPG، WebP یا GIF با حجم حداکثر ۵ مگابایت انتخاب کنید.');
    const type = { jpg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif' }[ext];
    const name = 'uploads/' + crypto.randomUUID() + '.' + ext;
    const { error } = await client.storage.from('miim-media').upload(name, file, { contentType:type, cacheControl:'31536000', upsert:false });
    check(error);
    return client.storage.from('miim-media').getPublicUrl(name).data.publicUrl;
  },
  async save(data, revision) {
    const response = await client.from('miim_content').update({ data: publicData(data) }).eq('id', 'main').eq('revision', revision).select('data,revision,updated_at').maybeSingle();
    check(response.error);
    if (!response.data) throw new Error('نسخهٔ جدیدتری ذخیره شده یا دسترسی ویرایش ندارید. قبل از تلاش مجدد، اطلاعات را تازه‌سازی کنید.');
    return response.data;
  },
};
