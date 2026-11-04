const { test } = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto, randomUUID } = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const modulePath = require('node:url').pathToFileURL(path.join(__dirname,'../supabase/functions/miim-rubika/index.mjs')).href;
const now = Date.parse('2026-10-29T20:00:00Z');
const valid = () => ({action:'order',id:randomUUID(),name:'مشتری',phone:'۰۹۱۲۳۴۵۶۷۸۹',email:'',service:'وب',budget:'شرکتی',message:'شرح پروژه',website:''});
async function setup() {
  const { createHandler } = await import(modulePath);
  const settings = {id:'main',chat_id:null};
  const orders = new Map(), events = new Map(), calls=[];
  let authorized=true, botMode='ok', updates=[], count=0;
  const response = (data,status=200) => new Response(JSON.stringify(data),{status});
  const mock = async (url,opts={}) => {
    const u=new URL(url),body=opts.body?JSON.parse(opts.body):null;
    calls.push({url:u,body,headers:opts.headers});
    if(u.hostname==='botapi.rubika.ir') {
      if(botMode==='timeout') throw new Error('do not leak token URL '+url);
      if(botMode==='reject') return response({status:'INVALID_ACCESS',dev_message:'secret upstream'});
      const method=u.pathname.split('/').at(-1);
      return response({status:'OK',data:method==='getUpdates'?{updates}:method==='getChat'?{chat:{chat_type:body.chat_id==='group'?'Group':'User'}}:method==='sendMessage'?{message_id:'message-'+(++count)}:{}});
    }
    if(u.pathname==='/auth/v1/user') return response({id:'manager'},authorized?200:401);
    if(u.pathname==='/rest/v1/rpc/miim_is_admin') return response(authorized);
    if(u.pathname==='/rest/v1/miim_bot_settings') {
      if(opts.method==='PATCH') {
        const match=u.searchParams.get('pairing_hash');
        if(match && match!=='eq.'+settings.pairing_hash)return response([]);
        Object.assign(settings,body);
      }return response([{...settings}]);
    }
    if(u.pathname==='/rest/v1/rpc/miim_accept_order') {
      if(orders.has(body.p_id)) {
        const old=orders.get(body.p_id);
        return old.fingerprint===body.p_fingerprint?response(old):response({message:'idempotency_conflict'},400);
      }
      const order={id:body.p_id,payload:body.p_payload,fingerprint:body.p_fingerprint,source_hash:body.p_source,state:'queued'};
      orders.set(order.id,order);return response(order);
    }
    if(u.pathname==='/rest/v1/rpc/miim_claim_order') {
      const order=orders.get(body.p_id);
      if(!order || !(['queued',...(body.p_retry?['failed','uncertain']:[])].includes(order.state)))return response(null);
      order.state='sending';return response(order);
    }
    if(u.pathname==='/rest/v1/miim_order_inbox') {
      if(opts.method==='PATCH')Object.assign(orders.get(u.searchParams.get('id').slice(3)),body);
      return response([...orders.values()]);
    }
    if(u.pathname==='/rest/v1/miim_content')return response([{revision:7}]);
    if(u.pathname==='/rest/v1/miim_bot_events') {
      if(opts.method==='POST') {if(events.has(body.id))return response([]);events.set(body.id,body);return response([body]);}
      Object.assign(events.get(u.searchParams.get('id').slice(3)),body);return response([]);
    }
    throw new Error('Unhandled mock '+url);
  };
  const handler=createHandler({env:n=>({SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'server-secret',RUBIKA_BOT_TOKEN:'bot-secret'}[n]),fetch:mock,crypto:webcrypto,now:()=>now});
  const send=(body,admin=false,origin='https://miimdev.github.io')=>handler(new Request('https://edge.test',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{}),...(admin?{Authorization:'Bearer valid-manager-jwt'}:{})},body:JSON.stringify(body)}));
  return {handler,send,settings,orders,events,calls,setAuthorized:v=>authorized=v,setBot:v=>botMode=v,setUpdates:v=>updates=v};
}
test('public orders are validated and saved privately before pairing, not emailed',async()=>{
  const s=await setup(),body=valid();
  const response=await s.send(body);assert.equal(response.status,200);assert.equal((await response.json()).delivery,'queued');
  assert.equal(s.orders.get(body.id).payload.phone,'09123456789');
  assert.equal(s.calls.some(c=>c.url.hostname==='botapi.rubika.ir'),false);
  assert.ok(!JSON.stringify(s.calls.map(c=>c.body)).includes('server-secret'));
});
test('reject bad origin, missing origin, invalid body/honeypot, oversized JSON and unauthenticated management',async()=>{
  const s=await setup();
  assert.equal((await s.send(valid(),false,'https://evil.test')).status,403);
  assert.equal((await s.send(valid(),false,'')).status,403);
  for(const bad of [{phone:'123'},{message:''},{name:'x'.repeat(101)},{website:'spam'},{email:'bad'},{id:'not-uuid'}])assert.equal((await s.send({...valid(),...bad})).status,400);
  assert.equal((await s.send({action:'status'})).status,401);
  s.setAuthorized(false);assert.equal((await s.send({action:'inbox'},true)).status,401);
  assert.equal((await s.send({...valid(),message:'x'.repeat(14000)})).status,413);
  assert.equal(s.orders.size,0);
});
test('authenticated pairing requires exact private-chat challenge, consumes it and never reveals token/chat id',async()=>{
  const s=await setup();
  const prepared=await (await s.send({action:'prepare'},true)).json();
  assert.match(prepared.code,/^MIIM-[a-f0-9]{32}$/);
  assert.notEqual(s.settings.pairing_hash,prepared.code);
  s.setUpdates([{type:'NewMessage',chat_id:'group',new_message:{sender_type:'User',text:prepared.code}}]);
  assert.equal((await s.send({action:'connect',code:prepared.code},true)).status,409);
  assert.equal(s.settings.chat_id,null);
  s.setUpdates([{type:'NewMessage',chat_id:'user-private',new_message:{sender_type:'User',text:prepared.code}}]);
  const result=await s.send({action:'connect',code:prepared.code},true);assert.equal(result.status,200);
  assert.equal(s.settings.chat_id,'user-private');assert.equal(s.settings.pairing_hash,null);
  assert.equal((await s.send({action:'connect',code:prepared.code},true)).status,400);
  const status=await (await s.send({action:'status'},true)).text();
  assert.ok(!status.includes('user-private'));assert.ok(!status.includes('bot-secret'));
});
test('expired, wrong, forwarded and edited pairing messages cannot take over recipient',async()=>{
  for(const change of [{is_edited:true},{forwarded_from:{}},{forwarded_no_link:'forward'}]){
    const s=await setup();const {code}=await(await s.send({action:'prepare'},true)).json();
    s.setUpdates([{type:'NewMessage',chat_id:'user-private',new_message:{sender_type:'User',text:code,...change}}]);
    assert.equal((await s.send({action:'connect',code},true)).status,409);assert.equal(s.settings.chat_id,null);
  }
  const s=await setup();const {code}=await(await s.send({action:'prepare'},true)).json();
  assert.equal((await s.send({action:'connect',code:'wrong'},true)).status,400);
  s.settings.pairing_expires=new Date(now-1).toISOString();assert.equal((await s.send({action:'connect',code},true)).status,400);
});
test('delivery always uses server recipient and duplicate retries never send twice',async()=>{
  const s=await setup();s.settings.chat_id='owner-private';const body={...valid(),chat_id:'attacker'};
  assert.equal((await(await s.send(body)).json()).delivery,'sent');
  assert.equal((await(await s.send(body)).json()).delivery,'sent');
  const sent=s.calls.filter(c=>c.url.pathname.endsWith('/sendMessage'));
  assert.equal(sent.length,1);assert.equal(sent[0].body.chat_id,'owner-private');assert.match(sent[0].body.text,/مشتری/);
  assert.equal((await s.send({...body,message:'changed'})).status,409);
});
test('upstream outage preserves durable orders and hides sensitive exception details',async()=>{
  for(const mode of ['reject','timeout']){
    const s=await setup();s.settings.chat_id='owner-private';s.setBot(mode);const body=valid();
    const result=await(await s.send(body)).json();assert.equal(result.ok,true);
    assert.equal(result.delivery,mode==='reject'?'failed':'uncertain');
    assert.equal(s.orders.size,1);assert.ok(!JSON.stringify(result).includes('secret'));
    await s.send(body);assert.equal(s.calls.filter(c=>c.url.pathname.endsWith('/sendMessage')).length,1);
  }
});
test('admin retries failed orders and publication notifications use DB revision, deduped fixed text',async()=>{
  const s=await setup();s.settings.chat_id='owner-private';s.setBot('reject');const body=valid();await s.send(body);s.setBot('ok');
  const result=await(await s.send({action:'retry',id:body.id},true)).json();assert.equal(result.delivery,'sent');
  assert.equal((await s.send({action:'published',revision:6},true)).status,409);
  await s.send({action:'published',revision:7,text:'spoofed'},true);await s.send({action:'published',revision:7},true);
  const notices=s.calls.filter(c=>c.url.pathname.endsWith('/sendMessage')&&c.body.text.includes('نسخهٔ'));
  assert.equal(notices.length,1);assert.ok(!notices[0].body.text.includes('spoofed'));
});
test('SQL protects inbox/settings and serializes persistent rate limits and claims',()=>{
  const sql=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261029_miim_rubika.sql'),'utf8');
  for(const table of ['miim_bot_settings','miim_order_inbox','miim_bot_events'])assert.match(sql,new RegExp('alter table public.'+table+' enable row level security'));
  assert.match(sql,/pg_advisory_xact_lock/);assert.match(sql,/rate_limited/);assert.match(sql,/idempotency_conflict/);
  assert.match(sql,/from public, anon, authenticated/);assert.match(sql,/to service_role/);
  assert.match(sql,/90 days/);
});
