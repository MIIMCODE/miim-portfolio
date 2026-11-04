const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
test('every local CSS and JavaScript reference matches its current content hash', () => {
  for (const file of ['index.html', 'admin/index.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const references = [...html.matchAll(/\b(?:src|href)="([^"?#]+\.(?:css|js))(?:\?v=([a-f\d]+))?"/g)];
    assert.ok(references.length > 0);
    for (const [, asset, version] of references) {
      assert.equal(version, hash(path.resolve(root, path.dirname(file), asset)), `${file}: stale asset ${asset}`);
    }
  }
});
test('public admin link cache-busts the current admin HTML', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const match = html.match(/href="admin\/\?v=([a-f\d]+)"/);
  assert.ok(match);
  assert.equal(match[1], hash(path.join(root, 'admin/index.html')));
});
