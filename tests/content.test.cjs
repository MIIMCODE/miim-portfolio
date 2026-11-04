const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../content.js');
const snapshot = () => JSON.parse(fs.readFileSync(path.join(__dirname,'../data.json'),'utf8'));
test('full content round-trip retains every editable section and drops private/unknown keys',()=>{
  const input = {...snapshot(), authHash:'private', access_token:'private', extra:{secret:true}, seo:{title:'My title',description:'My description'}};
  const out=C.clean(input);
  for(const key of ['identity','about','services','skills','stats','works','process','testimonials','contact','footer','seo'])assert.ok(out[key]);
  assert.equal(out.identity.heroTitle,input.identity.heroTitle);
  assert.equal(out.about.text,input.about.text);
  assert.equal(out.contact.formspree,input.contact.formspree);
  assert.equal(out.works[0].url,input.works[0].url);
  assert.equal('authHash' in out,false);assert.equal('access_token' in out,false);assert.equal('extra' in out,false);
});
test('project copies can reuse images, visibility persists, and empty sections are supported',()=>{
  const input=snapshot();input.works.push({...input.works[0],title:'Copy',visible:false});
  assert.equal(C.clean(input).works.at(-1).visible,false);
  for(const key of ['works','services','skills','stats','process','testimonials'])input[key]=[];
  const out=C.clean(input);for(const key of ['works','services','skills','stats','process','testimonials'])assert.equal(out[key].length,0);
});
test('media references accept only local image filenames or this application storage bucket',()=>{
  assert.equal(C.image('proj-1.jpg'),'proj-1.jpg');
  assert.equal(C.image(C.MEDIA+'uploads/test-1.webp'),C.MEDIA+'uploads/test-1.webp');
  for(const file of ['../photo.png','a/../b.jpg','https://evil.test/a.jpg',C.MEDIA+'../evil.jpg',C.MEDIA+'test.svg','javascript:alert(1)'])assert.throws(()=>C.image(file));
});
test('links, numbers and content size are validated before publishing/importing',()=>{
  for(const key of ['skills','stats','testimonials']){const input=snapshot();input[key][0][key==='skills'?'percent':key==='stats'?'value':'rating']=-1;assert.throws(()=>C.clean(input));}
  const input=snapshot();input.works[0].url='javascript:alert(1)';assert.throws(()=>C.clean(input));
  input.works[0].url='https://valid.test/';input.works[0].title='x'.repeat(151);assert.throws(()=>C.clean(input));
  assert.throws(()=>C.url('https://user:password@example.com'));
  const bad=snapshot();bad.contact.platforms[0].url='data:text/html,hello';assert.throws(()=>C.clean(bad));
});
test('removed UI portfolio category cannot be reintroduced by import',()=>{
  const input=snapshot();input.works[0].tag='رابط کاربری';assert.throws(()=>C.clean(input),/نمونه‌کارها/);
});
test('schema strips imported HTML while preserving ordinary Persian quotation marks',()=>{
  const input=snapshot();input.identity.heroTitle='<b>«استودیو»</b>';
  assert.equal(C.clean(input).identity.heroTitle,'b«استودیو»/b');
});

test('Rubika is a first-class editable social platform with the requested profile',()=>{
  const input=snapshot();
  const profile=C.clean(input).contact.platforms.find(p=>p.key==='rubika');
  assert.deepEqual(profile,{key:'rubika',label:'روبیکا',url:'https://rubika.ir/MIIM_DEV'});
});
