// Isometric solids for project marks, after the Print Labs Element Lab:
// flat Riso inks, no halftone. Faces take their ink from their orientation,
// so two inks give three tones: top = A (light), +x = B, +y = A over B.
// Solids paint in the order given (author back to front); faces within one
// solid sort by depth. Hidden-surface removal happens here, in the source, before printing: every
// face is masked by the faces in front of it, then each plate is one group.
export type V3=[number,number,number];
export type Ring=V3[];
export type Face={pts:V3[];holes?:V3[][];n:V3};
export type Tint={a:number;b:number};
export type Shade={top:Tint;x:Tint;y:Tint};
export const riso:Shade={top:{a:.55,b:0},x:{a:0,b:1},y:{a:1,b:.75}};

const sub=(p:V3,q:V3):V3=>[p[0]-q[0],p[1]-q[1],p[2]-q[2]];
const add=(p:V3,q:V3):V3=>[p[0]+q[0],p[1]+q[1],p[2]+q[2]];
const cross=(p:V3,q:V3):V3=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
const dot=(p:V3,q:V3)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2];
function newell(r:Ring):V3{const n:V3=[0,0,0];r.forEach((p,i)=>{const q=r[(i+1)%r.length];n[0]+=(p[1]-q[1])*(p[2]+q[2]);n[1]+=(p[2]-q[2])*(p[0]+q[0]);n[2]+=(p[0]-q[0])*(p[1]+q[1]);});return n;}
const VIEW:V3=[1,1,1];

/** Extrude an outer ring (plus optional holes) along E. */
export function extrude(outer:Ring,E:V3,holes:Ring[]=[]):Face[]{
 const o=dot(newell(outer),E)>0?[...outer].reverse():outer;
 const hs=holes.map(h=>dot(newell(h),E)<0?[...h].reverse():h);
 const n=newell(o),faces:Face[]=[];
 faces.push({pts:o,holes:hs,n});
 faces.push({pts:o.map(p=>add(p,E)),holes:hs.map(h=>h.map(p=>add(p,E))),n:[-n[0],-n[1],-n[2]]});
 for(const r of [o,...hs])r.forEach((p,i)=>{const q=r[(i+1)%r.length];faces.push({pts:[p,q,add(q,E),add(p,E)],n:cross(sub(q,p),n)});});
 return faces;
}
export const box=(x:number,y:number,z:number,w:number,d:number,h:number)=>extrude([[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]],[0,0,h]);
export const arc=(cx:number,cz:number,r:number,from:number,to:number,steps:number,y=0):Ring=>Array.from({length:steps+1},(_,i)=>{const t=from+(to-from)*i/steps;return [cx+r*Math.cos(t),y,cz+r*Math.sin(t)] as V3;});
export const disc=(cx:number,cy:number,r:number,z:number,steps=40):Ring=>Array.from({length:steps},(_,i)=>{const t=i/steps*Math.PI*2;return [cx+r*Math.cos(t),cy+r*Math.sin(t),z] as V3;});

export type Solid={faces:Face[];shade?:Shade};
/** Render solids to per-plate SVG groups in a 360×220 box. */
export function solidsMarkup(uid:string,solids:Solid[],fit={x:16,y:14,w:328,h:194}){
 const raw=(p:V3)=>[(p[0]-p[1])*.866,(p[0]+p[1])*.5-p[2]];
 const all=solids.flatMap(s=>s.faces.flatMap(f=>f.pts.map(raw)));
 const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
 const k=Math.min(fit.w/(maxX-minX),fit.h/(maxY-minY)),ox=fit.x+(fit.w-(maxX-minX)*k)/2-minX*k,oy=fit.y+(fit.h-(maxY-minY)*k)/2-minY*k;
 const proj=(p:V3)=>{const r=raw(p);return [ox+r[0]*k,oy+r[1]*k];};
 const ring=(r:V3[])=>'M'+r.map(p=>proj(p).map(v=>v.toFixed(2)).join(' ')).join('L')+'Z';
 const items=solids.flatMap((s,order)=>s.faces.filter(f=>dot(f.n,VIEW)>1e-9).map(f=>{
  const len=Math.hypot(...f.n),n=f.n.map(v=>v/len),shade=s.shade||riso;
  const axis=n[2]>=Math.max(n[0],n[1])?'top':n[0]>=n[1]?'x':'y';
  const c=f.pts.reduce((m,p)=>m+p[0]+p[1]+p[2],0)/f.pts.length;
  return {d:ring(f.pts)+(f.holes||[]).map(ring).join(''),tint:shade[axis],c,order};
 })).sort((p,q)=>p.order-q.order||p.c-q.c);
 const plate=(ink:'a'|'b')=>{
  const defs:string[]=[],paths:string[]=[];
  items.forEach((it,i)=>{
   const t=it.tint[ink];if(!t)return;
   // Occluders give back a hairline at their edge so shared edges do not open a paper seam.
   const later=items.slice(i+1).map(q=>`<path d="${q.d}" fill="#000" fill-rule="evenodd" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>`).join('');
   const id=`${uid}-${ink}${i}`;
   defs.push(`<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="220"><path d="${it.d}" fill="#fff" fill-rule="evenodd"/>${later}</mask>`);
   paths.push(`<path d="${it.d}" fill="#000" fill-rule="evenodd" fill-opacity="${t}" mask="url(#${id})"/>`);
  });
  return `<g data-print-tone="solid"><defs>${defs.join('')}</defs>${paths.join('')}</g>`;
 };
 return {a:plate('a'),b:plate('b')};
}
