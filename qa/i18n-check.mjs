// Compara las claves que pide el markup contra las que tiene el diccionario.
// Corre sin navegador: `node qa/i18n-check.mjs`
import { readFileSync } from 'node:fs';
import { EN } from '../dist/i18n/en.js';

let bad = 0;
const need = new Set();
for (const file of ['dist/index.html', 'dist/juego.html']) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/data-i18n="([^"]*)"/g)) need.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]*)"/g))
    for (const pair of m[1].split(';')) need.add(pair.split('@')[1]);
}
// Las claves usadas desde JS con t('clave', 'respaldo').
for (const file of ['dist/main.js', 'dist/game/game.js']) {
  const js = readFileSync(file, 'utf8');
  for (const m of js.matchAll(/(?<![A-Za-z0-9_])t\('([^']+)'/g)) need.add(m[1]);
}
const missing = [...need].filter(k => !(k in EN));
const unused = Object.keys(EN).filter(k => !need.has(k));

console.log(`claves pedidas : ${need.size}`);
console.log(`diccionario    : ${Object.keys(EN).length}`);
if (missing.length) { bad = 1; console.log(`SIN TRADUCIR   : ${missing.join(', ')}`); }
else console.log('SIN TRADUCIR   : ninguna');
if (unused.length) console.log(`sobrantes      : ${unused.join(', ')}`);
process.exit(bad);
