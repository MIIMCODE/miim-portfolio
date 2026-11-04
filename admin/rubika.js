/* Authenticated manager tools; never ask for or render the bot token or destination chat ID. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let code = '', busy = false, generation = 0;
  const labels = { queued:'در صف ارسال', sending:'در حال ارسال / منتظر بررسی', sent:'ارسال‌شده به روبیکا', failed:'روبیکا نپذیرفت', uncertain:'نتیجهٔ ارسال نامشخص' };
  function feedback(text, error = false) { $('bot-feedback').textContent = text; $('bot-feedback').dataset.error = String(error); }
  function lock(value) {
    busy = value;
    $('rubika-section').querySelectorAll('button').forEach(el => { el.disabled = value; });
    $('bot-connect').disabled = value || !code;
  }
  async function run(action, payload = {}) {
    if (busy || $('dashboard').hidden) return;
    const active = generation;
    lock(true);
    try {
      const result = await window.MiimCloud.bot(action, payload);
      if (active !== generation || $('dashboard').hidden) return;
      if (action === 'status') feedback(!result.configured ? 'توکن سرور تنظیم نشده است.' : result.paired ? 'پیوی شما متصل است. برای اطمینان پیام آزمایشی بفرستید.' : 'توکن ثبت شده؛ هنوز پیوی مقصد تأیید نشده است. کد اتصال بسازید.');
      if (action === 'prepare') {
        code = result.code; $('bot-code').textContent = code; $('bot-code').hidden = false;
        feedback('این کد را کپی کنید و در پیوی @miimsite_bot بفرستید؛ سپس دکمهٔ تأیید اتصال را بزنید.');
      }
      if (action === 'connect') { code = ''; $('bot-code').hidden = true; feedback('پیوی متصل شد. حالا پیام آزمایشی را بزنید و دریافت آن را در روبیکا بررسی کنید.'); }
      if (action === 'test') feedback('روبیکا ارسال پیام آزمایشی را تأیید کرد؛ پیوی ربات را بررسی کنید.');
      if (action === 'inbox') renderOrders(result.orders || []);
      if (action === 'retry') {
        feedback('وضعیت تلاش ارسال: ' + (labels[result.delivery] || 'بدون تغییر؛ اتصال یا وضعیت سفارش را بررسی کنید.'));
        // Refresh is explicit to keep feedback visible and avoid sending twice.
      }
    } catch (error) { if (active === generation) feedback(error.message, true); }
    finally { if (active === generation) lock(false); }
  }
  function renderOrders(orders) {
    const root = $('bot-orders'); root.replaceChildren();
    if (!orders.length) { feedback('هنوز سفارشی ثبت نشده است.'); return; }
    feedback('۵۰ سفارش آخر؛ برای به‌روزرسانی وضعیت دوباره «دریافت سفارش‌ها» را بزنید.');
    for (const order of orders) {
      const card = document.createElement('article'); card.className = 'bot-order';
      const title = document.createElement('h3'); title.textContent = order.payload.name + ' — ' + order.payload.service;
      const status = document.createElement('p'); status.className = 'helper-text'; status.textContent = (labels[order.state] || order.state) + ' — ' + new Date(order.created_at).toLocaleString('fa-IR');
      const info = document.createElement('p'); info.textContent = 'موبایل: ' + order.payload.phone + ' | ایمیل: ' + (order.payload.email || '—') + ' | بودجه: ' + order.payload.budget;
      const message = document.createElement('p'); message.className = 'bot-order-message'; message.textContent = order.payload.message;
      const id = document.createElement('small'); id.dir = 'ltr'; id.textContent = order.id;
      card.append(title, status, info, message, id);
      if (order.state !== 'sent') {
        const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'outline-button'; retry.textContent = 'تلاش ارسال به روبیکا';
        retry.addEventListener('click', () => {
          const uncertain = ['uncertain','sending'].includes(order.state);
          if (!confirm(uncertain ? 'ممکن است پیام قبلاً رسیده باشد. ابتدا پیوی را بررسی کنید؛ تلاش دوباره می‌تواند پیام تکراری بفرستد. ادامه؟' : 'این سفارش به پیوی تأییدشده ارسال شود؟')) return;
          run('retry', { id: order.id });
        }); card.append(retry);
      }
      root.append(card);
    }
  }
  for (const [id, action] of [['bot-status','status'],['bot-prepare','prepare'],['bot-connect','connect'],['bot-test','test'],['bot-inbox','inbox']]) $(id).addEventListener('click', () => run(action, action === 'connect' ? { code } : {}));
  window.addEventListener('miim:dashboard', () => run('status'));
  window.addEventListener('miim:logout', () => {
    generation++; busy = false; code = ''; $('bot-code').textContent = ''; $('bot-code').hidden = true; $('bot-orders').replaceChildren(); feedback(''); lock(false);
  });
})();
