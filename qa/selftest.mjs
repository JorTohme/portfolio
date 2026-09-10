// Self-checks for the pure voxel logic. No framework on purpose: `node qa/selftest.mjs`.
// grid.js imports nothing, so the only non-obvious code in the game — traversal,
// occlusion and run-length coding — stays runnable without a browser.
import assert from 'node:assert/strict';
import { SX, SY, SZ, idx, inBounds, createGrid, get, set, isExposed, raycast, encode, decode, pack, unpack } from '../dist/game/grid.js';
import { CELL, B } from '../dist/game/grid.js';
import { buildIsland, SPAWN, SURFACE } from '../dist/game/island.js';
import { Player, boxHits, cellOverlapsBox, PH } from '../dist/game/player.js';

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

test('the island spawns the player on solid ground with room to stand', () => {
  const g = buildIsland();
  const [x, y, z] = SPAWN;
  assert.equal(y, SURFACE, 'spawn should sit on the walking surface');
  assert.notEqual(get(g, x, y - 1, z), 0, 'nothing solid under the spawn');
  assert.equal(get(g, x, y, z), 0, 'spawn cell must be free');
  assert.equal(get(g, x, y + 1, z), 0, 'head room must be free');
});

test('the island has landmarks, not just ground', () => {
  const g = buildIsland();
  const solid = g.reduce((a, v) => a + (v ? 1 : 0), 0);
  assert.ok(solid > 800, `island looks empty: ${solid} blocks`);
  let above = 0;
  for (let y = SURFACE; y < SY; y++) for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) if (get(g, x, y, z)) above++;
  assert.ok(above > 150, `nothing built above ground: ${above} blocks`);
});

// --- player physics ---------------------------------------------------------
const floorGrid = (top = 3) => {
  const g = createGrid();
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) set(g, x, top, z, B.stone);
  return g;
};
const run = (p, steps, mx = 0, mz = 0, jump = false) => { for (let i = 0; i < steps; i++) p.update(1 / 60, mx, mz, jump); };

test('cellOverlapsBox catches the cells the player occupies', () => {
  const pos = { x: 15.5 * CELL, y: 4 * CELL, z: 20.5 * CELL };
  assert.equal(cellOverlapsBox(15, 4, 20, pos), true, 'the cell at the feet must overlap');
  assert.equal(cellOverlapsBox(15, 5, 20, pos), true, 'the head cell must overlap');
  assert.equal(cellOverlapsBox(15, 3, 20, pos), false, 'the floor below must not');
  assert.equal(cellOverlapsBox(18, 4, 20, pos), false, 'a cell three away must not');
});

test('boxHits separates standing on a floor from being inside it', () => {
  const g = floorGrid();
  assert.equal(boxHits(g, 15.5 * CELL, 4 * CELL, 20.5 * CELL), false, 'standing on top is free');
  assert.equal(boxHits(g, 15.5 * CELL, 3.5 * CELL, 20.5 * CELL), true, 'sunk into the floor collides');
});

test('the player falls and lands exactly on the surface', () => {
  const p = new Player(floorGrid(), [15, 9, 20]);
  run(p, 180);
  assert.equal(p.grounded, true, 'should have landed');
  assert.ok(Math.abs(p.pos.y - 4 * CELL) < 1e-6, `landed at ${p.pos.y}, expected ${4 * CELL}`);
});

test('a two-block wall stops the player', () => {
  const g = floorGrid();
  for (let y = 4; y <= 5; y++) for (let z = 0; z < SZ; z++) set(g, 18, y, z, B.stone);
  const p = new Player(g, [15, 4, 20]);
  run(p, 10);
  run(p, 200, 1, 0);
  assert.ok(p.pos.x < 18 * CELL, `walked into the wall: x=${p.pos.x} vs wall at ${18 * CELL}`);
});

test('a one-block kerb is stepped over instead of blocking', () => {
  const g = floorGrid();
  for (let x = 18; x < SX; x++) for (let z = 0; z < SZ; z++) set(g, x, 4, z, B.stone);
  const p = new Player(g, [15, 4, 20]);
  run(p, 10);
  // Stop well short of the grid edge: walking off a floating island is meant to
  // drop you, so a long walk would be testing the void instead of the kerb.
  run(p, 90, 1, 0);
  assert.ok(p.pos.x > 19 * CELL, `never climbed the kerb: x=${p.pos.x}`);
  assert.ok(Math.abs(p.pos.y - 5 * CELL) < 1e-6, `ended at y=${p.pos.y}, expected ${5 * CELL}`);
});

test('jumping leaves the ground and comes back down', () => {
  const p = new Player(floorGrid(), [15, 4, 20]);
  run(p, 10);
  const rest = p.pos.y;
  p.update(1 / 60, 0, 0, true);
  run(p, 6);
  assert.ok(p.pos.y > rest + .2, `jump barely moved: ${p.pos.y} vs ${rest}`);
  run(p, 180);
  assert.equal(p.grounded, true, 'should have landed again');
  assert.ok(Math.abs(p.pos.y - rest) < 1e-6, 'should return to the same surface');
});

test('falling off the world respawns instead of falling forever', () => {
  const p = new Player(createGrid(), [15, 4, 20]);
  run(p, 240);
  assert.ok(p.pos.y > -6, `fell into the void: y=${p.pos.y}`);
  assert.ok(Math.abs(p.pos.x - 15.5 * CELL) < 1e-6, 'should be back at the spawn column');
});

// pack() runs the runs through deflate, so it is async.
const atest = async (name, fn) => {
  try { await fn(); console.log(`PASS  ${name}`); }
  catch (e) { failed++; console.log(`FAIL  ${name}\n      ${e.message.split('\n')[0]}`); }
};

await atest('pack/unpack round-trips the island exactly', async () => {
  const g = buildIsland();
  const back = await unpack(await pack(g));
  assert.ok(back, 'unpack returned nothing');
  assert.deepEqual(Array.from(back), Array.from(g));
});

await atest('pack fits a share link, and beats plain RLE', async () => {
  const g = buildIsland();
  const packed = await pack(g), plain = encode(g);
  assert.ok(packed.length < 4000, `share payload too long: ${packed.length}`);
  assert.ok(packed.length < plain.length, `deflate did not help: ${packed.length} vs ${plain.length}`);
  assert.ok(/^[zr][A-Za-z0-9_-]+$/.test(packed), 'payload must be URL-safe and marked');
});

await atest('unpack rejects broken payloads instead of throwing', async () => {
  assert.equal(await unpack(''), null);
  assert.equal(await unpack('z'), null);
  assert.equal(await unpack('zAAAA'), null);
  assert.equal(await unpack('q' + encode(createGrid()).slice(1)), null, 'unknown marker');
  assert.equal(await unpack('!!!'), null);
});

await atest('a plain-RLE share payload still opens', async () => {
  const g = buildIsland();
  const back = await unpack('r' + encode(g));
  assert.deepEqual(Array.from(back), Array.from(g));
});

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks OK');
process.exit(failed ? 1 : 0);
