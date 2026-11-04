// Content-address local browser assets so GitHub Pages updates do not mix releases.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
for (const file of ['admin/index.html', 'index.html']) {
  const absolute = path.join(root, file);
  let html = fs.readFileSync(absolute, 'utf8');
  html = html.replace(/\b(src|href)="([^"?#]+\.(?:css|js))(?:\?[^"#]*)?"/g, (match, attr, asset) => {
    if (/^(?:https?:|\/\/)/.test(asset)) return match;
    const target = path.resolve(path.dirname(absolute), asset);
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) throw new Error('Missing local asset: ' + asset);
    return `${attr}="${asset}?v=${hash(target)}"`;
  });
  // The public header should also request fresh admin HTML, not a cached old page.
  if (file === 'index.html') html = html.replace(/href="admin\/(?:\?[^"#]*)?"/g, `href="admin/?v=${hash(path.join(root, 'admin/index.html'))}"`);
  fs.writeFileSync(absolute, html);
}
