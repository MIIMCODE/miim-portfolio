/* Shared content contract: public CMS data only, never passwords or auth/session state. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MiimContent = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const MEDIA = 'https://jmpwryddrxmuwzmbmhsb.supabase.co/storage/v1/object/public/miim-media/';
  const platforms = ['rubika','instagram','telegram','whatsapp','linkedin','behance','dribbble','x','youtube','link'];
  const bad = message => { throw new Error(message); };
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : bad('ساختار اطلاعات معتبر نیست.');
  function text(value, max = 300, required = false) {
    if (value != null && typeof value !== 'string') bad('فیلد متنی معتبر نیست.');
    const result = String(value ?? '').replace(/[<>]/g, '');
    if (result.length > max) bad(`متن بیش از ${max} کاراکتر است.`);
    if (required && !result.trim()) bad('فیلدهای ضروری را کامل کنید.');
    return result;
  }
  function number(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) bad('مقدار عددی خارج از محدوده است.');
    return n;
  }
  function url(value, required = false) {
    const result = text(value, 2048).trim();
    if (!result && !required) return '';
    try { const u = new URL(result); if (['http:', 'https:'].includes(u.protocol) && !u.username && !u.password) return u.href; } catch {}
    return bad('لینک باید یک آدرس معتبر با http یا https باشد.');
  }
  function image(value) {
    const file = text(value, 600, true);
    const path = file.startsWith(MEDIA) ? file.slice(MEDIA.length) : file;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(png|jpe?g|webp|gif)$/i.test(path) || path.includes('..') || (!file.startsWith(MEDIA) && path.includes('/'))) bad('تصویر باید فایل محلی یا تصویر فضای رسانهٔ استودیو باشد.');
    return file;
  }
  function list(value, max, transform) {
    if (!Array.isArray(value) || value.length > max) bad('تعداد یا ساختار ردیف‌ها معتبر نیست.');
    return value.map((entry, index) => transform(entry, index));
  }
  const lines = value => list(value, 16, entry => text(entry, 400, true));
  function fields(value, shape) {
    const input = object(value), out = {};
    for (const [key, max] of Object.entries(shape)) out[key] = text(input[key], max);
    return out;
  }
  function clean(body) {
    object(body);
    const out = {};
    out.works = list(body.works, 300, value => {
      const w = object(value);
      const work = { file: image(w.file), ...fields(w, { title:150, tag:40, year:10, client:120, tools:200, description:1600 }), url: url(w.url) };
      if (!work.title.trim() || !work.tag.trim()) bad('عنوان و دستهٔ نمونه‌کار ضروری است.');
      if (work.tag.trim() === 'رابط کاربری') bad('نمونه‌کارها فقط باید در دسته‌های سایت و گرافیک باشند.');
      if (w.visible === false) work.visible = false;
      return work;
    });
    out.skills = list(body.skills, 30, value => ({ name:text(value.name,80,true), percent:number(value.percent,0,100), tag:text(value.tag,120) }));
    const c = object(body.contact);
    const phone = text(c.phone,30).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d+]/g,'');
    if (phone.replace(/\D/g,'').length < 10 || phone.length > 16) bad('شمارهٔ تماس معتبر نیست.');
    const email = text(c.email,120).trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad('ایمیل معتبر نیست.');
    out.contact = { ...fields(c,{eyebrow:150,heading:350,lead:1600,id:80,address:400}), phone,email, formspree:url(c.formspree), platforms:list(c.platforms,12,p=>({key:platforms.includes(p.key)?p.key:'link',label:text(p.label,50,true),url:url(p.url)})) };
    if (body.identity) {
      out.identity = { ...fields(body.identity,{brand:100,brandSub:180,name:100,roleFa:200,roleEn:200,availability:200,heroEyebrow:200,heroTitle:350,heroAccent:150,heroBio:2000}), available:body.identity.available !== false, photo:image(body.identity.photo),logo:image(body.identity.logo) };
      if (!out.identity.brand.trim() || !out.identity.heroTitle.trim()) bad('نام برند و عنوان هیرو ضروری است.');
    }
    if (body.about) out.about = { ...fields(body.about,{eyebrow:150,heading:350,text:4000}), highlights:lines(body.about.highlights) };
    if (body.services) out.services = list(body.services,20,(s,i)=>({id:text(s.id || `service-${i}`,80,true),icon:['code','layers','pen','play'].includes(s.icon)?s.icon:'code',...fields(s,{title:150,subtitle:150,badge:100,description:1600}),deliverables:lines(s.deliverables)}));
    if (body.stats) out.stats = list(body.stats,12,s=>({value:number(s.value,0,1e9),prefix:text(s.prefix,20),suffix:text(s.suffix,30),label:text(s.label,150,true),dynamicWorks:s.dynamicWorks === true}));
    if (body.process) out.process = list(body.process,12,s=>fields(s,{step:20,title:150,desc:1600}));
    if (body.testimonials) out.testimonials = list(body.testimonials,30,t=>({...fields(t,{name:100,role:150,quote:2000}),rating:Math.round(number(t.rating,1,5))}));
    if (body.footer) out.footer = fields(body.footer,{legal:1000});
    if (body.seo) out.seo = fields(body.seo,{title:180,description:400});
    out.theme = body.theme === 'light' ? 'light' : 'dark';
    out.updatedAt = new Date().toISOString();
    return out;
  }
  return { clean, image, url, MEDIA, platforms };
});
