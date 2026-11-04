// Mocked API integration tests: no production auth users, emails or writes are created.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, '../data.json'), 'utf8'));
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
(async () => {
  const serverless = process.env.SERVERLESS_CHROMIUM ? require('@sparticuz/chromium').default : null;
  const browser = await chromium.launch(serverless ? { executablePath: await serverless.executablePath(), args: serverless.args.filter(a => a !== '--single-process'), headless: true } : { headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let row = { data: structuredClone(snapshot), revision: 2, updated_at: new Date().toISOString() };
    const history = [];
    let uploads=0;
    let botPaired=false, botRejectOrder=false, botDelivery='queued';
    const orderRequests=[], botCalls=[];
    let failWrite = false;
    let allowAdmin = true;
    let password = 'cloud-test-password';
    let recovered = false;
    const id = randomUUID();
    const user = { id, aud: 'authenticated', role: 'authenticated', email: 'resane.miim@gmail.com', email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
    const token = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify({ sub: id, email: user.email, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.test';
    const session = () => ({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'mock-refresh', user });
    await context.route('https://jmpwryddrxmuwzmbmhsb.supabase.co/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const body = request.headers()['content-type']?.includes('application/json') ? request.postDataJSON() : null;
      const send = (json, status = 200) => route.fulfill({ status, json });
      if (url.pathname === '/functions/v1/miim-rubika') {
        botCalls.push(body);
        if(body.action==='status')return send({configured:true,paired:botPaired});
        if(body.action==='prepare')return send({code:'MIIM-0123456789abcdef0123456789abcdef',expiresIn:600});
        if(body.action==='connect'){botPaired=true;return send({ok:true,paired:true});}
        if(body.action==='test')return send({ok:true});
        if(body.action==='published')return send({delivery:'sent'});
        if(body.action==='inbox')return send({orders:[{id:'d45ebbec-ff4d-48b8-8860-177795b29d2d',payload:{name:'مشتری آزمایشی',phone:'09123456789',service:'وب',budget:'شرکتی',message:'<script>alert(1)</script>',email:''},state:'failed',created_at:new Date().toISOString()}]});
        if(body.action==='retry')return send({delivery:'sent'});
        if(body.action==='order'){orderRequests.push(body);return botRejectOrder?send({ok:false,error:'service_unavailable'},503):send({ok:true,id:body.id,delivery:botDelivery});}
        throw new Error('Unknown bot action');
      }
      if (url.pathname === '/auth/v1/token') {
        if (['refresh_token', 'pkce'].includes(url.searchParams.get('grant_type'))) return send(session());
        assert.equal(body.email, user.email);
        return body.password === password ? send(session()) : send({ msg: 'Invalid login credentials', error_code: 'invalid_credentials' }, 400);
      }
      if (url.pathname === '/auth/v1/user') {
        if (request.method() === 'PUT') password = body.password;
        return send(user);
      }
      if (url.pathname === '/auth/v1/recover') { recovered = true; return send({}); }
      if (url.pathname === '/auth/v1/logout') return send({});
      if (url.pathname === '/rest/v1/rpc/miim_is_admin') return send(allowAdmin);
      if (url.pathname === '/rest/v1/miim_content') {
        if (request.method() === 'PATCH') {
          if (failWrite) return send({ message: 'permission denied', code: '42501' }, 403);
          if (url.searchParams.get('revision') !== 'eq.' + row.revision) return send(null);
          history.unshift({data:structuredClone(row.data),revision:row.revision,saved_at:row.updated_at});
          row = { data: { ...body.data, updatedAt: new Date().toISOString() }, revision: row.revision + 1, updated_at: new Date().toISOString() };
        }
        return send(row);
      }
      if (url.pathname === '/rest/v1/miim_revisions') {
        const revision=url.searchParams.get('revision');
        return send(revision?history.find(r=>'eq.'+r.revision===revision):history.map(({data,...r})=>r));
      }
      if (url.pathname.startsWith('/storage/v1/object/miim-media/uploads/') && request.method()==='POST') { uploads++;return send({Key:url.pathname.split('/object/')[1]}); }
      if (url.pathname.startsWith('/storage/v1/object/public/miim-media/')) return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ8sAAAAASUVORK5CYII=','base64')});
      throw new Error('Unexpected mock request ' + request.url());
    });
    await page.goto(base + '/');
    await page.locator('.nav__admin').click();
    await page.waitForURL('**/admin/**');
    await page.locator('#username').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#dashboard').isVisible(), false);
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'login-desktop.png'), fullPage: true });
    await page.locator('#username').fill('mojtaba');
    await page.locator('#password').fill('wrong-password');
    await page.locator('#login-submit').click();
    await page.waitForFunction(() => document.getElementById('login-error').dataset.error === 'true');
    assert.equal(await page.locator('#dashboard').isVisible(), false);
    await page.locator('#forgot-password').click();
    await page.waitForFunction(() => !document.getElementById('forgot-password').disabled);
    assert.equal(recovered, true);
    await page.locator('#password').fill(password);
    await page.locator('#toggle-password').click();
    assert.equal(await page.locator('#password').getAttribute('type'), 'text');
    await page.locator('#login-submit').click();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    await page.reload();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.work-editor').count(), 4);
    assert.notEqual(await page.locator('#dashboard-title').evaluate(el=>getComputedStyle(el).userSelect),'none');
    await page.waitForFunction(()=>document.getElementById('bot-feedback').textContent.includes('هنوز پیوی'));
    await page.locator('#bot-prepare').click();
    await page.locator('#bot-code').waitFor({state:'visible'});
    assert.match(await page.locator('#bot-code').textContent(),/^MIIM-/);
    await page.locator('#bot-connect').click();
    await page.waitForFunction(()=>document.getElementById('bot-feedback').textContent.includes('پیوی متصل شد'));
    await page.locator('#bot-test').click();
    await page.waitForFunction(()=>document.getElementById('bot-feedback').textContent.includes('ارسال پیام آزمایشی'));
    await page.locator('#bot-inbox').click();
    await page.locator('.bot-order').waitFor({state:'visible'});
    assert.match(await page.locator('.bot-order-message').textContent(),/<script>alert/);
    assert.equal(await page.locator('.bot-order script').count(),0);
    page.once('dialog',d=>d.accept());await page.locator('.bot-order button').click();
    await page.waitForFunction(()=>document.getElementById('bot-feedback').textContent.includes('ارسال‌شده'));

    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'dashboard-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'dashboard-mobile.png'), fullPage: true });
    await page.locator('.work-editor [data-key=title]').first().fill('عنوان آزمایشی سایت');
    await page.locator('#publish').click();
    await page.waitForFunction(() => !document.getElementById('publish').disabled);
    assert.equal(row.data.works[0].title, 'عنوان آزمایشی سایت');
    assert.equal(row.data.works[0].url, snapshot.works[0].url);
    assert.ok(row.data.identity.heroTitle);
    assert.ok(row.data.contact.formspree);
    assert.equal(row.data.skills[0].tag, 'Figma');
    assert.equal('authHash' in row.data, false);
    // Expanded CMS: structural project operations must preserve all in-progress edits.
    await page.locator('#project-search').fill('استایلند');
    assert.equal(await page.locator('.work-editor:visible').count(),1);
    await page.locator('#project-search').fill('');
    await page.locator('.work-editor').first().getByRole('button',{name:'کپی',exact:true}).click();
    assert.equal(await page.locator('.work-editor').count(),5);
    assert.equal(await page.locator('.work-editor').nth(1).locator('[data-key=visible]').isChecked(),false);
    page.once('dialog',d=>d.accept());
    await page.locator('.work-editor').nth(1).getByRole('button',{name:'حذف',exact:true}).click();
    assert.equal(await page.locator('.work-editor').count(),4);
    await page.locator('#add-project').click();
    const added=page.locator('.work-editor').last();
    await added.locator('[data-key=title]').fill('پروژهٔ جدید آزمایشی');
    await added.locator('[data-key=tag]').fill('گرافیک');
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ8sAAAAASUVORK5CYII=','base64');
    await added.locator('input[type=file]').setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
    await page.waitForFunction(()=>!document.getElementById('publish').disabled);
    assert.equal(uploads,1);
    assert.match(await page.locator('.work-editor').last().locator('.project-cover img').getAttribute('src'),/storage\/v1\/object\/public\/miim-media\/uploads/);
    // Newly added projects are hidden until the manager explicitly enables them.
    assert.equal(await page.locator('.work-editor').last().locator('[data-key=visible]').isChecked(),false);
    await page.locator('.work-editor').last().locator('[data-key=visible]').check();
    await page.locator('#identity-section > summary').click();
    await page.locator('#identity-section [data-cms-key=heroTitle]').fill('تیتر آزمایشی استودیو');
    await page.locator('#identity-section [data-cms-key=heroAccent]').fill('استودیو');
    await page.locator('#services-section > summary').click();
    await page.locator('#services-section').getByRole('button',{name:'＋ افزودن ردیف',exact:true}).click();
    await page.locator('#services-section .cms-row').last().locator('[data-cms-key=title]').fill('خدمت جدید آزمایشی');
    await page.locator('#services-section .cms-row').last().locator('[data-cms-key=deliverables]').fill('خروجی اول\nخروجی دوم');
    await page.locator('#seo-section > summary').click();
    await page.locator('#seo-section [data-cms-key=title]').fill('عنوان سئوی آزمایشی');
    await page.locator('#seo-section [data-cms-key=description]').fill('توضیح متای آزمایشی');
    await page.locator('#publish').click();
    await page.waitForFunction(()=>!document.getElementById('publish').disabled);
    assert.equal(row.data.works.length,5);
    assert.equal(row.data.identity.heroTitle,'تیتر آزمایشی استودیو');
    assert.equal(row.data.services.at(-1).title,'خدمت جدید آزمایشی');
    assert.deepEqual(row.data.services.at(-1).deliverables,['خروجی اول','خروجی دوم']);
    assert.equal(row.data.seo.title,'عنوان سئوی آزمایشی');
    // Reorder projects and collection rows, then delete a temporary row.
    await page.locator('.work-editor').last().getByRole('button',{name:'↑',exact:true}).click();
    assert.equal(await page.locator('.work-editor').nth(3).locator('[data-key=title]').inputValue(),'پروژهٔ جدید آزمایشی');
    await page.locator('.work-editor').nth(3).getByRole('button',{name:'↓',exact:true}).click();
    const movedService=(await page.locator('#services-section .cms-row').count())-2;
    await page.locator('#services-section .cms-row').last().getByRole('button',{name:'↑',exact:true}).click();
    assert.equal(await page.locator('#services-section .cms-row').nth(movedService).locator('[data-cms-key=title]').inputValue(),'خدمت جدید آزمایشی');
    await page.locator('#services-section .cms-row').nth(movedService).getByRole('button',{name:'↓',exact:true}).click();
    await page.locator('#services-section').getByRole('button',{name:'＋ افزودن ردیف',exact:true}).click();
    page.once('dialog',d=>d.accept());await page.locator('#services-section .cms-row').last().getByRole('button',{name:'حذف',exact:true}).click();
    // Auto-saved draft is offered after reload, never silently published.
    await page.locator('.work-editor [data-key=title]').first().fill('پیش‌نویس بازیابی‌شده');
    await page.waitForFunction(()=>Object.keys(localStorage).filter(k=>k.startsWith('miim:draft:')).some(k=>JSON.parse(localStorage.getItem(k)).data.works[0].title==='پیش‌نویس بازیابی‌شده'));
    page.once('dialog',d=>d.accept());
    await page.reload();await page.locator('#dashboard').waitFor({state:'visible'});
    await page.locator('#draft-banner').waitFor({state:'visible'});
    page.once('dialog',d=>d.accept());await page.locator('#restore-draft').click();
    assert.equal(await page.locator('.work-editor [data-key=title]').first().inputValue(),'پیش‌نویس بازیابی‌شده');
    assert.equal(row.data.works[0].title,'عنوان آزمایشی سایت');
    page.once('dialog',d=>d.accept());await page.locator('#refresh-content').click();
    await page.waitForFunction(()=>!document.getElementById('publish').disabled && document.getElementById('save-status').textContent.includes('آخرین نسخه'));
    // Restore history only into a draft, and do not change the cloud until Publish.
    await page.locator('#load-history').click();
    await page.locator('.history-row').first().waitFor({state:'visible'});
    const cloudRevision=row.revision;
    page.once('dialog',d=>d.accept());await page.locator('.history-row').first().locator('button').click();
    await page.waitForFunction(()=>document.getElementById('backup-status').textContent.includes('فرم بازگردانده'));
    assert.equal(row.revision,cloudRevision);
    page.once('dialog',d=>d.accept());await page.locator('#refresh-content').click();
    await page.waitForFunction(()=>!document.getElementById('publish').disabled && document.getElementById('save-status').textContent.includes('آخرین نسخه'));
    await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{invalid json')});
    await page.waitForFunction(()=>document.getElementById('backup-status').dataset.error==='true');
    assert.equal(row.revision,cloudRevision);
    const imported=structuredClone(snapshot);imported.identity.brand='برند فایل پشتیبان';
    page.once('dialog',d=>d.accept());
    await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
    await page.waitForFunction(()=>document.getElementById('backup-status').textContent.includes('فایل به پیش‌نویس'));
    assert.equal(await page.locator('#identity-section [data-cms-key=brand]').inputValue(),'برند فایل پشتیبان');
    assert.notEqual(row.data.identity.brand,imported.identity.brand);
    page.once('dialog',d=>d.accept());await page.locator('#refresh-content').click();
    await page.waitForFunction(()=>!document.getElementById('publish').disabled && document.getElementById('save-status').textContent.includes('آخرین نسخه'));

    // Failed requests retain the draft and cannot show a successful publish.
    failWrite = true;
    await page.locator('.work-editor [data-key=title]').first().fill('پیش‌نویس ذخیره‌نشده');
    await page.locator('#publish').click();
    await page.waitForFunction(() => document.getElementById('save-status').dataset.error === 'true');
    assert.equal(row.data.works[0].title, 'عنوان آزمایشی سایت');
    assert.match(await page.locator('#draft-state').textContent(), /منتشرنشده/);
    failWrite = false;
    // Conflict: a second editor has saved since the last read.
    row.revision += 1;
    await page.locator('#publish').click();
    await page.waitForFunction(() => document.getElementById('save-status').textContent.includes('نسخهٔ جدیدتری'));
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#refresh-content').click();
    await page.waitForFunction(() => document.getElementById('save-status').textContent.includes('آخرین نسخه'));
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download').click();
    const download = await downloadPromise;
    const output = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(output.works[0].title, row.data.works[0].title);
    // Cloud, not an old local draft, drives the public website.
    const home = await context.newPage();
    await home.goto(base + '/');
    await home.waitForFunction(() => document.getElementById('stage-active-title').textContent === 'عنوان آزمایشی سایت');
    assert.equal(await home.title(),'عنوان سئوی آزمایشی');
    assert.equal(await home.locator('meta[name=description]').getAttribute('content'),'توضیح متای آزمایشی');
    assert.match(await home.locator('#service-chips').textContent(),/خدمت جدید آزمایشی/);
    assert.match(await home.locator('#hero-title').textContent(),/تیتر آزمایشی/);
    assert.equal(await home.locator('.stage-card').count(),5);
    assert.match(await home.locator('.stage-card').last().locator('img').getAttribute('src'),/storage\/v1\/object\/public\/miim-media/);
    // Rubika uses the supplied local icon and a safe new-tab link.
    const rubika=home.locator('#social-links a[href="https://rubika.ir/MIIM_DEV"]');
    assert.equal(await rubika.count(),1);
    assert.match(await rubika.textContent(),/روبیکا/);
    assert.equal(await rubika.getAttribute('target'),'_blank');
    assert.match(await rubika.getAttribute('rel'),/noopener/);
    assert.equal(await rubika.locator('img').getAttribute('src'),'Image/rubika.png');
    await home.waitForFunction(()=>document.querySelector('#social-links img').complete && document.querySelector('#social-links img').naturalWidth>0);
    assert.equal(await home.locator('#badge-logo').getAttribute('draggable'),'false');
    for(const type of ['contextmenu','dragstart','selectstart']) {
      assert.equal(await home.locator('#badge-logo').evaluate((el,type)=>!el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})),type),true);
      assert.equal(await home.locator('.stage-card__overlay').first().evaluate((el,type)=>!el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})),type),true);
      assert.equal(await home.locator('#order-form input:not([type=hidden])').first().evaluate((el,type)=>!el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})),type),false);
    }
    for(const type of ['dragstart','selectstart']) {
      for(const selector of ['#hero-title','#c-mail-link','[data-bind=contactLead]']) {
        assert.equal(await home.locator(selector).evaluate((el,type)=>!el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})),type),true);
      }
    }
    assert.equal(await home.locator('#hero-title').evaluate(el=>getComputedStyle(el).userSelect),'none');
    // Real mouse selection on public text should produce no selection.
    const publicText=home.locator('[data-bind=contactLead]');
    await publicText.scrollIntoViewIfNeeded();
    await home.evaluate(()=>getSelection().removeAllRanges());
    const textBox=await publicText.boundingBox();
    await home.mouse.move(textBox.x+textBox.width-5,textBox.y+10);
    await home.mouse.down();
    await home.mouse.move(textBox.x+5,textBox.y+textBox.height-5,{steps:12});
    await home.mouse.up();
    assert.equal(await home.evaluate(()=>getSelection().toString()),'');
    assert.equal(await home.locator('#c-mail-link').evaluate(el=>el.dispatchEvent(new Event('contextmenu',{bubbles:true,cancelable:true}))),true);
    await home.locator('#order-form input[name=name]').fill('آزمایش فرم');
    assert.equal(await home.locator('#order-form input[name=name]').inputValue(),'آزمایش فرم');
    const nameField=home.locator('#order-form input[name=name]');
    assert.equal(await nameField.evaluate(el=>getComputedStyle(el).userSelect),'text');
    await nameField.press('ControlOrMeta+A');
    assert.equal(await nameField.evaluate(el=>el.selectionEnd-el.selectionStart),'آزمایش فرم'.length);
    await nameField.press('Backspace');
    await nameField.fill('فرم همچنان قابل ویرایش است');
    await home.evaluate(()=>{const img=document.createElement('img');img.id='dynamic-guard-test';document.body.append(img);});
    await home.waitForFunction(()=>document.getElementById('dynamic-guard-test').draggable===false);
    // Actual SDK form submission: failure retains fields and retry reuses the request ID.
    botRejectOrder=true;
    await home.locator('#f-name').fill('سفارش آزمایشی');
    await home.locator('#f-phone').fill('09123456789');
    await home.locator('#f-msg').fill('پیام نمونه به ربات');
    await home.locator('#order-submit').click();
    await home.waitForFunction(()=>!document.getElementById('order-submit').disabled && document.getElementById('order-status').classList.contains('is-err'));
    assert.equal(await home.locator('#f-name').inputValue(),'سفارش آزمایشی');
    botRejectOrder=false;
    await home.locator('#order-submit').click();
    await home.waitForFunction(()=>document.getElementById('order-status').classList.contains('is-ok'));
    assert.equal(orderRequests[0].id,orderRequests[1].id);
    assert.equal(await home.locator('#f-name').inputValue(),'');
    assert.match(await home.locator('#order-status').textContent(),/صندوق سفارش/);
    botDelivery='sent';
    await home.locator('#f-name').fill('سفارش دوم');await home.locator('#f-phone').fill('09123456780');await home.locator('#f-msg').fill('پیام دوم');
    await home.locator('#order-submit').click();
    await home.waitForFunction(()=>document.getElementById('order-status').textContent.includes('به مدیر رسید'));
    assert.notEqual(orderRequests.at(-1).id,orderRequests[0].id);
    assert.ok(botCalls.some(c=>c.action==='published'));
    const published=structuredClone(row.data);
    row.data.works[4].visible=false;
    await home.reload();await home.locator('.stage-card').first().waitFor();
    await home.waitForFunction(()=>document.querySelectorAll('.stage-card').length===4);
    row.data.works=[];
    await home.reload();await home.locator('#works-empty').waitFor({state:'visible'});
    assert.equal(await home.locator('.stage-card').count(),0);
    row.data=published;
    await home.close();
    await page.locator('#current-password').fill(password);
    await page.locator('#new-password').fill('updated-cloud-password');
    await page.locator('#confirm-password').fill('updated-cloud-password');
    await page.locator('#credentials-form button[type=submit]').click();
    await page.waitForFunction(() => document.getElementById('credentials-status').textContent.includes('به‌روزرسانی شد'));
    assert.equal(password, 'updated-cloud-password');
    await page.locator('#logout').click();
    await page.locator('#login-view').waitFor({ state: 'visible' });
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'login-mobile.png'), fullPage: true });
    // A valid Supabase user is not necessarily an authorized studio admin.
    allowAdmin = false;
    await page.locator('#username').fill('mojtaba');
    await page.locator('#password').fill(password);
    await page.locator('#login-submit').click();
    await page.waitForFunction(() => document.getElementById('login-error').textContent.includes('اجازهٔ مدیریت'));
    assert.equal(await page.locator('#dashboard').isVisible(), false);
    allowAdmin = true;
    const recoveryPage = await context.newPage();
    await recoveryPage.addInitScript(() => {
      localStorage.removeItem('miim:cloud-auth');
      localStorage.setItem('miim:cloud-auth-code-verifier', JSON.stringify('test-verifier-for-mocked-callback/recovery'));
    });
    await recoveryPage.goto(base + '/admin/?code=mock-recovery-code');
    await recoveryPage.locator('#recovery-view').waitFor({ state: 'visible' });
    await recoveryPage.locator('#recovery-password').fill('recovered-test-password');
    await recoveryPage.locator('#recovery-confirm').fill('recovered-test-password');
    await recoveryPage.locator('#recovery-form button').click();
    await recoveryPage.locator('#dashboard').waitFor({ state: 'visible' });
    assert.equal(password, 'recovered-test-password');
    await recoveryPage.locator('#logout').click();
    await recoveryPage.locator('#login-view').waitFor({ state: 'visible' });
    await recoveryPage.close();
    assert.deepEqual(errors, []);
    console.log('PASS: secure bot pairing UI, private inbox/retry, notification and order delivery/error/idempotency; Rubika link/icon, text/image drag and selection guards, real mouse selection and editable forms; expanded CMS, project add/copy/delete/search/upload, hero/services/SEO edits, draft persistence, history/import restore, public rendering; graphic desktop/mobile layouts; username mapping/recovery requests; invalid/valid auth; server authorization; restored session; publish/failure/conflict; export; cloud homepage; password change and logout (mock Supabase API).');
    // Mobile header entry remains on-screen and animations respect user preferences.
    const mobileHome = await context.newPage();
    await mobileHome.setViewportSize({ width: 390, height: 844 });
    await mobileHome.goto(base + '/');
    const entry = mobileHome.locator('.nav__admin');
    await entry.waitFor({ state: 'visible' });
    const entryBox = await entry.boundingBox();
    assert.ok(entryBox.x >= 0 && entryBox.x + entryBox.width <= 390, 'mobile header login must remain visible');
    await entry.click();
    await mobileHome.locator('#username').waitFor({ state: 'visible' });
    assert.equal(await mobileHome.locator('.orbit-inner').evaluate(el => getComputedStyle(el).animationName), 'none');
    await mobileHome.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await mobileHome.locator('.orbit-inner').evaluate(el => getComputedStyle(el).animationName), 'ring-spin');
    await mobileHome.waitForFunction(() => document.getElementById('login-particles').width > 0);
    await mobileHome.close();
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
