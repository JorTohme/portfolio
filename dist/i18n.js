// Runtime translation. The Spanish markup in index.html is the single source of
// truth; every translatable element carries a data-i18n key and the dictionary
// holds an HTML fragment for it, so a heading like
//   <h2 data-i18n="journey.title">Nada aparece<br>de la nada.</h2>
// stays one key and the English is free to break its lines somewhere else.
//
// Attributes travel as "<attr>@<key>" in data-i18n-attr, e.g.
//   data-i18n-attr="aria-label@nav.label"

export function apply(root, dict) {
  if (!dict) return 0;
  let hits = 0, misses = [];
  for (const el of root.querySelectorAll('[data-i18n]')) {
    const value = dict[el.dataset.i18n];
    if (value == null) { misses.push(el.dataset.i18n); continue; }
    el.innerHTML = value; hits++;
  }
  for (const el of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split('@');
      const value = dict[key];
      if (value == null) { misses.push(key); continue; }
      el.setAttribute(attr, value); hits++;
    }
  }
  if (misses.length) console.warn(`i18n: ${misses.length} sin traducir`, misses);
  return hits;
}
