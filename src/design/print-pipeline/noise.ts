import {rng} from '../vendor/print-lab-core.js';
export {rng};
const smooth=(t:number)=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v);};
export function salt(seed:number,key:string){for(const c of key)seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
/** Continuous seeded value noise; four octaves form an fBm field in CSS pixels.
 * Lattice randomness uses Print Lab's original mulberry32 PRNG. */
export function valueNoise(seed:number,cell:number){
 const cache=new Map<string,number>();
 const value=(x:number,y:number)=>{const key=`${x}:${y}`;let v=cache.get(key);if(v===undefined){v=rng(salt(seed,key))();cache.set(key,v);}return v;};
 return (x:number,y:number)=>{x/=cell;y/=cell;const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy),a=value(ix,iy),b=value(ix+1,iy),c=value(ix,iy+1),d=value(ix+1,iy+1);return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;};
}
export function fbm(seed:number,cell:number){const fields=Array.from({length:4},(_,i)=>valueNoise(salt(seed,String(i)),cell/2**i));return(x:number,y:number)=>fields.reduce((n,f,i)=>n+f(x,y)*2**-i,0)/1.875;}

export {lowNoise,spread,spotT,boxBlur} from '../vendor/print-lab-core.js';

// Versioned compatibility generators. Do not substitute algorithms: seeds are visual data.
export function legacyXorshift(seed:number){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
export function legacyRandom(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
export function legacyHash(x:number,y:number,seed:number){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export function legacyField(x:number,y:number,seed:number){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);return (legacyHash(ix,iy,seed)*(1-a)+legacyHash(ix+1,iy,seed)*a)*(1-b)+(legacyHash(ix,iy+1,seed)*(1-a)+legacyHash(ix+1,iy+1,seed)*a)*b;}
