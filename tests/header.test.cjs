const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

function loadPicker() {
  const start = source.indexOf('  function pickActiveSection(');
  const end = source.indexOf('  /* ---------- هدر کپسولی');
  assert.ok(start > 0 && end > start, 'pickActiveSection should stay a standalone helper');
  const context = vm.createContext({});
  vm.runInContext(source.slice(start, end) + '\nthis.pick = pickActiveSection;', context);
  return context.pick;
}

const pick = loadPicker();
const tops = [
  { id: 'hero', top: 0 },
  { id: 'about', top: 1200 },
  { id: 'services', top: 2600 },
  { id: 'contact', top: 9000 },
];

test('the active nav section follows the scroll probe', () => {
  assert.equal(pick(tops, 300, false, 'hero'), 'hero');
  assert.equal(pick(tops, 1300, false, 'hero'), 'about');
  assert.equal(pick(tops, 2650, false, 'hero'), 'services');
  assert.equal(pick(tops, 100, false, 'hero'), 'hero');
});

test('section boundaries are inclusive, so the pill never lags one section behind', () => {
  assert.equal(pick(tops, 1200, false, 'hero'), 'about');
  assert.equal(pick(tops, 2599, false, 'hero'), 'about');
  assert.equal(pick(tops, 8999, false, 'hero'), 'services');
  assert.equal(pick(tops, 9000, false, 'hero'), 'contact');
});

test('scrolling to the very bottom always highlights the last section', () => {
  assert.equal(pick(tops, 9100, true, 'hero'), 'contact');
  assert.equal(pick([{ id: 'hero', top: 0 }, { id: 'works', top: 500 }], 600, true, 'hero'), 'works');
});

test('sections that are missing from the page are skipped instead of breaking the spy', () => {
  const withHoles = [
    { id: 'hero', top: 0 },
    { id: 'services', top: null },
    { id: 'works', top: 800 },
    { id: 'contact', top: undefined },
  ];
  assert.equal(pick(withHoles, 900, false, 'hero'), 'works');
  assert.equal(pick(withHoles, 900, true, 'hero'), 'works');
  assert.equal(pick([], 900, false, 'hero'), 'hero');
});

test('the fixed header never asks the GPU to blur the page behind it', () => {
  const nav = css.match(/\.nav \{[^}]*\}/);
  assert.ok(nav, '.nav block should exist');
  assert.doesNotMatch(nav[0], /backdrop-filter/);
  const pill = css.match(/\.nav__pill \{[^}]*\}/);
  assert.ok(pill, '.nav__pill block should exist');
  // An overshooting spring on width+transform made the pill wobble between links.
  assert.doesNotMatch(pill[0], /ease-spring/);
});

test('anchor targets keep the floating header from covering section titles', () => {
  assert.match(css, /scroll-margin-top:\s*var\(--header-offset/);
  assert.match(source, /--header-offset/, 'script.js should measure the live header height');
});

test('the header spies on scroll once per animation frame and never reads layout there', () => {
  const spy = source.slice(source.indexOf('const spy = () => {'), source.indexOf('const queueSpy ='));
  assert.ok(spy.length > 0);
  assert.doesNotMatch(spy, /getBoundingClientRect|scrollHeight|offsetWidth|offsetTop/);
  assert.match(source, /function requestAnimationFrame|requestAnimationFrame\(spy\)/);
});
