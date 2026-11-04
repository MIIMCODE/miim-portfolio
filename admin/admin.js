/* Cloud-backed studio workspace. Database RLS is the authorization boundary. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cloud = window.MiimCloud;
  const PF = window.PF;
  let data = null;
  let revision = null;
  let dirty = false;
  let recovery = false;
  let currentUser = null;
  let busy = false;
  let baseline = null;
  let draftTimer = 0;
  const C = window.MiimContent;
  const CMS = window.MiimCMS;
  const draftKey = () => 'miim:draft:' + (currentUser?.id || '');
  function clearDraft() { clearTimeout(draftTimer); try { localStorage.removeItem(draftKey()); } catch {} $('draft-banner').hidden = true; }
  function offerDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey()) || 'null');
      $('draft-banner').hidden = !saved;
      if (saved) $('draft-details').textContent = 'ذخیرهٔ محلی: ' + new Date(saved.savedAt).toLocaleString('fa-IR') + (saved.revision !== revision ? ' — نسخهٔ ابری از آن زمان تغییر کرده است.' : ' — هنوز منتشر نشده است.');
    } catch { $('draft-banner').hidden = true; }
  }
  function rememberDraft() {
    clearTimeout(draftTimer);
    if (!currentUser || !dirty) return;
    draftTimer = setTimeout(() => {
      try {
        const draft = C.clean(readDraft());
        localStorage.setItem(draftKey(), JSON.stringify({ data:draft, revision, savedAt:new Date().toISOString() }));
        message('save-status','پیش‌نویس معتبر در این مرورگر ذخیره شد؛ برای اعمال عمومی منتشر کنید.');
      } catch { message('save-status','تغییرات هنوز منتشر نشده‌اند؛ فیلدهای ناقص را کامل کنید. ذخیرهٔ محلی ممکن است در دسترس نباشد.'); }
    }, 700);
  }
  let channel = null;
  try { channel = new BroadcastChannel('pf:sync'); } catch { /* Optional local notification. */ }
  const fa = value => new Intl.NumberFormat('fa-IR').format(value);
  const safeUrl = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  function message(id, text, error = false) { $(id).textContent = text; $(id).dataset.error = String(error); }
  function friendly(error) {
    const text = String(error?.message || error);
    if (/Invalid login credentials/i.test(text)) return 'نام کاربری یا رمز عبور درست نیست.';
    if (/Email not confirmed/i.test(text)) return 'ابتدا ایمیل تأیید حساب را در صندوق ایمیلت باز کن.';
    if (/rate limit|too many|security purposes/i.test(text)) return 'تعداد درخواست‌ها زیاد است. چند دقیقه دیگر دوباره تلاش کن.';
    if (/fetch|network|timeout|abort/i.test(text)) return 'ارتباط با فضای ابری برقرار نشد. اینترنت را بررسی و دوباره تلاش کن.';
    if (/email address.*(not authorized|invalid)/i.test(text)) return 'ارسال ایمیل به این آدرس مجاز نیست؛ تنظیمات SMTP پروژهٔ Supabase را بررسی کن.';
    if (/password.*(weak|short|least)/i.test(text)) return 'رمز قوی‌تری با حداقل ۸ کاراکتر انتخاب کن.';
    return /[\u0600-\u06ff]/.test(text) ? text : 'عملیات انجام نشد. وضعیت اتصال و دسترسی حساب را بررسی کن.';
  }
  function setDirty(value) {
    dirty = value;
    document.querySelector('.publish-bar').classList.toggle('is-dirty', value);
    $('draft-state').textContent = value ? 'تغییرات منتشرنشده داری' : 'همه‌چیز به‌روز است';
    if (value) rememberDraft();
    else clearTimeout(draftTimer);
  }
  function setBusy(value) {
    busy = value;
    for (const id of ['publish', 'download', 'refresh-content']) $(id).disabled = value;
    $('publish').textContent = value ? 'در حال پردازش…' : 'ذخیره و انتشار ↗';
    $('editor').querySelectorAll('input,textarea,select,button').forEach(el => { el.disabled = value; });
    CMS.lock(value);
    document.querySelectorAll('.history-list button').forEach(el=>{el.disabled=value;});
    for (const id of ['import-content','load-history','reset-draft','restore-draft','discard-draft']) $(id).disabled=value;
    // Prevent edits during a pending write from being accidentally marked as saved.
    $('works-editor').querySelectorAll('input,textarea').forEach(el => { el.disabled = value; });
    for (const key of ['phone', 'email', 'id']) $('contact-' + key).disabled = value;
  }
  function loginView() {
    clearTimeout(draftTimer);
    document.body.classList.remove('is-dashboard');
    $('dashboard').hidden = true;
    $('recovery-view').hidden = true;
    $('login-view').hidden = false;
    $('login-footer').hidden = false;
    $('password').value = '';
    $('password').type = 'password';
    $('toggle-password').setAttribute('aria-pressed', 'false');
    $('toggle-password').setAttribute('aria-label', 'نمایش رمز عبور');
    $('credentials-form').reset();
    currentUser = null;
    window.dispatchEvent(new Event('miim:logout'));
  }
  function showRecovery() {
    recovery = true;
    document.body.classList.remove('is-dashboard');
    $('dashboard').hidden = true;
    $('login-view').hidden = true;
    $('recovery-view').hidden = false;
    $('recovery-password').focus();
  }
  function field(parent, title, key, value, options = {}) {
    const label = document.createElement('label');
    if (options.full) label.className = 'full-field';
    label.textContent = title;
    const input = document.createElement(options.multiline ? 'textarea' : 'input');
    input.dataset.key = key;
    input.value = value || '';
    if (!options.multiline) input.type = options.type || 'text';
    if (options.max) input.maxLength = options.max;
    if (options.type === 'checkbox') input.checked = value !== false;
    input.required = Boolean(options.required);
    if (options.ltr) input.dir = 'ltr';
    label.append(input); parent.append(label);
  }
  function renderEditor() {
    const container = $('works-editor');
    CMS.render(data, { onChange: () => setDirty(true), onUpload: async file => {
      setBusy(true); try { await authorize(); return await cloud.upload(file); } finally { setBusy(false); }
    }});
    container.replaceChildren();
    data.works.forEach((work, i) => {
      const group = document.createElement('article');
      group.className = 'work-editor'; group.dataset.index = i;
      const cover = document.createElement('div'); cover.className = 'project-cover';
      const img = document.createElement('img'); img.src = CMS.imageSrc(work.file); img.alt = work.title || work.tag; img.loading = 'lazy';
      const tag = document.createElement('span'); tag.className = 'project-tag'; tag.textContent = work.tag;
      const index = document.createElement('span'); index.className = 'project-index'; index.textContent = String(i + 1).padStart(2, '0') + ' / SELECTED WORK';
      cover.append(img, tag, index);
      const actions = document.createElement('div'); actions.className='project-actions';
      const action=(label,run)=>{const b=document.createElement('button');b.type='button';b.className='outline-button';b.textContent=label;b.addEventListener('click',run);actions.append(b);};
      action('↑',()=>projectAction(i,'up')); action('↓',()=>projectAction(i,'down'));
      action('کپی',()=>projectAction(i,'copy')); action('حذف',()=>projectAction(i,'delete'));
      const fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='image/jpeg,image/png,image/webp,image/gif';fileInput.hidden=true;
      action('تغییر تصویر',()=>fileInput.click());actions.append(fileInput);
      fileInput.addEventListener('change',async()=>{
        const file=fileInput.files[0];if(!file)return;const draft=readDraft();setBusy(true);
        try {await authorize();draft.works[i].file=await cloud.upload(file);data=draft;renderEditor();setDirty(true);message('save-status','تصویر آپلود شد؛ برای نمایش عمومی منتشر کنید.');}
        catch(error){message('save-status',friendly(error),true);}finally{setBusy(false);}
      });
      group.append(actions);
      const fields = document.createElement('div'); fields.className = 'project-fields';
      const titleRow = document.createElement('div'); titleRow.className = 'project-title-row';
      const titleWrap = document.createElement('div'); const title = document.createElement('h3'); title.textContent = work.title || work.tag;
      const subtitle = document.createElement('small'); subtitle.textContent = [work.client, work.year].filter(Boolean).join(' / '); titleWrap.append(title, subtitle); titleRow.append(titleWrap);
      const link = safeUrl(work.url);
      if (link) { const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = '↗'; a.setAttribute('aria-label', 'مشاهده سایت ' + work.title); titleRow.append(a); }
      const grid = document.createElement('div'); grid.className = 'admin-grid';
      field(grid, 'نمایش در سایت', 'visible', work.visible, { type: 'checkbox' });
      field(grid, 'عنوان پروژه', 'title', work.title, { max: 150, required: true, full: true });
      field(grid, 'دسته‌بندی', 'tag', work.tag, { max: 40, required: true });
      field(grid, 'سال اجرا', 'year', work.year, { max: 10 });
      field(grid, 'کارفرما / برند', 'client', work.client, { max: 120 });
      field(grid, 'ابزارها', 'tools', work.tools, { max: 200 });
      field(grid, 'لینک سایت (اختیاری)', 'url', work.url, { type: 'url', ltr: true, max: 2048, full: true });
      field(grid, 'داستان پروژه', 'description', work.description, { multiline: true, max: 1600, full: true });
      fields.append(titleRow, grid); group.append(cover, fields); container.append(group);
    });
    for (const key of ['phone', 'email', 'id']) $('contact-' + key).value = data.contact[key] || '';
    $('work-count').textContent = fa(data.works.filter(w=>w.visible !== false).length);
    $('nav-count').textContent = fa(data.works.length);
    $('web-count').textContent = fa(data.works.filter(w => w.visible !== false && safeUrl(w.url)).length);
    $('cloud-status').textContent = 'دیتابیس متصل و آمادهٔ انتشار';
    $('revision-label').textContent = 'نسخهٔ ' + fa(revision) + ' محتوا';
    const category=$('project-category');const selected=category.value;
    category.replaceChildren(new Option('همهٔ دسته‌ها','ALL'));
    for(const tag of new Set(data.works.map(w=>w.tag)))category.add(new Option(tag,tag));
    category.value=Array.from(category.options).some(o=>o.value===selected)?selected:'ALL';
    filterProjects();
    const date = new Date(data.updatedAt || '');
    $('last-update').textContent = Number.isNaN(date.getTime()) ? 'همین حالا' : new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' }).format(date);
  }
  async function authorize() {
    const session = await cloud.session();
    if (!session) { loginView(); throw new Error('نشست پایان یافته است. دوباره وارد شو.'); }
    if (!await cloud.isAdmin()) { await cloud.logout(); loginView(); throw new Error('این حساب اجازهٔ مدیریت رسانه میم را ندارد.'); }
    currentUser = session.user;
    return session;
  }
  async function readContent() {
    const response = await fetch('../data.json', { cache: 'no-store', signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error('دریافت نسخهٔ پایهٔ محتوا ممکن نشد.');
    const snapshot = await response.json();
    baseline = snapshot;
    const row = await cloud.read();
    data = { ...snapshot, ...row.data, contact: { ...snapshot.contact, ...row.data.contact } };
    delete data.authHash;
    data.works = data.works.filter(w => (w.tag || '').trim() !== 'رابط کاربری');
    revision = row.revision;
    renderEditor(); setDirty(false); offerDraft();
  }
  async function openDashboard(animate = false) {
    await authorize();
    await readContent();
    if (recovery) { showRecovery(); return; }
    if (animate) {
      document.querySelector('.login-layout').classList.add('is-unlocked');
      message('login-error', 'احراز هویت موفق؛ به استودیو خوش آمدی.');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(resolve => setTimeout(resolve, 700));
    }
    document.body.classList.add('is-dashboard');
    document.querySelector('.login-layout').classList.remove('is-unlocked');
    $('login-view').hidden = true; $('recovery-view').hidden = true; $('dashboard').hidden = false;
    $('password').value = ''; $('account-email').textContent = currentUser.email;
    $('dashboard-title').focus();
    message('status', 'متصل به Supabase');
    window.dispatchEvent(new Event('miim:dashboard'));
  }
  function readDraft() {
    const works = Array.from(document.querySelectorAll('.work-editor'), group => {
      const work = { ...data.works[Number(group.dataset.index)] };
      group.querySelectorAll('[data-key]').forEach(input => { work[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value; });
      if (work.tag.trim() === 'رابط کاربری') throw new Error('دستهٔ رابط کاربری از ویترین حذف شده است. دستهٔ سایت یا گرافیک انتخاب کن.');
      return work;
    });
    const contact = { ...data.contact };
    for (const key of ['phone', 'email', 'id']) contact[key] = $('contact-' + key).value;
    return CMS.collect({ ...data, works, contact });
  }
  function collect() { return C.clean(readDraft()); }
  function filterProjects() {
    const query=$('project-search').value.trim().toLocaleLowerCase('fa');const category=$('project-category').value;
    let count=0;
    document.querySelectorAll('.work-editor').forEach(card=>{
      const get=key=>card.querySelector(`[data-key="${key}"]`).value;
      const match=(!query || [get('title'),get('tag'),get('client')].join(' ').toLocaleLowerCase('fa').includes(query)) && (category==='ALL'||get('tag')===category);
      card.hidden=!match;if(match)count++;
    });
    $('project-results').textContent=fa(count)+' نتیجه از '+fa(data.works.length)+' پروژه';
    $('projects-no-results').hidden=count>0;
  }
  function projectAction(index,action) {
    if(busy)return;
    const draft=readDraft();
    if(action==='delete'){if(!confirm('این پروژه از پیش‌نویس حذف شود؟ تصویر آن از فضای رسانه پاک نمی‌شود.'))return;draft.works.splice(index,1);}
    if(action==='copy'){if(draft.works.length>=300)return;const copy={...draft.works[index],title:draft.works[index].title+' (کپی)',visible:false};draft.works.splice(index+1,0,copy);}
    if(action==='up'&&index>0)[draft.works[index-1],draft.works[index]]=[draft.works[index],draft.works[index-1]];
    if(action==='down'&&index<draft.works.length-1)[draft.works[index+1],draft.works[index]]=[draft.works[index],draft.works[index+1]];
    data=draft;renderEditor();setDirty(true);
  }

  async function save() {
    if (busy) return;
    $('editor').querySelectorAll('details:has(:invalid)').forEach(el=>{el.open=true;});
    if (!$('editor').reportValidity()) return;
    const next = collect();
    setBusy(true);
    try {
      await authorize();
      const row = await cloud.save(next, revision);
      data = row.data; revision = row.revision; clearDraft(); setDirty(false); renderEditor();
      channel?.postMessage('saved');
      message('save-status', 'ذخیره و منتشر شد؛ محتوای جدید برای همهٔ بازدیدکننده‌ها نمایش داده می‌شود.');
      // Notification failure must never turn a successful publication into a failed save.
      cloud.bot('published', { revision }).then(result => {
        if (!$('dashboard').hidden && result.delivery !== 'sent' && result.delivery !== 'already_attempted') message('bot-feedback','محتوا منتشر شد؛ اعلان روبیکا ارسال نشد. اتصال را بررسی کنید.',true);
      }).catch(() => { if (!$('dashboard').hidden) message('bot-feedback','محتوا منتشر شد؛ ارتباط اعلان روبیکا برقرار نشد.',true); });
    } finally { setBusy(false); }
  }
  async function load() {
    $('retry').hidden = true;
    message('status', 'در حال بررسی اتصال امن…');
    try {
      if (!cloud || !PF || !C || !CMS) throw new Error('فایل‌های پنل بارگذاری نشدند. صفحه را بازخوانی کن.');
      const session = await cloud.session();
      if (recovery) { showRecovery(); return; }
      if (session) await openDashboard();
      else { loginView(); $('username').focus(); message('status', 'ورود با حساب تأییدشدهٔ مدیر'); }
    } catch (error) {
      loginView(); message('status', friendly(error), true); $('retry').hidden = false;
    }
  }
  $('retry').addEventListener('click', load);
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    $('login-submit').disabled = true;
    document.body.classList.add('is-signing-in');
    $('login-submit-label').textContent = 'در حال ورود…';
    message('login-error', 'در حال ارتباط با حساب شما…');
    try {
      const email = $('username').value.trim();
      const password = $('password').value;
      await cloud.login(email, password); await openDashboard(true); message('login-error', '');
    } catch (error) {
      message('login-error', friendly(error), true);
      const panel = document.querySelector('.login-form-panel');
      panel.classList.remove('is-rejected'); void panel.offsetWidth; panel.classList.add('is-rejected');
    }
    finally {
      $('login-submit').disabled = false; document.body.classList.remove('is-signing-in');
      $('login-submit-label').textContent = 'ورود به اتاق فرمان';
    }
  });
  $('forgot-password').addEventListener('click', async () => {
    if (!$('username').reportValidity()) return;
    $('forgot-password').disabled = true;
    try { await cloud.recover($('username').value.trim()); message('login-error', 'اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود. صندوق ایمیل و Spam را بررسی کن.'); }
    catch (error) { message('login-error', friendly(error), true); }
    finally { $('forgot-password').disabled = false; }
  });
  $('toggle-password').addEventListener('click', () => {
    const show = $('password').type === 'password';
    $('password').type = show ? 'text' : 'password';
    $('toggle-password').setAttribute('aria-pressed', String(show));
    $('toggle-password').setAttribute('aria-label', show ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
  });
  $('logout').addEventListener('click', async () => {
    if (busy || (dirty && !confirm('تغییرات منتشرنشده کنار گذاشته شوند؟'))) return;
    try { clearDraft(); await cloud.logout(); setDirty(false); loginView(); message('status', 'از حساب خارج شدی.'); }
    catch (error) { message('status', friendly(error), true); }
  });
  $('editor').addEventListener('input', event => { if(['project-search','project-category'].includes(event.target.id)){filterProjects();return;}setDirty(true); });
  $('editor').addEventListener('submit', async event => { event.preventDefault(); try { await save(); } catch (error) { message('save-status', friendly(error), true); } });
  $('refresh-content').addEventListener('click', async () => {
    if (busy || (dirty && !confirm('تغییرات منتشرنشده با نسخهٔ ابری جایگزین شوند؟'))) return;
    setBusy(true);
    try { await authorize(); await readContent(); clearDraft(); message('save-status', 'آخرین نسخهٔ ابری دریافت شد.'); }
    catch (error) { message('save-status', friendly(error), true); }
    finally { setBusy(false); }
  });
  $('download').addEventListener('click', async () => {
    try {
      await authorize();
      if (!$('editor').reportValidity()) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(collect(), null, 2) + '\n'], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'data.json'; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message('save-status', 'نسخهٔ پشتیبان دریافت شد؛ دریافت فایل، تغییرات را منتشر نمی‌کند.');
    } catch (error) { message('save-status', friendly(error), true); }
  });
  $('credentials-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try {
      await authorize();
      if ($('new-password').value !== $('confirm-password').value) throw new Error('رمز جدید و تکرار آن یکسان نیستند.');
      await cloud.login(currentUser.email, $('current-password').value);
      await cloud.password($('new-password').value);
      $('credentials-form').reset(); message('credentials-status', 'رمز عبور حساب ابری به‌روزرسانی شد.');
    } catch (error) { message('credentials-status', friendly(error), true); }
    finally { button.disabled = false; }
  });
  $('recovery-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button'); button.disabled = true;
    try {
      if ($('recovery-password').value !== $('recovery-confirm').value) throw new Error('رمز جدید و تکرار آن یکسان نیستند.');
      await cloud.password($('recovery-password').value);
      recovery = false; $('recovery-form').reset();
      await openDashboard();
    } catch (error) { message('recovery-status', friendly(error), true); }
    finally { button.disabled = false; }
  });
  document.querySelectorAll('.side-nav a').forEach(a => a.addEventListener('click', () => {
    const target=document.querySelector(a.getAttribute('href'));if(target?.tagName==='DETAILS')target.open=true;
    document.querySelectorAll('.side-nav a').forEach(link => link.classList.toggle('is-active', link === a));
  }));
  $('project-search').addEventListener('input',filterProjects);
  $('project-category').addEventListener('change',filterProjects);
  $('add-project').addEventListener('click',()=>{
    if(busy)return;const draft=readDraft();if(draft.works.length>=300)return;
    draft.works.push({file:'proj-1.jpg',title:'پروژهٔ جدید',tag:'طراحی وب',year:'',client:'',tools:'',description:'',url:'',visible:false});
    data=draft;$('project-search').value='';$('project-category').value='ALL';renderEditor();setDirty(true);
    document.querySelector('.work-editor:last-child').scrollIntoView({block:'center',behavior:'smooth'});
  });
  $('discard-draft').addEventListener('click',()=>{if(confirm('پیش‌نویس محلی حذف شود؟'))clearDraft();});
  $('restore-draft').addEventListener('click',()=>{
    try {const saved=JSON.parse(localStorage.getItem(draftKey())||'null');if(!saved)return;
      if(!confirm('پیش‌نویس محلی جایگزین فرم فعلی شود؟ نسخهٔ عمومی تا انتشار تغییر نمی‌کند.'))return;
      data=C.clean({...baseline,...saved.data});renderEditor();setDirty(true);$('draft-banner').hidden=true;
    }catch(error){message('save-status',friendly(error),true);}
  });
  $('reset-draft').addEventListener('click',()=>$('refresh-content').click());
  $('import-content').addEventListener('click',()=>$('import-file').click());
  $('import-file').addEventListener('change',async()=>{
    const file=$('import-file').files[0];if(!file||busy)return;
    setBusy(true);
    try {await authorize();if(file.size>1024*1024)throw new Error('فایل پشتیبان نباید بیش از یک مگابایت باشد.');
      const imported=JSON.parse(await file.text());
      if(!Array.isArray(imported.works)||!Array.isArray(imported.skills)||!imported.contact)throw new Error('فایل پشتیبان سایت معتبر نیست.');
      const next=C.clean({...baseline,...imported});
      if(!confirm('محتوای فایل جایگزین پیش‌نویس فعلی شود؟ هنوز منتشر نمی‌شود.'))return;
      data=next;renderEditor();setDirty(true);message('backup-status','فایل به پیش‌نویس وارد شد؛ برای اعمال عمومی منتشر کنید.');
    }catch(error){message('backup-status',friendly(error),true);}finally{$('import-file').value='';setBusy(false);}
  });
  $('load-history').addEventListener('click',async()=>{
    $('load-history').disabled=true;
    try {await authorize();const rows=await cloud.history();const list=$('history-list');list.replaceChildren();
      for(const row of rows){const item=document.createElement('div');item.className='history-row';const label=document.createElement('span');label.textContent='نسخهٔ '+fa(row.revision)+' — '+new Date(row.saved_at).toLocaleString('fa-IR');
        const restore=document.createElement('button');restore.type='button';restore.className='outline-button';restore.textContent='بازیابی به پیش‌نویس';
        restore.addEventListener('click',async()=>{if(busy)return;if(!confirm('این نسخه جایگزین پیش‌نویس فعلی شود؟ هنوز منتشر نمی‌شود.'))return;setBusy(true);restore.disabled=true;
          try {await authorize();const saved=await cloud.revision(row.revision);data=C.clean({...baseline,...saved.data});renderEditor();setDirty(true);message('backup-status','نسخهٔ قبلی به فرم بازگردانده شد؛ برای اعمال عمومی منتشر کنید.');}
          catch(error){message('backup-status',friendly(error),true);}finally{setBusy(false);restore.disabled=false;}
        });item.append(label,restore);list.append(item);
      }message('backup-status',rows.length?'تاریخچه دریافت شد.':'پس از انتشار بعدی، نسخهٔ قبلی در تاریخچه ظاهر می‌شود.');
    }catch(error){message('backup-status',friendly(error),true);}finally{$('load-history').disabled=false;}
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&!$('dashboard').hidden){event.preventDefault();$('editor').requestSubmit();}
  });
  cloud?.onAuth(event => {
    // Supabase warns against awaiting auth API calls inside the auth callback.
    if (event === 'PASSWORD_RECOVERY') { recovery = true; setTimeout(showRecovery, 0); }
    if (event === 'SIGNED_OUT') setTimeout(() => { loginView(); message('status', 'نشست حساب پایان یافت. برای ادامه وارد شو.'); }, 0);
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  load();
})();
