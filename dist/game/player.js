import { CELL, get } from './grid.js';

// Box roughly matching the voxel character in voxel-models.js.
export const PW = .25, PH = 1.3;
const GRAVITY = 22, JUMP = 7.4, SPEED = 4.2, AIR_CONTROL = .72, VOID_Y = -6;

// Any cell overlapping the box counts as a collision.
export function boxHits(grid, px, py, pz) {
  const x0 = Math.floor((px - PW) / CELL), x1 = Math.floor((px + PW) / CELL);
  const y0 = Math.floor(py / CELL), y1 = Math.floor((py + PH - 1e-4) / CELL);
  const z0 = Math.floor((pz - PW) / CELL), z1 = Math.floor((pz + PW) / CELL);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
    if (get(grid, x, y, z)) return true;
  return false;
}

// True when a cell would intersect the player's box — used to refuse a block
// that would wall them in.
export function cellOverlapsBox(x, y, z, p) {
  return (x + 1) * CELL > p.x - PW && x * CELL < p.x + PW &&
    (y + 1) * CELL > p.y && y * CELL < p.y + PH &&
    (z + 1) * CELL > p.z - PW && z * CELL < p.z + PW;
}

export class Player {
  constructor(grid, spawn) {
    this.grid = grid; this.spawn = spawn;
    this.pos = { x: 0, y: 0, z: 0 };
    this.vy = 0; this.grounded = false; this.moving = false; this.heading = 0;
    this.reset();
  }
  reset() {
    this.pos.x = (this.spawn[0] + .5) * CELL;
    this.pos.y = this.spawn[1] * CELL;
    this.pos.z = (this.spawn[2] + .5) * CELL;
    this.vy = 0; this.grounded = false;
  }
  // mx/mz is a direction, not a speed: any length moves at walking pace.
  update(dt, mx, mz, jump) {
    const g = this.grid, p = this.pos;
    const len = Math.hypot(mx, mz);
    const speed = SPEED * (this.grounded ? 1 : AIR_CONTROL);
    let dx = 0, dz = 0;
    if (len > 1e-4) { dx = mx / len * speed * dt; dz = mz / len * speed * dt; this.heading = Math.atan2(mx, mz); }
    // One axis at a time, each with a one-cell auto-step so a kerb never stops you.
    if (dx) {
      const old = p.x; p.x += dx;
      if (boxHits(g, p.x, p.y, p.z)) {
        p.x = old;
        if (this.grounded && !boxHits(g, old + dx, p.y + CELL, p.z)) { p.x = old + dx; p.y += CELL; }
      }
    }
    if (dz) {
      const old = p.z; p.z += dz;
      if (boxHits(g, p.x, p.y, p.z)) {
        p.z = old;
        if (this.grounded && !boxHits(g, p.x, p.y + CELL, old + dz)) { p.z = old + dz; p.y += CELL; }
      }
    }
    if (jump && this.grounded) { this.vy = JUMP; this.grounded = false; }
    this.vy -= GRAVITY * dt;
    p.y += this.vy * dt;
    this.grounded = false;
    if (boxHits(g, p.x, p.y, p.z)) {
      if (this.vy < 0) { p.y = (Math.floor(p.y / CELL) + 1) * CELL; this.grounded = true; }
      else p.y = Math.floor((p.y + PH) / CELL) * CELL - PH - 1e-4;
      this.vy = 0;
    }
    this.moving = len > 1e-4 && this.grounded;
    if (p.y < VOID_Y) this.reset();
  }
}
