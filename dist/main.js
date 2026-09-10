import * as THREE from './three.module.js';
import { VoxelRenderer } from './voxel-renderer.js';
import { BOX, createMaterials, buildCharacter, buildTree } from './voxel-models.js';
// The English page hands us its dictionary on the global; the Spanish page has none.
const t=(key,fallback)=>globalThis.__I18N?.[key]??fallback;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:900px)');
let paused=reduced.matches,exploded=false,stage=0,routeProgress=0,scenePass=.5;
const motionButton=document.querySelector('#motion'),explodeButton=document.querySelector('#explode'),sceneWrap=document.querySelector('.scene-wrap'),dock=document.querySelector('.journey-dock'),chapters=[...document.querySelectorAll('.chapter')],sceneSections=[...document.querySelectorAll('[data-scene]')],progress=document.querySelector('.scroll-progress');
for(const el of [...chapters,document.querySelector('.ending')]){const slot=document.createElement('div');slot.className='mobile-scene-slot';slot.setAttribute('aria-hidden','true');el.append(slot);}
function mountScene(){const section=sceneSections.find(el=>Number(el.dataset.scene)===stage),slot=section?.querySelector('.mobile-scene-slot'),parent=small.matches&&slot?slot:document.body;if(sceneWrap.parentElement!==parent)parent.prepend(sceneWrap);}
function motionLabel(){motionButton.setAttribute('aria-pressed',String(paused));motionButton.setAttribute('aria-label',paused?t('motion.play','Activar animaciones'):t('motion.pause','Pausar animaciones'));motionButton.textContent=paused?'▷':'Ⅱ';document.body.classList.toggle('paused',paused);document.documentElement.style.scrollBehavior=paused?'auto':'';}
motionButton.addEventListener('click',()=>{paused=!paused;motionLabel();onScroll();});reduced.addEventListener('change',e=>{paused=e.matches;motionLabel();onScroll();});motionLabel();
explodeButton.addEventListener('click',()=>{exploded=!exploded;explodeButton.setAttribute('aria-pressed',String(exploded));explodeButton.innerHTML=exploded?t('explode.rebuild','<span aria-hidden="true">↶</span> Volvamos a construir'):t('explode.take','<span aria-hidden="true">✳</span> ¿Y si lo desarmamos?');});
let positions=[];
const depthSections=[...document.querySelectorAll('.hero,.chapter,.learning,.ending')];
function updateDepth(){
  document.body.dataset.scenery=stage>=3?'workshop':'forest';
  document.body.style.setProperty('--scenery-y',paused?'0px':(Math.sin(routeProgress*.8)*(small.matches?12:36)).toFixed(1)+'px');
  for(const el of depthSections){
    const rect=el.getBoundingClientRect();
    if(rect.bottom<0||rect.top>innerHeight)continue;
    const pass=THREE.MathUtils.clamp((innerHeight-rect.top)/(innerHeight+rect.height),0,1);
    el.style.setProperty('--depth-y',paused?'0px':((pass-.5)*(small.matches?30:100)).toFixed(1)+'px');
    el.style.setProperty('--depth-turn',paused||small.matches?'0deg':((pass-.5)*-7).toFixed(2)+'deg');
  }
  const slot=sceneWrap.parentElement;
  if(small.matches&&slot.classList.contains('mobile-scene-slot')){const rect=slot.getBoundingClientRect();scenePass=THREE.MathUtils.clamp((innerHeight-rect.top)/(innerHeight+rect.height),0,1);}else scenePass=.5;
}
function measure(){positions=sceneSections.map(el=>({top:el.getBoundingClientRect().top+scrollY,stage:Number(el.dataset.scene)}));}
function onScroll(){const y=scrollY+innerHeight*.35;stage=0;for(const p of positions)if(y>=p.top)stage=p.stage;
const index=Math.max(0,positions.findLastIndex(p=>y>=p.top)),from=positions[index],to=positions[index+1];
routeProgress=from?(to?from.stage+THREE.MathUtils.clamp((y-from.top)/Math.max(1,to.top-from.top),0,1)*(to.stage-from.stage):from.stage):0;
progress.style.transform='scaleX('+scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)+')';const show=stage>=1&&stage<=3;dock.classList.toggle('show',show);dock.inert=!show;dock.querySelectorAll('a').forEach((a,i)=>{a.classList.toggle('active',stage===i+1);if(stage===i+1)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});const hidden=stage===4||stage===5;sceneWrap.style.opacity=hidden?'0':'1';document.body.classList.toggle('scene-off',hidden);mountScene();updateDepth();}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{measure();onScroll();},{passive:true});document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',measure));document.fonts.ready.then(()=>{measure();onScroll();});measure();onScroll();
// The scene canvas is pointer-transparent and sits under the text layer, so the
// play CTA is revealed by a rect test rather than a CSS :hover on the scene.
addEventListener('pointermove',e=>{if(small.matches||e.pointerType!=='mouse')return;const r=sceneWrap.getBoundingClientRect();document.body.classList.toggle('scene-hot',e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);},{passive:true});
addEventListener('pointerleave',()=>document.body.classList.remove('scene-hot'));
if(!reduced.matches&&'IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.chapter-content,.learning-list>div,.study-row,.journey-intro').forEach(el=>{el.classList.add('reveal');observer.observe(el);});}
try{createWorld();}catch(error){document.body.classList.add('webgl-unavailable');console.warn(t('scene.unavailable','La escena 3D no está disponible.'),error);}
function createWorld(){
let canvas=document.querySelector('#world'),renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'}); }
catch { const replacement=document.createElement('canvas');replacement.id='world';canvas.replaceWith(replacement);canvas=replacement;renderer=new VoxelRenderer(canvas);document.body.classList.add('software-3d'); }
renderer.setClearColor(0x174c38,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5,5,5,-5,.1,80);camera.position.set(10,8,12);camera.lookAt(0,.1,0);
scene.add(new THREE.HemisphereLight(0xf3ffe1,0x235536,2.4));
const sun=new THREE.DirectionalLight(0xffe8b3,3.3);sun.position.set(-4,10,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:30});sun.shadow.normalBias=.025;scene.add(sun);
const fill=new THREE.DirectionalLight(0xb9edc1,1.6);fill.position.set(5,3,-5);scene.add(fill);
const island=new THREE.Group();scene.add(island);const geo=BOX;
const mats=createMaterials(),pieces=[];
function block(parent,x,y,z,sx,sy,sz,color,level=0,scatter=false){const mesh=new THREE.Mesh(geo,mats[color]);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);if(level||scatter)pieces.push({mesh,home:mesh.position.clone(),size:mesh.scale.clone(),level,index:pieces.length});return mesh;}
// Irregular layers of grass, exposed earth and a stone path.
for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++){if(Math.abs(x)===3&&Math.abs(z)===3)continue;const h=((x*7+z*3+53)%5)*.025;block(island,x*.72,-1.15+h,z*.72,.72,.24,.72,(x+z+9)%3===0?'grassLight':'grass');block(island,x*.72,-1.65,z*.72,.72,.77,.72,(x*3+z+14)%3===0?'soilDark':'soil');if((x+z+10)%3===0)block(island,x*.72,-2.1,z*.72,.7,.25,.7,'soilLight');}
for(let i=0;i<7;i++)block(island,1.4-i*.43,-.998,1.5,.38,.07,.55,'stone');
// Each chapter adds the next course of the construction.
for(let x=0;x<3;x++)for(let z=0;z<3;z++)block(island,-.55+x*.53,-.87,-.65+z*.5,.5,.24,.47,'stone',1,true);
for(let j=0;j<3;j++){block(island,-.55,-.5+j*.44,-.65,.5,.42,.5,j%2?'cream':'stone',2,true);block(island,.51,-.5+j*.44,-.65,.5,.42,.5,j%2?'cream':'stone',2,true);}
block(island,-.02,.65,-.65,1.55,.3,.53,'cream',3,true);block(island,-.55,-.1,.35,.48,1.28,.45,'cream',3,true);block(island,-.02,.7,.35,1.55,.25,.48,'cream',3,true);
// Timber crane, counterweight, cable and suspended block.
block(island,1.55,.4,-1.3,.23,2.85,.23,'yellow',2,true);block(island,.68,1.82,-1.3,2.5,.2,.22,'yellow',2,true);block(island,1.88,1.68,-1.3,.6,.43,.43,'ink',2,true);
for(let j=0;j<6;j++)block(island,1.55,-.7+j*.43,-1.3,.44,.07,.34,'orange',2,true);
block(island,-.42,1.17,-1.3,.04,1.16,.04,'ink',2,true);block(island,-.42,.57,-1.3,.53,.53,.53,'cream',2,true);
function tree(x,z,s=1){const g=buildTree(mats);g.position.set(x,-1,z);g.scale.setScalar(s);island.add(g);return g;}
const trees=[tree(-1.65,-1.18,1.08),tree(-2.03,.17,.7),tree(1.75,1.2,.62)];
function sprout(x,z){block(island,x,-.8,z,.065,.35,.065,'leavesDark');block(island,x-.12,-.68,z,.26,.09,.14,'lime');block(island,x+.1,-.59,z,.22,.09,.14,'grassLight');}
[[-1.8,1.45],[-1.4,1.1],[2,-.1],[.4,2],[-.4,-1.8],[-2.1,-.5]].forEach(([x,z])=>sprout(x,z));
[[-1.9,1.85],[1.95,.55],[-1.35,-1.7]].forEach(([x,z])=>{block(island,x,-.81,z,.065,.35,.065,'leaves');block(island,x,-.59,z,.24,.17,.24,'yellow');block(island,x,-.5,z,.09,.04,.09,'orange');});
// The builder stands beside the stone path; the arm keeps waving.
const {group:builder,arm}=buildCharacter(mats);builder.position.set(.55,-1.02,1.43);builder.rotation.y=.15;island.add(builder);
for(let i=0;i<2;i++){block(island,1.3+i*.44,-.81,.45,.38,.36,.36,'wood',1,true);block(island,1.3+i*.44,-.81,.64,.29,.06,.03,'cream',1,true);block(island,-1.1+i*.72,-.68,1.98,.1,.64,.1,'wood');}
for(let i=0;i<5;i++)block(island,-1.1+i*.18,-.49,1.99,.18,.2,.12,i%2?'ink':'yellow');
const motes=[];for(let i=0;i<8;i++){const m=block(island,Math.sin(i*2.4)*3,Math.cos(i*1.3)*1.4+.3,Math.cos(i*2.4)*2.6,.065,.065,.065,'lime');motes.push({mesh:m,y:m.position.y});}
const target=new THREE.Vector3();
// A continuous camera route controlled by native page scroll: orbit, height,
// focus and zoom. It works identically with WebGL and the CPU voxel renderer.
const cameraStops=[
  [.69,.48,1,0], [1.45,.565,1.055,.02],
  [2.6,.63,1.02,.06], [3.45,.48,1.06,.25], [4.2,.58,1,0],
  [5.35,.56,1,0], [6.97,.5,1.02,0]
];
let cameraAngle=.69,cameraHeight=.48,cameraFocus=0;
function moveCamera(a){
  if(paused)return;
  const p=THREE.MathUtils.clamp(routeProgress,0,6),i=Math.min(5,Math.floor(p));
  const f=THREE.MathUtils.smoothstep(p-i,0,1),start=cameraStops[i],end=cameraStops[i+1];
  const drift=small.matches?(scenePass-.5)*.7:0;
  cameraAngle=THREE.MathUtils.lerp(cameraAngle,THREE.MathUtils.lerp(start[0],end[0],f)+drift,a);
  cameraHeight=THREE.MathUtils.lerp(cameraHeight,THREE.MathUtils.lerp(start[1],end[1],f),a);
  cameraFocus=THREE.MathUtils.lerp(cameraFocus,THREE.MathUtils.lerp(start[3],end[3],f),a);
  camera.zoom=THREE.MathUtils.lerp(camera.zoom,THREE.MathUtils.lerp(start[2],end[2],f),a);
  camera.position.set(Math.sin(cameraAngle)*18*Math.cos(cameraHeight),Math.sin(cameraHeight)*18,Math.cos(cameraAngle)*18*Math.cos(cameraHeight));
  camera.lookAt(0,cameraFocus,0);camera.updateProjectionMatrix();
}
function resize(){const w=sceneWrap.clientWidth,h=sceneWrap.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(devicePixelRatio,small.matches?1.35:1.7));renderer.setSize(w,h,false);const view=Math.max(small.matches?8.3:9.2,7.8*h/w);camera.left=-view*w/h/2;camera.right=view*w/h/2;camera.top=view/2;camera.bottom=-view/2;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(sceneWrap);resize();
let t=0,last=0,lastDraw=0;const pointer=new THREE.Vector2();
addEventListener('pointermove',e=>{if(!small.matches&&e.pointerType==='mouse')pointer.set(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);},{passive:true});
function animate(now){requestAnimationFrame(animate);if(now-lastDraw<(small.matches?32:16))return;const dt=Math.min((now-(last||now))/1000,.05);last=now;lastDraw=now;if(document.hidden||stage===4||stage===5)return;if(small.matches){const r=sceneWrap.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;}if(!paused)t+=dt;const a=paused?1:1-Math.exp(-dt*7);island.position.y=paused?0:Math.sin(t*.7)*.07;island.rotation.y=THREE.MathUtils.lerp(island.rotation.y,paused?0:Math.sin(t*.12)*.09+pointer.x*.06,a);
for(const p of pieces){const show=stage===0||stage===6||p.level<=stage;target.copy(p.home);const scatter=exploded&&stage===0;if(scatter){target.x+=Math.sin(p.index*2.3)*1.5;target.z+=Math.cos(p.index*1.7)*1.5;target.y+=.8+(p.index%4)*.26;}p.mesh.position.lerp(target,a);target.copy(p.size).multiplyScalar(show?1:.001);p.mesh.scale.lerp(target,a);p.mesh.rotation.y=THREE.MathUtils.lerp(p.mesh.rotation.y,scatter?p.index*.13:0,a);}
arm.rotation.z=paused?.2:.55-Math.sin(t*2.3)*.3;trees.forEach((tree,i)=>tree.rotation.z=paused?0:Math.sin(t*.8+i)*.012);motes.forEach((p,i)=>p.mesh.position.y=p.y+(paused?0:Math.sin(t+i)*.16));moveCamera(a);renderer.render(scene,camera);}
requestAnimationFrame(animate);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.body.classList.add('webgl-unavailable');});canvas.addEventListener('webglcontextrestored',()=>document.body.classList.remove('webgl-unavailable'));
}
