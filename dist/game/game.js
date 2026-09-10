import * as THREE from '../three.module.js';
import { CELL, B, encode, decode, pack, unpack } from './grid.js';
import { buildIsland, SPAWN, CX, CZ } from './island.js';
import { World } from './world.js';
import { Player, cellOverlapsBox } from './player.js';
import { PALETTE, buildCharacter } from '../voxel-models.js';

const canvas = document.querySelector('#world');
const small = matchMedia('(max-width:900px)');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// The English page hands us its dictionary on the global; the Spanish page has none.
const t = (key, fallback) => globalThis.__I18N?.[key] ?? fallback;

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
catch { document.querySelector('#fallback').hidden = false; }

if (renderer) start();

function start() {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Shadows only refresh every few frames; the sun moves slowly enough to hide it.
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x174c38);
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 140);

  const CENTRE = new THREE.Vector3((CX + .5) * CELL, 3 * CELL, (CZ + .5) * CELL);
  const hemi = new THREE.HemisphereLight(0xf3ffe1, 0x235536, 2.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe8b3, 3.3);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: .5, far: 90 });
  sun.shadow.normalBias = .03;
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.position.copy(CENTRE); scene.add(sun.target); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb9edc1, 1.1); fill.position.set(8, 6, -8); scene.add(fill);

  const world = new World(scene);
  world.load(initialGrid());
  const player = new Player(world.grid, SPAWN);
  const { group: avatar, arm } = buildCharacter(world.mats);
  scene.add(avatar);

  // A shared link inflates asynchronously; the local island is already on screen,
  // so the swap costs nothing visible.
  const shared = decodeURIComponent(location.hash.slice(1));
  if (shared) unpack(shared).then(g => {
    if (!g) return toast(t('game.badLink', 'Ese link no se pudo abrir'));
    world.load(g); player.reset(); toast(t('game.loaded', 'Isla compartida cargada'));
  });

  // A translucent cube marking the cell the pointer is over.
  const cursor = new THREE.Mesh(new THREE.BoxGeometry(CELL * 1.04, CELL * 1.04, CELL * 1.04),
    new THREE.MeshBasicMaterial({ color: 0xf5e8b5, transparent: true, opacity: .22, depthWrite: false }));
  cursor.visible = false; scene.add(cursor);

  // ---- camera ---------------------------------------------------------------
  let yaw = .69, pitch = .58, view = 17;
  const focus = new THREE.Vector3();
  function placeCamera(a) {
    focus.lerp(new THREE.Vector3(player.pos.x, player.pos.y + .7, player.pos.z), a);
    const d = 34, ch = Math.cos(pitch);
    camera.position.set(focus.x + Math.sin(yaw) * d * ch, focus.y + Math.sin(pitch) * d, focus.z + Math.cos(yaw) * d * ch);
    camera.lookAt(focus);
  }
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, small.matches ? 1.35 : 1.7));
    renderer.setSize(w, h, false);
    // On a tall phone the vertical extent alone would leave the island a speck,
    // so grow it until a useful width is on screen — same trick as the home scene.
    const v = Math.max(view, 13 * h / w);
    camera.left = -v * w / h / 2; camera.right = v * w / h / 2;
    camera.top = v / 2; camera.bottom = -v / 2;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize, { passive: true });
  resize(); placeCamera(1);

  // ---- hotbar ---------------------------------------------------------------
  const HOTBAR = ['grass', 'soil', 'stone', 'cream', 'bark', 'leaves', 'yellow', 'orange'];
  let selected = B[HOTBAR[0]];
  const bar = document.querySelector('#hotbar');
  HOTBAR.forEach((key, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'slot'; b.dataset.value = B[key];
    b.setAttribute('aria-label', `${t('game.block', 'Bloque')} ${i + 1}`);
    b.innerHTML = `<span>${i + 1}</span><i style="background:#${PALETTE[key].toString(16).padStart(6, '0')}"></i>`;
    bar.append(b);
  });
  const eraser = document.createElement('button');
  eraser.type = 'button'; eraser.className = 'slot slot-erase'; eraser.dataset.value = '0';
  eraser.setAttribute('aria-label', t('game.eraser', 'Borrar bloques'));
  eraser.innerHTML = `<span>9</span><i aria-hidden="true">⌫</i>`;
  bar.append(eraser);
  const slots = [...bar.children];
  function select(v) {
    selected = v;
    slots.forEach(s => s.classList.toggle('on', Number(s.dataset.value) === v));
  }
  bar.addEventListener('click', e => {
    const slot = e.target.closest('.slot');
    if (slot) { select(Number(slot.dataset.value)); hideHint(); }
  });
  select(selected);

  // ---- walk / build toggle (touch) ------------------------------------------
  let walkMode = true;
  const modeButton = document.querySelector('#mode');
  modeButton.addEventListener('click', () => {
    walkMode = !walkMode;
    modeButton.textContent = walkMode ? '🚶' : '⛏';
    modeButton.setAttribute('aria-label', walkMode ? t('game.modeWalk', 'Modo caminar activo') : t('game.modeBuild', 'Modo construir activo'));
    hideHint();
  });
  if (small.matches) document.querySelector('#hint').innerHTML = t('game.hintTouch',
    '<b>Tocá el piso</b> para caminar hasta ahí<br><b>Arrastrá</b> para girar la cámara · <b>pellizcá</b> para acercar<br>Con <b>⛏</b> tocás un bloque para ponerlo o sacarlo');

  // ---- input ----------------------------------------------------------------
  const keys = new Set();
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ') e.preventDefault();
    if (k >= '1' && k <= '9') { const i = Number(k) - 1; if (slots[i]) select(Number(slots[i].dataset.value)); }
    keys.add(k); walkTarget = null; hideHint();
  });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());

  const raycaster = new THREE.Raycaster();
  const pointers = new Map();
  let dragged = false, lastX = 0, lastY = 0, pinch = 0, walkTarget = null;
  const twoDist = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false; lastX = e.clientX; lastY = e.clientY;
    if (pointers.size === 2) pinch = twoDist();
  });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) {
      if (!small.matches && e.pointerType === 'mouse') hover(e.clientX, e.clientY);
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const d = twoDist();
      if (pinch && d) { view = clamp(view * pinch / d, 8, 34); resize(); }
      pinch = d; dragged = true; return;
    }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 5) dragged = true;
    if (dragged) { yaw -= dx * .006; pitch = clamp(pitch + dy * .004, .18, 1.3); }
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', e => {
    pointers.delete(e.pointerId); pinch = 0;
    if (!dragged) tap(e.clientX, e.clientY, e.button);
  });
  canvas.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); pinch = 0; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    view = clamp(view * (1 + Math.sign(e.deltaY) * .12), 8, 34); resize();
  }, { passive: false });

  function rayAt(cx, cy) {
    raycaster.setFromCamera(new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight * 2 - 1)), camera);
    return world.pick(raycaster.ray.origin, raycaster.ray.direction, 70);
  }
  function hover(cx, cy) {
    const hit = rayAt(cx, cy);
    cursor.visible = !!hit;
    if (hit) cursor.position.set((hit.x + .5) * CELL, (hit.y + .5) * CELL, (hit.z + .5) * CELL);
  }
  function tap(cx, cy, button) {
    hideHint();
    const hit = rayAt(cx, cy);
    if (!hit) return;
    if (small.matches && walkMode) { walkTarget = { x: (hit.x + .5) * CELL, z: (hit.z + .5) * CELL }; return; }
    if (button === 2 || selected === 0) { world.set(hit.x, hit.y, hit.z, 0); scheduleSave(); return; }
    const nx = hit.x + hit.nx, ny = hit.y + hit.ny, nz = hit.z + hit.nz;
    if (cellOverlapsBox(nx, ny, nz, player.pos)) { toast(t('game.onYou', 'Ahí estás parado vos')); return; }
    if (world.set(nx, ny, nz, selected)) scheduleSave();
  }

  // ---- persistence and sharing ---------------------------------------------
  const KEY = 'jt-isla-voxel';
  let saveTimer;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, encode(world.grid)); } catch { } }, 700);
  }
  document.querySelector('#share').addEventListener('click', async () => {
    const payload = await pack(world.grid);
    if (payload.length > 4000) return toast(t('game.tooBig', 'Tu isla quedó muy grande para un link'));
    const url = location.origin + location.pathname + '#' + payload;
    try { await navigator.clipboard.writeText(url); toast(t('game.copied', 'Link copiado')); }
    catch { location.hash = payload; toast(t('game.inBar', 'Link listo en la barra de direcciones')); }
  });
  document.querySelector('#png').addEventListener('click', () => {
    // Render and read back in the same task, so preserveDrawingBuffer stays off.
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.href = renderer.domElement.toDataURL('image/png');
    a.download = t('game.file', 'mi-isla.png'); a.click();
    toast(t('game.saved', 'Imagen descargada'));
  });
  document.querySelector('#reset').addEventListener('click', () => {
    world.load(buildIsland()); player.reset(); walkTarget = null;
    try { localStorage.removeItem(KEY); } catch { }
    history.replaceState(null, '', location.pathname);
    toast(t('game.restored', 'Isla original restaurada'));
  });

  // ---- day and night --------------------------------------------------------
  const DAY = 170;
  const SUN_DAY = new THREE.Color(0xffe8b3), SUN_NIGHT = new THREE.Color(0x5f7fd8);
  const SKY_DAY = new THREE.Color(0xf3ffe1), SKY_NIGHT = new THREE.Color(0x2b4a72);
  const BG_DAY = new THREE.Color(0x174c38), BG_NIGHT = new THREE.Color(0x0b1f33);
  function updateSky(t) {
    const a = t / DAY * Math.PI * 2 + .6, height = Math.sin(a);
    sun.position.set(CENTRE.x + Math.cos(a) * 30, CENTRE.y + height * 30, CENTRE.z + 12);
    const day = clamp(height * 1.7 + .35, 0, 1);
    sun.intensity = .35 + day * 3;
    sun.color.copy(SUN_NIGHT).lerp(SUN_DAY, day);
    hemi.intensity = .75 + day * 1.8;
    hemi.color.copy(SKY_NIGHT).lerp(SKY_DAY, day);
    scene.background.copy(BG_NIGHT).lerp(BG_DAY, day);
    fill.intensity = .35 + day * .85;
  }

  // ---- ui helpers -----------------------------------------------------------
  const hintEl = document.querySelector('#hint'), toastEl = document.querySelector('#toast');
  let hintTimer = setTimeout(hideHint, 14000), toastTimer;
  function hideHint() { clearTimeout(hintTimer); hintEl.classList.add('gone'); }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2200);
  }

  function initialGrid() {
    try { const s = localStorage.getItem(KEY); if (s) { const g = decode(s); if (g) return g; } } catch { }
    return buildIsland();
  }

  // ---- loop -----------------------------------------------------------------
  const turn = (cur, to, a) => cur + (((to - cur + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * a;
  let last = 0, lastDraw = 0, clock = 0, frame = 0;

  function animate(now) {
    requestAnimationFrame(animate);
    if (document.hidden) { last = 0; return; }
    if (now - lastDraw < (small.matches ? 32 : 16)) return;
    const dt = Math.min((now - (last || now)) / 1000, .05);
    last = now; lastDraw = now; clock += dt;
    const a = 1 - Math.exp(-dt * 9);

    let mx = 0, mz = 0, f = 0, s = 0;
    if (keys.has('w') || keys.has('arrowup')) f += 1;
    if (keys.has('s') || keys.has('arrowdown')) f -= 1;
    if (keys.has('d') || keys.has('arrowright')) s += 1;
    if (keys.has('a') || keys.has('arrowleft')) s -= 1;
    if (f || s) {
      // Forward is away from the camera, so movement follows wherever you orbited to.
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      mx = f * fx + s * -fz; mz = f * fz + s * fx;
    } else if (walkTarget) {
      const dx = walkTarget.x - player.pos.x, dz = walkTarget.z - player.pos.z;
      if (Math.hypot(dx, dz) < .3) walkTarget = null; else { mx = dx; mz = dz; }
    }
    player.update(dt, mx, mz, keys.has(' '));

    avatar.position.set(player.pos.x, player.pos.y, player.pos.z);
    avatar.rotation.y = turn(avatar.rotation.y, player.heading, a);
    arm.rotation.z = player.moving ? Math.sin(clock * 11) * .95 : .55 - Math.sin(clock * 2.3) * .3;

    if (world.dirty) world.rebuild();
    placeCamera(a);
    updateSky(clock);
    frame++;
    renderer.shadowMap.needsUpdate = frame % (small.matches ? 4 : 2) === 0;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.querySelector('#fallback').hidden = false; });
  canvas.addEventListener('webglcontextrestored', () => { document.querySelector('#fallback').hidden = true; world.dirty = true; });
}
