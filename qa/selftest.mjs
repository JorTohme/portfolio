// Self-checks for the pure voxel logic. No framework on purpose: `node qa/selftest.mjs`.
// grid.js imports nothing, so the only non-obvious code in the game — traversal,
// occlusion and run-length coding — stays runnable without a browser.
import assert from 'node:assert/strict';
import { SX, SY, SZ, idx, inBounds, createGrid, get, set, isExposed, raycast, encode, decode } from '../dist/game/grid.js';

let failed = 0;
const test = (name, fn) => {
  try { fn(); console.log(`PASS  ${name}`); }
  catch (e) { failed++; console.log(`FAIL  ${name}\n      ${e.message.split('\n')[0]}`); }
};

test('idx is unique and inside the buffer', () => {
  const seen = new Set();
  for (const [x, y, z] of [[0, 0, 0], [SX - 1, SY - 1, SZ - 1], [5, 3, 7], [7, 3, 5]]) {
    const i = idx(x, y, z);
    assert.ok(i >= 0 && i < SX * SY * SZ, `${i} out of buffer`);
    assert.ok(!seen.has(i), 'collision');
    seen.add(i);
  }
});

test('inBounds rejects every out-of-range axis', () => {
  assert.equal(inBounds(0, 0, 0), true);
  assert.equal(inBounds(SX - 1, SY - 1, SZ - 1), true);
  for (const c of [[-1, 0, 0], [0, -1, 0], [0, 0, -1], [SX, 0, 0], [0, SY, 0], [0, 0, SZ]])
    assert.equal(inBounds(...c), false, `${c} should be out`);
});

test('get/set round-trip, and out-of-bounds is inert', () => {
  const g = createGrid();
  set(g, 4, 5, 6, 9);
  assert.equal(get(g, 4, 5, 6), 9);
  assert.equal(get(g, 4, 5, 7), 0);
  set(g, -1, 0, 0, 3);            // must not throw and must not write
  assert.equal(get(g, -1, 0, 0), 0);
  assert.equal(g.reduce((a, b) => a + b, 0), 9, 'only one cell written');
});

test('isExposed: fully enclosed is hidden, one air neighbour is visible', () => {
  const g = createGrid();
  const [x, y, z] = [10, 10, 10];
  for (const [dx, dy, dz] of [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]])
    set(g, x + dx, y + dy, z + dz, 1);
  assert.equal(isExposed(g, x, y, z), false, 'enclosed cell should be hidden');
  set(g, x, y + 1, z, 0);
  assert.equal(isExposed(g, x, y, z), true, 'opening the top must expose it');
});

test('isExposed: the grid border counts as air', () => {
  const g = createGrid();
  set(g, 0, 0, 0, 1);
  assert.equal(isExposed(g, 0, 0, 0), true);
});

test('raycast hits along each axis with the entered face normal', () => {
  const cases = [
    { block: [10, 2, 2], from: [2.5, 2.5, 2.5], dir: [1, 0, 0], normal: [-1, 0, 0] },
    { block: [2, 10, 2], from: [2.5, 2.5, 2.5], dir: [0, 1, 0], normal: [0, -1, 0] },
    { block: [2, 2, 10], from: [2.5, 2.5, 2.5], dir: [0, 0, 1], normal: [0, 0, -1] },
    { block: [2, 2, 2], from: [10.5, 2.5, 2.5], dir: [-1, 0, 0], normal: [1, 0, 0] },
    { block: [2, 2, 2], from: [2.5, 10.5, 2.5], dir: [0, -1, 0], normal: [0, 1, 0] },
    { block: [2, 2, 2], from: [2.5, 2.5, 10.5], dir: [0, 0, -1], normal: [0, 0, 1] },
  ];
  for (const c of cases) {
    const g = createGrid();
    set(g, ...c.block, 1);
    const hit = raycast(g, c.from, c.dir, 40);
    assert.ok(hit, `no hit for dir ${c.dir}`);
    assert.deepEqual([hit.x, hit.y, hit.z], c.block, `wrong cell for dir ${c.dir}`);
    assert.deepEqual([hit.nx, hit.ny, hit.nz], c.normal, `wrong normal for dir ${c.dir}`);
  }
});

test('raycast returns the nearest block, not the far one', () => {
  const g = createGrid();
  set(g, 6, 2, 2, 1);
  set(g, 12, 2, 2, 1);
  const hit = raycast(g, [2.5, 2.5, 2.5], [1, 0, 0], 40);
  assert.equal(hit.x, 6);
});

test('raycast misses on an empty grid and respects maxDist', () => {
  const g = createGrid();
  assert.equal(raycast(g, [2.5, 2.5, 2.5], [1, 0, 0], 40), null);
  set(g, 20, 2, 2, 1);
  assert.equal(raycast(g, [2.5, 2.5, 2.5], [1, 0, 0], 5), null, 'must stop at maxDist');
});

test('raycast on a diagonal still lands on a solid cell', () => {
  const g = createGrid();
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) set(g, x, 3, z, 2);
  const hit = raycast(g, [4.5, 12.5, 4.5], [0.6, -1, 0.35], 60);
  assert.ok(hit, 'a ray aimed down at a full floor must hit');
  assert.equal(hit.y, 3);
  assert.equal(get(g, hit.x, hit.y, hit.z), 2);
});

test('encode/decode round-trips a populated grid', () => {
  const g = createGrid();
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) { set(g, x, 0, z, 1); set(g, x, 1, z, 3); }
  set(g, 5, 9, 5, 15);
  set(g, 31, 19, 31, 7);
  const back = decode(encode(g));
  assert.deepEqual(Array.from(back), Array.from(g));
});

test('encode/decode survives a run longer than one byte', () => {
  const g = createGrid();          // all air: a single run of 20480 cells
  const back = decode(encode(g));
  assert.deepEqual(Array.from(back), Array.from(g));
});

test('encode stays compact for a mostly-empty grid', () => {
  const g = createGrid();
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) set(g, x, 0, z, 1);
  const s = encode(g);
  assert.ok(s.length < 2000, `share payload too long: ${s.length}`);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(s), 'must be URL-safe');
});

test('decode rejects garbage instead of returning a broken grid', () => {
  assert.equal(decode('!!!not base64!!!'), null);
  assert.equal(decode(''), null);
});

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks OK');
process.exit(failed ? 1 : 0);
