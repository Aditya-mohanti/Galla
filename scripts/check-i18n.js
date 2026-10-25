// Fails when en.json and hi.json don't have exactly the same keys (00 §7).
const path = require('path');
const en = require(path.join(__dirname, '../src/i18n/en.json'));
const hi = require(path.join(__dirname, '../src/i18n/hi.json'));

const keys = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

const a = new Set(keys(en));
const b = new Set(keys(hi));
const missingHi = [...a].filter((k) => !b.has(k));
const missingEn = [...b].filter((k) => !a.has(k));
if (missingHi.length || missingEn.length) {
  if (missingHi.length) console.error('Missing in hi.json:\n  ' + missingHi.join('\n  '));
  if (missingEn.length) console.error('Missing in en.json:\n  ' + missingEn.join('\n  '));
  process.exit(1);
}
console.log(`i18n OK — ${a.size} keys in both languages`);
