const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const source = read('script.js');
const published = JSON.parse(read('data.json'));

function setup() {
  const elements = new Map();
  const context = vm.createContext({
    URL,
    $: (id) => {
      if (!elements.has(id)) elements.set(id, { removeAttribute(name) { delete this[name]; } });
      return elements.get(id);
    },
    imgSrc: (file) => file,
    fa: String,
    goStage: () => {},
  });
  vm.runInContext(source.slice(0, source.indexOf('(() =>')), context);
  const merge = source.slice(source.indexOf('  function mergeData(d)'), source.indexOf('  async function loadStudioData()'));
  const modal = source.slice(source.indexOf('  function projectSiteUrl(value)'), source.indexOf('  function openCaseModal(idx)'));
  vm.runInContext('let SITE = JSON.parse(JSON.stringify(DEFAULT_SITE)); let filteredWorks = []; let modalIdx = 0;' + merge + modal, context);
  return { context, elements };
}

test('published and fallback projects contain the correct live site links', () => {
  const { context } = setup();
  assert.equal(vm.runInContext('JSON.stringify(DEFAULT_SITE.works)', context), JSON.stringify(published.works));
  assert.equal(published.works.find(w => w.file === 'proj-1.jpg').url, 'https://miimdev.github.io/STYLE-LAND/');
  assert.equal(published.works.find(w => w.file === 'proj-4.jpg').url, 'https://miimdev.github.io/IDEA/');
});

test('modal updates the link and hides it when navigating to graphic work', () => {
  const { context, elements } = setup();
  context.works = published.works;
  vm.runInContext('filteredWorks = works; fillCaseModal(0)', context);
  const link = elements.get('#case-site-link');
  assert.equal(link.href, published.works[0].url);
  assert.equal(link.hidden, false);
  vm.runInContext('fillCaseModal(2)', context);
  assert.equal(link.href, published.works[2].url);
  vm.runInContext('fillCaseModal(1)', context);
  assert.equal(link.hidden, true);
  assert.equal(link.href, undefined);
});

test('legacy cached works recover links while removed UI projects stay excluded', () => {
  const { context } = setup();
  context.legacy = published.works.map(({ url, ...work }) => work);
  context.legacy.push({ file: 'proj-2.jpg', tag: 'رابط کاربری' });
  vm.runInContext('mergeData({ works: legacy })', context);
  assert.equal(vm.runInContext('SITE.works.length', context), 4);
  assert.equal(vm.runInContext('SITE.works[0].url', context), published.works[0].url);
});

test('unsafe and invalid URLs are never displayed', () => {
  const { context } = setup();
  for (const value of ['javascript:alert(1)', 'data:text/html,test', '/relative', '', undefined]) {
    context.value = value;
    assert.equal(vm.runInContext('projectSiteUrl(value)', context), '');
  }
});

test('storage validation preserves URLs and rejects unsafe protocols', () => {
  const context = vm.createContext({ window: {}, URL, TextEncoder, localStorage: { getItem: () => null } });
  vm.runInContext(read('store.js'), context);
  const body = { ...published, works: published.works.map(w => ({ ...w })) };
  const cleaned = context.window.PF.clean(body);
  assert.equal(cleaned.works[0].url, published.works[0].url);
  body.works[0].url = 'javascript:alert(1)';
  assert.throws(() => context.window.PF.clean(body));
  delete body.works[0].url;
  assert.doesNotThrow(() => context.window.PF.clean(body));
});

test('site button opens in a new tab with safe rel attributes', () => {
  assert.match(read('index.html'), /<a\b[^>]*id="case-site-link"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*hidden>/);
});
