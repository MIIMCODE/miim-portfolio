// No tokens, chat IDs or customer data are logged or returned to public clients.
export function createHandler({ env, fetch: request = fetch, crypto: crypt = crypto, now = () => Date.now() }) {
  const base = env('SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY');
  const token = env('RUBIKA_BOT_TOKEN');
  const origins = new Set(['https://miimdev.github.io', ...(env('MIIM_ALLOWED_ORIGINS') || '').split(',').filter(Boolean)]);
  class Failure extends Error { constructor(status, code) { super(code); this.status = status; } }
  const fail = (status, code) => { throw new Failure(status, code); };
  const hash = async value => Array.from(new Uint8Array(await crypt.subtle.digest('SHA-256', new TextEncoder().encode(value))), b => b.toString(16).padStart(2, '0')).join('');
  async function db(path, method = 'GET', body, prefer = 'return=representation') {
    const response = await request(base + '/rest/v1/' + path, { method, headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    const text = await response.text();
    if (!response.ok) {
      if (text.includes('rate_limited')) fail(429, 'rate_limited');
      if (text.includes('idempotency_conflict')) fail(409, 'idempotency_conflict');
      fail(503, 'storage_unavailable');
    }
    return text ? JSON.parse(text) : null;
  }
  async function manager(req) {
    const authorization = req.headers.get('authorization') || '';
    if (!/^Bearer [^ ]+$/i.test(authorization)) fail(401, 'sign_in_required');
    // Validate server-side against Auth and the existing verified-email manager RPC.
    const headers = { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' };
    const user = await request(base + '/auth/v1/user', { headers, signal: AbortSignal.timeout(8000) });
    if (!user.ok) fail(401, 'sign_in_required');
    const account = await user.json();
    const check = await request(base + '/rest/v1/rpc/miim_is_admin', { method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(8000) });
    if (!check.ok || await check.json() !== true || !account.id) fail(403, 'manager_required');
    return account.id;
  }
  async function bot(method, body = {}) {
    if (!token) fail(503, 'bot_not_configured');
    let response, data;
    try {
      response = await request('https://botapi.rubika.ir/v3/' + encodeURIComponent(token) + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(9000) });
      data = await response.json();
    } catch { fail(502, 'bot_delivery_uncertain'); }
    if (!response.ok || data.status !== 'OK') fail(502, 'bot_rejected');
    return data.data || {};
  }
  const settings = async () => (await db('miim_bot_settings?id=eq.main&select=*'))[0];
  const patchSettings = body => db('miim_bot_settings?id=eq.main', 'PATCH', body);
  function cleanOrder(body) {
    const text = (name, max, required = false) => {
      if (typeof body[name] !== 'string' || body[name].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body[name])) fail(400, 'invalid_order');
      const value = body[name].trim();
      if (required && !value) fail(400, 'invalid_order');
      return value;
    };
    if (body.website) fail(400, 'invalid_order'); // Honeypot; never forward spam.
    const result = { name: text('name', 100, true), phone: text('phone', 30, true).replace(/[۰-۹٠-٩]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.includes(d) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(d) : '٠١٢٣٤٥٦٧٨٩'.indexOf(d))), email: text('email', 120), service: text('service', 150, true), budget: text('budget', 150, true), message: text('message', 2000, true) };
    if (!/^09\d{9}$/.test(result.phone) || (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))) fail(400, 'invalid_order');
    return result;
  }
  const uuid = value => typeof value === 'string' && /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value);
  async function deliver(id, retry = false) {
    const config = await settings();
    if (!token || !config?.chat_id) return 'queued';
    const order = await db('rpc/miim_claim_order', 'POST', { p_id: id, p_retry: retry });
    if (!order) return 'unchanged';
    const p = order.payload;
    const message = ['سفارش جدید سایت رسانه میم', 'شناسه: ' + order.id, 'نام: ' + p.name, 'موبایل: ' + p.phone, 'ایمیل: ' + (p.email || '—'), 'خدمت: ' + p.service, 'بودجه: ' + p.budget, 'توضیحات:', p.message].join('\n');
    let state = 'sent', messageId = null;
    try {
      const sent = await bot('sendMessage', { chat_id: config.chat_id, text: message });
      if (!sent.message_id) fail(502, 'bot_delivery_uncertain');
      messageId = String(sent.message_id);
    } catch (error) { state = error.message === 'bot_rejected' ? 'failed' : 'uncertain'; }
    await db('miim_order_inbox?id=eq.' + id, 'PATCH', { state, message_id: messageId });
    return state;
  }
  async function readBody(req) {
    if (!req.headers.get('content-type')?.startsWith('application/json')) fail(415, 'json_required');
    if (Number(req.headers.get('content-length')) > 12000) fail(413, 'body_too_large');
    const reader = req.body?.getReader(); if (!reader) fail(400, 'invalid_json');
    let size = 0; const chunks = [];
    for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 12000) { await reader.cancel(); fail(413, 'body_too_large'); } chunks.push(value); }
    const buffer = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
    try { const body = JSON.parse(new TextDecoder().decode(buffer)); if (!body || Array.isArray(body) || typeof body !== 'object') fail(400, 'invalid_json'); return body; }
    catch { fail(400, 'invalid_json'); }
  }
  return async req => {
    const origin = req.headers.get('origin');
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (origin && origins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
    try {
      if (origin && !origins.has(origin)) fail(403, 'origin_not_allowed');
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
      if (req.method !== 'POST') fail(405, 'method_not_allowed');
      if (!base || !key) fail(503, 'server_not_configured');
      const body = await readBody(req);
      if (body.action === 'order') {
        if (!origin) fail(403, 'origin_required');
        if (!uuid(body.id)) fail(400, 'invalid_order_id');
        const payload = cleanOrder(body);
        const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const source = await hash(key + ':miim-order:' + ip);
        const order = await db('rpc/miim_accept_order', 'POST', { p_id: body.id, p_payload: payload, p_fingerprint: await hash(JSON.stringify(payload)), p_source: source, p_phone: payload.phone });
        let delivery = order.state;
        if (delivery === 'queued') {
          // The durable inbox is authoritative: bot outage must not lose a saved order.
          try { delivery = await deliver(order.id); } catch { delivery = 'queued'; }
        }
        return reply(200, { ok: true, id: order.id, delivery });
      }
      const user = await manager(req);
      if (body.action === 'status') {
        const config = await settings();
        return reply(200, { configured: Boolean(token), paired: Boolean(config?.chat_id), pairedAt: config?.paired_at || null });
      }
      if (body.action === 'prepare') {
        await bot('getMe'); // Validate token without exposing its value or upstream error details.
        const code = 'MIIM-' + crypt.randomUUID().replaceAll('-', '');
        await patchSettings({ pairing_hash: await hash(code), pairing_user: user, pairing_expires: new Date(now() + 600000).toISOString(), polling_offset: null });
        return reply(200, { code, expiresIn: 600 });
      }
      if (body.action === 'connect') {
        const config = await settings();
        if (typeof body.code !== 'string' || body.code.length > 64 || config.pairing_user !== user || !config.pairing_hash || Date.parse(config.pairing_expires) <= now() || await hash(body.code) !== config.pairing_hash) fail(400, 'pairing_expired');
        let offset = config.polling_offset, candidate = null;
        for (let page = 0; page < 5; page++) {
          const data = await bot('getUpdates', { limit: 100, ...(offset ? { offset_id: offset } : {}) });
          for (const update of data.updates || []) {
            const message = update.new_message;
            if (update.type === 'NewMessage' && message?.text?.trim() === body.code && message.sender_type === 'User' && !message.is_edited && !message.forwarded_from && !message.forwarded_no_link && typeof update.chat_id === 'string') {
              const chatData = await bot('getChat', { chat_id: update.chat_id });
              if (chatData.chat?.chat_type === 'User') candidate = update.chat_id;
            }
          }
          const next = data.next_offset_id;
          if (candidate || !next || next === offset || !(data.updates || []).length) break;
          offset = next;
        }
        if (!candidate) { await patchSettings({ polling_offset: offset || null }); fail(409, 'pairing_message_not_found'); }
        // Compare-and-swap consumes the challenge once even across concurrent edge instances.
        const updated = await db('miim_bot_settings?id=eq.main&pairing_hash=eq.' + config.pairing_hash, 'PATCH', { chat_id: candidate, paired_at: new Date(now()).toISOString(), pairing_hash: null, pairing_user: null, pairing_expires: null, polling_offset: null });
        if (!updated?.length) fail(409, 'pairing_expired');
        return reply(200, { ok: true, paired: true });
      }
      if (body.action === 'test') {
        const config = await settings(); if (!config?.chat_id) fail(409, 'pairing_required');
        const sent = await bot('sendMessage', { chat_id: config.chat_id, text: 'پیام آزمایشی رسانه میم: اتصال سفارش‌های سایت به پیوی روبیکای شما برقرار است.' });
        if (!sent.message_id) fail(502, 'bot_delivery_uncertain');
        return reply(200, { ok: true });
      }
      if (body.action === 'inbox') {
        const rows = await db('miim_order_inbox?select=id,payload,state,created_at,attempted_at&order=created_at.desc&limit=50');
        return reply(200, { orders: rows });
      }
      if (body.action === 'retry') {
        if (!uuid(body.id)) fail(400, 'invalid_order_id');
        return reply(200, { delivery: await deliver(body.id, true) });
      }
      if (body.action === 'published') {
        if (!Number.isSafeInteger(body.revision) || body.revision < 1) fail(400, 'invalid_revision');
        const content = await db('miim_content?id=eq.main&select=revision');
        if (content[0]?.revision !== body.revision) fail(409, 'revision_changed');
        const config = await settings(); if (!config?.chat_id) return reply(200, { delivery: 'not_paired' });
        const id = 'published:' + body.revision;
        const claim = await db('miim_bot_events?on_conflict=id', 'POST', { id, state: 'sending' }, 'resolution=ignore-duplicates,return=representation');
        if (!claim?.length) return reply(200, { delivery: 'already_attempted' });
        let state = 'sent';
        try { const sent = await bot('sendMessage', { chat_id: config.chat_id, text: 'مدیریت رسانه میم: نسخهٔ ' + body.revision + ' محتوای سایت با موفقیت منتشر شد.' }); if (!sent.message_id) state = 'uncertain'; }
        catch (error) { state = error.message === 'bot_rejected' ? 'failed' : 'uncertain'; }
        await db('miim_bot_events?id=eq.' + encodeURIComponent(id), 'PATCH', { state });
        return reply(200, { delivery: state });
      }
      fail(400, 'unknown_action');
    } catch (error) {
      return reply(error instanceof Failure ? error.status : 503, { ok: false, error: error instanceof Failure ? error.message : 'service_unavailable' });
    }
  };
}
if (typeof Deno !== 'undefined') Deno.serve(createHandler({ env: name => Deno.env.get(name) }));
