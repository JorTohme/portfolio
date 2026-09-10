import * as THREE from './three.module.js';
// CPU projection fallback for environments without WebGL. The same 3D geometry,
// camera and animation remain active; only shadows and GPU lighting are omitted.
export class VoxelRenderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas unavailable');this.shadowMap={};this.ratio=1;this.width=1;this.height=1;}
  setClearColor(){}
  setPixelRatio(ratio){this.ratio=Math.min(ratio,1.3);}
  setSize(w,h){this.width=w;this.height=h;this.canvas.width=Math.round(w*this.ratio);this.canvas.height=Math.round(h*this.ratio);}
  render(scene,camera){
    const ctx=this.ctx;ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.clearRect(0,0,this.width,this.height);
    scene.updateMatrixWorld();camera.updateMatrixWorld();
    const faces=[],light=new THREE.Vector3(-.4,.9,.6).normalize(),cameraDirection=new THREE.Vector3();camera.getWorldDirection(cameraDirection);
    const normal=new THREE.Vector3(),world=new THREE.Vector3(),projected=new THREE.Vector3(),normalMatrix=new THREE.Matrix3(),color=new THREE.Color();
    scene.traverse(mesh=>{
      if(!mesh.isMesh||mesh.scale.x<.01)return;
      const pos=mesh.geometry.attributes.position,norm=mesh.geometry.attributes.normal;if(!pos||!norm)return;
      normalMatrix.getNormalMatrix(mesh.matrixWorld);
      // BoxGeometry has six groups, each with four vertices.
      for(let face=0;face<6;face++){
        const offset=face*4;normal.fromBufferAttribute(norm,offset).applyMatrix3(normalMatrix).normalize();
        if(normal.dot(cameraDirection)>=0)continue;
        const pts=[];let depth=0;
        for(const j of [0,1,3,2]){world.fromBufferAttribute(pos,offset+j).applyMatrix4(mesh.matrixWorld);projected.copy(world).project(camera);pts.push([(projected.x*.5+.5)*this.width,(-projected.y*.5+.5)*this.height]);depth+=projected.z;}
        const shade=.48+Math.max(0,normal.dot(light))*.63;
        color.copy(mesh.material.color).multiplyScalar(shade);
        faces.push({pts,depth:depth/4,color:color.getStyle()});
      }
    });
    faces.sort((a,b)=>b.depth-a.depth);
    for(const face of faces){ctx.beginPath();face.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=face.color;ctx.strokeStyle=face.color;ctx.lineWidth=.4;ctx.fill();ctx.stroke();}
  }
}
