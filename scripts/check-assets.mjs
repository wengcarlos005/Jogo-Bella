// Lista quais arquivos do manifesto existem em public/ e quais faltam.
// Uso: npm run assets:check
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const src = readFileSync('src/config/assetManifest.ts', 'utf8');
const entries = [];
for (const m of src.matchAll(/char\('([^']+)',\s*'([^']+)',\s*'([^']+)'(?:,\s*\d+)?\)/g)) entries.push({ id: m[1], file: `assets/${m[3]}` });
for (const m of src.matchAll(/\{\s*id:\s*'([^']+)',\s*key:\s*'[^']+',\s*file:\s*'([^']+)'/g)) entries.push({ id: m[1], file: m[2] });

let ok = 0;
for (const e of entries) {
  const has = existsSync(join('public', e.file));
  if (has) ok++;
  console.log(`${has ? '✔ integrado ' : '· pendente  '} ${e.id.padEnd(9)} public/${e.file}`);
}
console.log(`\n${ok}/${entries.length} arquivos presentes. O resto usa placeholder.`);
