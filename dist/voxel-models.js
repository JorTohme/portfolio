import * as THREE from './three.module.js';
// Voxel vocabulary shared by the scrolling island and the sandbox page. Every
// model here is decorative: it never joins the island's staged `pieces` list.
export const PALETTE={grass:0x79aa4a,grassLight:0x9bc960,soil:0x99704b,soilDark:0x735039,soilLight:0xb98c62,wood:0xa07343,bark:0x654831,leaves:0x478741,leavesLight:0x78ad4c,leavesDark:0x2c6739,lime:0xc1d879,cream:0xf5e8b5,stone:0xc7c8ad,yellow:0xf4c45e,orange:0xd88948,ink:0x253d32};
// One unit cube reused by every block, so the CPU fallback renderer can keep
// assuming six four-vertex groups per geometry.
export const BOX=new THREE.BoxGeometry(1,1,1);
export const createMaterials=()=>Object.fromEntries(Object.entries(PALETTE).map(([k,v])=>[k,new THREE.MeshStandardMaterial({color:v,roughness:1,flatShading:true})]));
function block(parent,mats,x,y,z,sx,sy,sz,color){const mesh=new THREE.Mesh(BOX,mats[color]);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
// Friendly voxel builder, with overalls and a waving arm. Returns the arm apart
// so the caller can animate it.
export function buildCharacter(mats){
  const group=new THREE.Group(),b=(p,...a)=>block(p,mats,...a);
  b(group,-.14,.12,0,.19,.24,.25,'ink');b(group,.14,.12,0,.19,.24,.25,'ink');b(group,0,.41,0,.48,.43,.29,'orange');b(group,0,.39,.17,.29,.3,.07,'leavesDark');b(group,0,.84,0,.49,.43,.43,'cream');
  b(group,-.11,.86,.224,.058,.068,.022,'ink');b(group,.11,.86,.224,.058,.068,.022,'ink');b(group,0,.73,.224,.1,.027,.022,'ink');b(group,0,1.07,0,.58,.11,.53,'yellow');b(group,0,1.18,0,.41,.17,.4,'yellow');b(group,-.33,.5,0,.16,.34,.19,'cream');
  const arm=new THREE.Group();arm.position.set(.32,.61,0);group.add(arm);b(arm,0,-.09,0,.17,.34,.2,'cream');
  return {group,arm};
}
// Chunky tree: one trunk and four staggered leaf clusters. Sits on y=0.
export function buildTree(mats){
  const g=new THREE.Group(),b=(...a)=>block(g,mats,...a);
  b(0,.65,0,.27,1.3,.27,'bark');b(0,1.45,0,1.08,.75,.98,'leaves');b(-.32,1.65,.14,.67,.68,.64,'leavesLight');b(.33,1.5,-.15,.66,.72,.77,'leavesDark');b(0,2,0,.66,.45,.68,'leavesLight');
  return g;
}
