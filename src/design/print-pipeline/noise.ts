import {rng} from '../vendor/print-lab-core.js';
export {rng};
const smooth=(t:number)=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
export function salt(seed:number,key:string){for(const c of key)seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
/** Continuous seeded value noise; four octaves form an fBm field in CSS pixels.
 * Lattice randomness uses Print Lab's original mulberry32 PRNG. */
/** Exactly rng(salt(seed,`${x}:${y}`))() for integer x, y — the original lattice value —
 * without building the string: the FNV-style salt walks the decimal digits directly. */
const digits=new Int32Array(12);
function hashInt(h:number,n:number){
 if(n<0){h=Math.imul(h^45,16777619);n=-n;}
 let k=0;do{digits[k++]=48+n%10;n=Math.floor(n/10);}while(n>0);
 while(k>0)h=Math.imul(h^digits[--k],16777619);
 return h;
}
export function latticeValue(seed:number,x:number,y:number){
 let h=hashInt(seed,x);h=Math.imul(h^58,16777619);h=hashInt(h,y);
 let a=(h>>>0)|0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;
}
export function valueNoise(seed:number,cell:number){
 // Lattice values are unchanged (latticeValue ≡ rng(salt(seed,"x:y"))()). Lookups reuse
 // the last cell's four corners, since neighbouring pixels almost always share it.
 const cache=new Map<number,number>(),bias=1<<20,span=2**21;
 const value=(x:number,y:number)=>{const key=(x+bias)*span+(y+bias);let v=cache.get(key);if(v===undefined){v=latticeValue(seed,x,y);if(cache.size>200000)cache.clear();cache.set(key,v);}return v;};
 let cx=NaN,cy=NaN,a=0,b=0,c=0,d=0;
 return (x:number,y:number)=>{x/=cell;y/=cell;const ix=Math.floor(x),iy=Math.floor(y);
  if(ix!==cx||iy!==cy){cx=ix;cy=iy;a=value(ix,iy);b=value(ix+1,iy);c=value(ix,iy+1);d=value(ix+1,iy+1);}
  const u=smooth(x-ix),v=smooth(y-iy);return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;};
}
export function fbm(seed:number,cell:number){const fields=Array.from({length:4},(_,i)=>valueNoise(salt(seed,String(i)),cell/2**i));return(x:number,y:number)=>fields.reduce((n,f,i)=>n+f(x,y)*2**-i,0)/1.875;}

export {lowNoise,spread,spotT,boxBlur} from '../vendor/print-lab-core.js';
/** Print Lab's lowNoise(n, grid, r) restricted to the top-left w×h of its n×n square, with
 * stride w. The lattice draws happen first and in the same order, so every value is
 * identical to the square version; only the unused rows and columns are skipped. */
export function lowNoiseRect(n:number,grid:number,r:()=>number,w:number,h:number){
 const G=grid+1,v=new Float32Array(G*G);for(let i=0;i<v.length;i++)v[i]=r();
 const out=new Float32Array(w*h),sc=grid/n;
 for(let y=0;y<h;y++){const fy=y*sc,iy=Math.floor(fy),ty=fy-iy,sy=ty*ty*(3-2*ty);
  for(let x=0;x<w;x++){const fx=x*sc,ix=Math.floor(fx),tx=fx-ix,sx=tx*tx*(3-2*tx);
   const a=v[iy*G+ix],b=v[iy*G+ix+1],c=v[(iy+1)*G+ix],d=v[(iy+1)*G+ix+1];
   out[y*w+x]=(a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy;}}
 return out;
}

// Versioned compatibility generators. Do not substitute algorithms: seeds are visual data.
export function legacyXorshift(seed:number){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
export function legacyRandom(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
export function legacyHash(x:number,y:number,seed:number){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export function legacyField(x:number,y:number,seed:number){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);return (legacyHash(ix,iy,seed)*(1-a)+legacyHash(ix+1,iy,seed)*a)*(1-b)+(legacyHash(ix,iy+1,seed)*(1-a)+legacyHash(ix+1,iy+1,seed)*a)*b;}
