const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
function setup(blocked = false) {
  const values = new Map();
  const context = vm.createContext({ window: {}, URL, TextEncoder, localStorage: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { if (blocked) throw new Error('blocked'); values.set(key, value); },
    removeItem: key => values.delete(key),
  } });
  vm.runInContext(read('store.js'), context);
  return { pf: context.window.PF, values };
}

test('SHA256 agrees with standard implementation for Unicode and long inputs', () => {
  const { pf } = setup();
  for (const value of ['abc', 'مدیریت سایت', 'x'.repeat(1000)]) {
    assert.equal(pf.sha256(value), crypto.createHash('sha256').update(value).digest('hex'));
  }
});
test('login, session expiration, and logout', () => {
  const { pf, values } = setup();
  pf.setCredentials('test-admin', 'test-password');
  assert.equal(pf.login('test-admin', 'wrong-password').ok, false);
  assert.equal(pf.isLoggedIn(), false);
  assert.equal(pf.login('test-admin', 'test-password').ok, true);
  assert.equal(pf.isLoggedIn(), true);
  values.set('pf:auth', String(Date.now() - 1));
  assert.equal(pf.isLoggedIn(), false);
  pf.login('test-admin', 'test-password');
  pf.logout();
  assert.equal(pf.isLoggedIn(), false);
});
test('five failed attempts temporarily lock login', () => {
  const { pf, values } = setup();
  pf.setCredentials('test-admin', 'test-password');
  for (let i = 0; i < 5; i++) pf.login('test-admin', 'wrong');
  assert.equal(pf.login('test-admin', 'test-password').ok, false);
  values.delete('pf:fail');
  assert.equal(pf.login('test-admin', 'test-password').ok, true);
});
test('published hash works and local credential change takes precedence', () => {
  const { pf } = setup();
  const hash = pf.sha256('published\0published-password');
  assert.equal(pf.login('published', 'published-password', hash).ok, true);
  pf.logout();
  pf.setCredentials('local-admin', 'local-password');
  assert.equal(pf.login('published', 'published-password', hash).ok, false);
  assert.equal(pf.login('local-admin', 'local-password', hash).ok, true);
});
test('blocked storage never reports login or credential changes as successful', () => {
  const { pf } = setup(true);
  const hash = pf.sha256('test-admin\0test-password');
  assert.equal(pf.login('test-admin', 'test-password', hash).ok, false);
  assert.equal(pf.isLoggedIn(), false);
  assert.throws(() => pf.setCredentials('test-admin', 'test-password'));
});
test('saving preserves project metadata and skill tags', () => {
  const { pf } = setup();
  const data = JSON.parse(read('data.json'));
  const cleaned = pf.clean(data);
  assert.deepEqual(JSON.parse(JSON.stringify(cleaned.works)), data.works);
  assert.deepEqual(JSON.parse(JSON.stringify(cleaned.skills)), data.skills);
});
