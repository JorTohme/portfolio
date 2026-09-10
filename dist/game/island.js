import { SX, SZ, createGrid, set, get, B } from './grid.js';

// The home island re-authored on a uniform grid. Same silhouette, same palette,
// same landmarks — but every block is a full cell, so the sandbox can take the
// whole thing apart. The hand-composed diorama in main.js cannot: its blocks are
// all different sizes.
export const CX = 16, CZ = 16;
// Ground tops out at y=3, so the walkable surface is y=4.
export const SURFACE = 4;
export const SPAWN = [15, SURFACE, 20];

// Structures are drawn after the trees so a wall always wins over a leaf.
export function buildIsland() {
  const g = createGrid();
  ground(g);
  path(g);
  tree(g, 9, 17, 5); tree(g, 12, 22, 4); tree(g, 21, 21, 4); tree(g, 21, 10, 5);
  house(g);
  crane(g);
  scatter(g);
  return g;
}

// Irregular shoreline over two courses of soil, tapering to a floating point.
function ground(g) {
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
    const d = Math.hypot(x - CX + .5, z - CZ + .5);
    const edge = 10.4 + Math.sin(x * .9) * .9 + Math.cos(z * 1.15) * .9;
    if (d > edge) continue;
    set(g, x, 3, z, (x + z) % 3 === 0 ? B.grassLight : B.grass);
    set(g, x, 2, z, (x * 3 + z) % 3 === 0 ? B.soilDark : B.soil);
    if (d < edge - 1.2) set(g, x, 1, z, B.soil);
    if (d < edge - 3.4) set(g, x, 0, z, B.soilLight);
  }
}

// Stone path from the shore up to the house door.
function path(g) {
  for (let x = 12; x <= 19; x++) set(g, x, 3, 20, B.stone);
  for (let z = 15; z <= 20; z++) set(g, 14, 3, z, B.stone);
}

// Stone footing, three courses of wall alternating stone and cream, a doorway
// facing the path, and a flat roof.
function house(g) {
  const hx = 12, hz = 11, hw = 5, hd = 4;
  for (let x = hx; x < hx + hw; x++) for (let z = hz; z < hz + hd; z++) set(g, x, 3, z, B.stone);
  for (let y = 4; y <= 7; y++) for (let x = hx; x < hx + hw; x++) for (let z = hz; z < hz + hd; z++) {
    if (x === hx || x === hx + hw - 1 || z === hz || z === hz + hd - 1) set(g, x, y, z, y === 4 ? B.stone : B.cream);
  }
  // Stepped roof: wide eaves, then a narrower ridge. A flat slab reads as a box.
  for (let x = hx - 1; x <= hx + hw; x++) for (let z = hz - 1; z <= hz + hd; z++) set(g, x, 8, z, B.wood);
  for (let x = hx + 1; x < hx + hw - 1; x++) for (let z = hz + 1; z < hz + hd - 1; z++) set(g, x, 9, z, B.bark);
  // Doorway and a window, both on the path side.
  set(g, 14, 4, hz + hd - 1, 0); set(g, 14, 5, hz + hd - 1, 0);
  set(g, hx, 6, hz + 1, 0); set(g, hx + hw - 1, 6, hz + 1, 0);
}

// Timber crane: rungs up the mast, a jib, an ink counterweight and a block on
// the cable — the same four parts the scrolling island builds course by course.
function crane(g) {
  const cx = 23, cz = 12;
  for (let y = 4; y <= 12; y++) set(g, cx, y, cz, y % 2 ? B.yellow : B.orange);
  for (let x = cx - 5; x <= cx + 1; x++) set(g, x, 12, cz, B.yellow);
  set(g, cx + 1, 13, cz, B.ink); set(g, cx + 1, 11, cz, B.ink);
  for (let y = 9; y <= 11; y++) set(g, cx - 4, y, cz, B.ink);
  set(g, cx - 4, 8, cz, B.cream);
}

function tree(g, x, z, h) {
  for (let y = 4; y < 4 + h; y++) set(g, x, y, z, B.bark);
  const top = 4 + h;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
    set(g, x + dx, top - 1, z + dz, (dx + dz) % 2 ? B.leaves : B.leavesDark);
    if (Math.abs(dx) < 2 && Math.abs(dz) < 2) set(g, x + dx, top, z + dz, B.leavesLight);
  }
  set(g, x, top + 1, z, B.leavesLight);
}

// Sprouts and crates, only where the surface is still bare grass.
function scatter(g) {
  const spots = [[10, 13, B.lime], [11, 25, B.lime], [19, 24, B.lime], [24, 18, B.lime], [7, 20, B.lime],
  [18, 8, B.yellow], [13, 8, B.yellow], [25, 13, B.yellow], [8, 12, B.yellow],
  [18, 19, B.wood], [19, 19, B.wood], [10, 9, B.wood], [22, 24, B.wood]];
  for (const [x, z, v] of spots) if (isBareGrass(g, x, z)) set(g, x, SURFACE, z, v);
}
function isBareGrass(g, x, z) {
  const below = get(g, x, 3, z);
  return get(g, x, SURFACE, z) === 0 && (below === B.grass || below === B.grassLight);
}
