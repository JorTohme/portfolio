// Pure voxel data model for the sandbox. This module imports nothing on purpose:
// the only non-obvious logic in the game — ray traversal, face occlusion and the
// share codec — stays runnable under plain node via qa/selftest.mjs.
export const SX=32,SY=20,SZ=32;
// Cell pitch matches the home island's 0.72 spacing, so the shared character and
// tree models drop into the world at native scale with no fudge factor.
export const CELL=.72;
// Grid values are 1-based indices into this list; 0 is air. Names match the
// palette keys in voxel-models.js, so a cell maps straight to a material.
export const BLOCKS=['grass','grassLight','soil','soilDark','soilLight','wood','bark','leaves','leavesLight','leavesDark','lime','cream','stone','yellow','orange','ink'];
export const B=Object.fromEntries(BLOCKS.map((k,i)=>[k,i+1]));
export const idx=(x,y,z)=>(y*SZ+z)*SX+x;
export const inBounds=(x,y,z)=>x>=0&&x<SX&&y>=0&&y<SY&&z>=0&&z<SZ;
export const createGrid=()=>new Uint8Array(SX*SY*SZ);
export const get=(g,x,y,z)=>inBounds(x,y,z)?g[idx(x,y,z)]:0;
export const set=(g,x,y,z,v)=>{if(inBounds(x,y,z))g[idx(x,y,z)]=v;};

const NEIGHBOURS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
// A cell earns an instance only when a face touches air. The grid border counts
// as air, so the island's outer shell always renders. Ask this about solid cells.
export const isExposed=(g,x,y,z)=>NEIGHBOURS.some(([dx,dy,dz])=>get(g,x+dx,y+dy,z+dz)===0);

// Amanatides & Woo voxel traversal. Origin and direction are in cell units; the
// camera usually sits outside the grid, so the walk keeps going until the ray has
// passed the box for good. Returns the cell plus the face normal it entered
// through, which is all that place (hit+normal), break (hit) and walk-to need.
export function raycast(g,origin,dir,maxDist=64){
  const len=Math.hypot(dir[0],dir[1],dir[2]);if(!len)return null;
  const d=[dir[0]/len,dir[1]/len,dir[2]/len],cell=[Math.floor(origin[0]),Math.floor(origin[1]),Math.floor(origin[2])];
  if(get(g,cell[0],cell[1],cell[2]))return {x:cell[0],y:cell[1],z:cell[2],nx:0,ny:0,nz:0};
  const step=[0,0,0],tMax=[0,0,0],tDelta=[0,0,0],size=[SX,SY,SZ];
  for(let a=0;a<3;a++){
    if(d[a]>0){step[a]=1;tMax[a]=(cell[a]+1-origin[a])/d[a];tDelta[a]=1/d[a];}
    else if(d[a]<0){step[a]=-1;tMax[a]=(cell[a]-origin[a])/d[a];tDelta[a]=-1/d[a];}
    else {tMax[a]=Infinity;tDelta[a]=Infinity;}
  }
  // Once an axis is past its bound in the direction of travel it can never come back.
  const escaped=()=>{for(let a=0;a<3;a++)if((step[a]>0&&cell[a]>=size[a])||(step[a]<0&&cell[a]<0))return true;return false;};
  for(;;){
    const a=tMax[0]<tMax[1]?(tMax[0]<tMax[2]?0:2):(tMax[1]<tMax[2]?1:2);
    if(tMax[a]>maxDist)return null;
    cell[a]+=step[a];tMax[a]+=tDelta[a];
    if(escaped())return null;
    if(inBounds(cell[0],cell[1],cell[2])&&g[idx(cell[0],cell[1],cell[2])]){
      const n=[0,0,0];n[a]=-step[a];
      return {x:cell[0],y:cell[1],z:cell[2],nx:n[0],ny:n[1],nz:n[2]};
    }
  }
}

// Run-length pairs of [value, count] capped at 255. Synchronous, which is what
// local saving and the first paint want.
function rle(g){
  const out=[];let v=g[0],n=0;
  for(let i=0;i<g.length;i++){if(g[i]===v&&n<255)n++;else{out.push(v,n);v=g[i];n=1;}}
  out.push(v,n);
  return Uint8Array.from(out);
}
function unrle(bytes){
  if(!bytes||!bytes.length||bytes.length%2)return null;
  const g=createGrid();let i=0;
  for(let p=0;p<bytes.length;p+=2){
    const v=bytes[p],n=bytes[p+1];
    if(i+n>g.length)return null;
    if(v)g.fill(v,i,i+n);
    i+=n;
  }
  return i===g.length?g:null;
}
export const encode=g=>toBase64Url(rle(g));
export const decode=s=>unrle(fromBase64Url(s));

// A share link also runs the runs through deflate — native in every current
// browser — which takes the untouched island from ~1800 chars down to ~600.
// The leading marker says which form the payload is in.
const zip=(u8,Stream)=>{
  const s=new Stream('deflate-raw'),w=s.writable.getWriter();
  w.write(u8);w.close();
  return new Response(s.readable).arrayBuffer().then(b=>new Uint8Array(b));
};
export async function pack(g){
  const runs=rle(g);
  if(typeof CompressionStream==='undefined')return 'r'+toBase64Url(runs);
  try{return 'z'+toBase64Url(await zip(runs,CompressionStream));}
  catch{return 'r'+toBase64Url(runs);}
}
export async function unpack(s){
  if(typeof s!=='string'||s.length<2)return null;
  const body=fromBase64Url(s.slice(1));
  if(!body)return null;
  if(s[0]==='r')return unrle(body);
  if(s[0]!=='z'||typeof DecompressionStream==='undefined')return null;
  try{return unrle(await zip(body,DecompressionStream));}catch{return null;}
}
function toBase64Url(bytes){
  let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromBase64Url(s){
  if(typeof s!=='string'||!s||!/^[A-Za-z0-9_-]+$/.test(s))return null;
  try{
    const bin=atob(s.replace(/-/g,'+').replace(/_/g,'/')),out=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
    return out;
  }catch{return null;}
}
