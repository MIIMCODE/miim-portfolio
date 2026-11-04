const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function setup(result = { data: { data: {}, revision: 3 }, error: null }) {
  const requests = [];
  const query = {
    update(body) { requests.push(['update', body]); return this; },
    select(fields) { requests.push(['select', fields]); return this; },
    eq(key, value) { requests.push(['eq', key, value]); return this; },
    single() { return this; },
    abortSignal() { return Promise.resolve(result); },
    maybeSingle() { return Promise.resolve(result); },
  };
  const fake = {
    from(table) { requests.push(['from', table]); return query; },
    auth: {
      async signInWithPassword(body) { requests.push(['login', body]); return { data: { session: { user: { email: body.email } } }, error: null }; },
      async resetPasswordForEmail(email, options) { requests.push(['recover', email, options]); return {}; },
    },
  };
  const context = vm.createContext({ window: {}, AbortSignal, createClient: () => fake });
  vm.runInContext(read('lib/cloud.js').replace(/^import .*?;$/m, ''), context);
  return { cloud: context.window.MiimCloud, requests };
}
test('cloud saves strip legacy password hashes and compare server revision', async () => {
  const { cloud, requests } = setup();
  await cloud.save({ works: [], authHash: 'must-not-be-public' }, 7);
  const body = requests.find(r => r[0] === 'update')[1];
  assert.equal('authHash' in body.data, false);
  assert.ok(requests.some(r => r[0] === 'eq' && r[1] === 'revision' && r[2] === 7));
  assert.ok(requests.some(r => r[0] === 'from' && r[1] === 'miim_content'));
});
test('empty write results and server errors cannot be reported as saved', async () => {
  await assert.rejects(setup({ data: null, error: null }).cloud.save({}, 1), /نسخهٔ جدیدتری/);
  await assert.rejects(setup({ data: null, error: new Error('RLS denied') }).cloud.save({}, 1), /RLS denied/);
});
test('manager username is resolved to the existing cloud identity, without a client-side password', async () => {
  const { cloud, requests } = setup();
  await cloud.login(' mojtaba ', 'arbitrary-test-password');
  assert.equal(requests[0][1].email, 'resane.miim@gmail.com');
  assert.equal(requests[0][1].password, 'arbitrary-test-password');
  await cloud.login('resane.Miim@gmail.com', 'another-test-password');
  assert.equal(requests[1][1].email, 'resane.miim@gmail.com');
  await cloud.recover('mojtaba');
  assert.equal(requests[2][1], 'resane.miim@gmail.com');
  assert.equal(requests[2][2].redirectTo, 'https://miimdev.github.io/TEST/admin/');
});
test('cloud is authoritative and never reads old local drafts', async () => {
  let localReads = 0;
  const baseline = JSON.parse(read('data.json'));
  const source = read('script.js');
  const loader = source.slice(source.indexOf('  async function loadStudioData()'), source.indexOf('  /* ---------- اعلان کوچک'));
  const merged = [];
  const context = vm.createContext({ AbortController, setTimeout, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => baseline }),
    mergeData: data => merged.push(data),
    window: { MiimCloud: { read: async () => ({ data: { contact: { phone: 'cloud' } } }) }, PF: { readLocal: () => { localReads++; return {}; } } },
  });
  vm.runInContext(loader, context);
  await vm.runInContext('loadStudioData()', context);
  assert.equal(localReads, 0);
  assert.equal(merged[0], baseline);
  assert.equal(merged[1].contact.phone, 'cloud');
});
test('public website falls back to repository snapshot on cloud failure', async () => {
  const baseline = JSON.parse(read('data.json'));
  const source = read('script.js');
  const loader = source.slice(source.indexOf('  async function loadStudioData()'), source.indexOf('  /* ---------- اعلان کوچک'));
  let merged;
  const context = vm.createContext({ AbortController, setTimeout, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => baseline }), mergeData: value => { merged = value; },
    window: { MiimCloud: { read: async () => { throw new Error('offline'); } }, PF: { readLocal: () => { throw new Error('must not load local draft'); } } },
  });
  vm.runInContext(loader, context);
  await vm.runInContext('loadStudioData()', context);
  assert.equal(merged, baseline);
});
test('migration isolates app tables and enforces verified-email RLS without user metadata', () => {
  const sql = read('supabase/migrations/20261029_miim_cloud.sql');
  assert.match(sql, /alter table public\.miim_content enable row level security/);
  assert.match(sql, /u\.id = auth\.uid\(\) and u\.email_confirmed_at is not null/);
  assert.match(sql, /grant update \(data\) on public\.miim_content to authenticated/);
  assert.match(sql, /with check \(public\.miim_is_admin\(\)\)/);
  assert.doesNotMatch(sql, /user_metadata/);
  assert.doesNotMatch(sql, /alter table public\.(projects|services|contact_messages)/);
});
