import * as THREE from '../three.module.js';
import { SX, SY, SZ, CELL, BLOCKS, idx, get, isExposed, inBounds, createGrid, raycast } from './grid.js';
import { createMaterials, BOX } from '../voxel-models.js';

// One InstancedMesh per palette colour, rebuilt only when the grid changes.
// A cell with all six neighbours solid is skipped, which drops the island's
// interior and keeps the whole world at sixteen draw calls.
export class World {
  constructor(scene) {
    this.grid = createGrid();
    this.mats = createMaterials();
    this.meshes = BLOCKS.map(() => null);
    this.group = new THREE.Group();
    scene.add(this.group);
    this.dirty = true;
  }
  // Copies in place: Player holds a reference to this same array.
  load(grid) { this.grid.set(grid); this.dirty = true; }
  get(x, y, z) { return get(this.grid, x, y, z); }
  set(x, y, z, v) {
    if (!inBounds(x, y, z)) return false;
    const i = idx(x, y, z);
    if (this.grid[i] === v) return false;
    this.grid[i] = v; this.dirty = true; return true;
  }
  rebuild() {
    const buckets = BLOCKS.map(() => []);
    for (let y = 0; y < SY; y++) for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
      const v = this.grid[idx(x, y, z)];
      if (v && isExposed(this.grid, x, y, z)) buckets[v - 1].push(x, y, z);
    }
    const m = new THREE.Matrix4();
    buckets.forEach((cells, i) => {
      const n = cells.length / 3;
      let mesh = this.meshes[i];
      if (!mesh || mesh.instanceMatrix.count < n) {
        if (mesh) { this.group.remove(mesh); mesh.dispose(); }
        mesh = new THREE.InstancedMesh(BOX, this.mats[BLOCKS[i]], Math.max(64, Math.ceil(n * 1.35)));
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        this.group.add(mesh); this.meshes[i] = mesh;
      }
      for (let k = 0; k < n; k++) {
        m.makeScale(CELL, CELL, CELL);
        m.setPosition((cells[k * 3] + .5) * CELL, (cells[k * 3 + 1] + .5) * CELL, (cells[k * 3 + 2] + .5) * CELL);
        mesh.setMatrixAt(k, m);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    });
    this.dirty = false;
  }
  // Ray comes in world units; the traversal works in cells.
  pick(origin, dir, maxDist = 60) {
    return raycast(this.grid, [origin.x / CELL, origin.y / CELL, origin.z / CELL], [dir.x, dir.y, dir.z], maxDist);
  }
}
