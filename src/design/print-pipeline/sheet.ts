import {valueNoise,salt,rng} from './noise.ts';
import {spotT} from './noise.ts';
import {noiseBudget,within} from './budget.ts';
import type {Press} from './material.ts';
export type Sheet={seed:number;origin:{x:number;y:number};height?:number;band?:number};
/** Infinite paper coordinates: independent of crop bounds, DPR, role or element id. */
const fields=new Map<number,ReturnType<typeof createFields>>();
function createFields(seed:number){const random=rng(salt(seed,'sheet-roller')),rows=Float32Array.from({length:21},()=>random());return {rows,fine:valueNoise(salt(seed,'paper-fine'),1),low:valueNoise(salt(seed,'sheet-ink'),80),detail:valueNoise(salt(seed,'sheet-detail'),32),edge:valueNoise(salt(seed,'sheet-edge'),1.5)};}
export function sheetFields(seed:number){let f=fields.get(seed);if(!f){f=createFields(seed);if(fields.size>=4)fields.clear();fields.set(seed,f);}return f;}
export function sheetInk(seed:number,x:number,y:number){const f=sheetFields(seed);return f.low(x,y)*.65+f.detail(x,y)*.35;}
export function onSheet<Id extends string>(press:Press<Id>,seed:number,origin:{x:number;y:number},height=1440):Press<Id>{return {...press,sheet:{seed,origin,height,band:press.band}};}
/** Roller marks are a property of the press, not of the page: one drum of 20 smoothstep
 * intervals spans 1440 CSS px (the design canvas) and then runs back, so every page,
 * at every width and length, carries roller bands of the same size at the same sheet Y.
 * Within 0–1440 the field is the native one; past it, it mirrors (seamless, no clamp). */
export const rollerDrum=1440;
export function sheetRoller(sheet:Sheet,y:number){
 const rows=sheetFields(sheet.seed).rows,turn=((y/rollerDrum)%2+2)%2,position=(turn>1?2-turn:turn)*20,i=Math.min(19,Math.floor(position)),t=position-i,u=t*t*(3-2*t);
 return Math.max(0,Math.min(1,((rows[i]+(rows[i+1]-rows[i])*u)-.5)*2.4+.5));
}
/** Rectangular counterpart of native spread; binary expansion, no convolution. */
export function spreadRectangle(mask:Float32Array,w:number,h:number,r:number,field:(x:number,y:number)=>number,amount:number){
 const horizontal=new Uint8Array(w*h),vertical=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=-r;k<=r;k++){if(x+k>=0&&x+k<w&&mask[y*w+x+k]){horizontal[y*w+x]=1;break;}}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=-r;k<=r;k++){if(y+k>=0&&y+k<h&&horizontal[(y+k)*w+x]){vertical[y*w+x]=1;break;}}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!mask[y*w+x]&&vertical[y*w+x]&&field(x,y)<amount)mask[y*w+x]=1;
}
/** Below this many device pixels per screen cell, a single binary sample per pixel
 * cannot represent the gaps between dots: they alias into flickering 1px holes. */
export const minBinaryCell=6;
/** The fine tier (2 CSS px) always resolves by area coverage, whatever the device pixel
 * ratio: at DPR 3 its 6px cells would otherwise switch to binary dots plus random spread
 * and read as glitter on phones while desktops show an even screen. Same CSS screen,
 * same look on every device. */
export const minBinaryPitch=3;
export const binaryCell=(pitch:number,scale:number)=>pitch*scale>=minBinaryCell&&pitch>=minBinaryPitch;
const subsamples=4;
export function screenSheet<Id extends string>(tone:Float32Array,w:number,h:number,ink:Id,p:Press<Id>,scale:number,origin:{x:number;y:number},solid:boolean){
 const out=new Float32Array(w*h),angle=p.angles[ink]*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const shape=p.shapes[ink],fine=!solid&&!binaryCell(p.pitch,scale),step=1/(subsamples*scale);
 // Fast path (runtime only): the same 4×4 point samples, but the cosine dot field is
 // stepped by rotation (angle addition) instead of two cos() calls per sample. Results
 // equal the exact path up to floating-point rounding.
 const name=shape as string,rotate=fine&&!!p.fast&&(name==='round'||name==='ellipse'),TAU=Math.PI*2,ew=name==='ellipse'?.55:1;
 const rot=(d:number)=>[Math.cos(TAU*d),Math.sin(TAU*d)] as const;
 const [cux,sux]=rot(step*c/p.pitch),[cqx,sqx]=rot(-step*s/p.pitch),[cuy,suy]=rot(step*s/p.pitch),[cqy,sqy]=rot(step*c/p.pitch);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const t=tone[y*w+x];if(!t)continue;const v=Math.min(1,t+within(p.gain,noiseBudget.dotGain)*.32*4*t*(1-t));
  if(solid){out[y*w+x]=t;continue;}
  if(!fine){const xx=x/scale+origin.x,yy=y/scale+origin.y;out[y*w+x]=Number(v>spotT(shape,(xx*c+yy*s)/p.pitch,(-xx*s+yy*c)/p.pitch));continue;}
  if(rotate){
   const x0=x/scale+origin.x+step/2,y0=y/scale+origin.y+step/2,u0=(x0*c+y0*s)/p.pitch,q0=(-x0*s+y0*c)/p.pitch;
   let ru=Math.cos(TAU*u0),rsu=Math.sin(TAU*u0),rq=Math.cos(TAU*q0),rsq=Math.sin(TAU*q0),inked=0;
   for(let sy=0;sy<subsamples;sy++){
    let cu=ru,su=rsu,cq=rq,sq=rsq;
    for(let sx=0;sx<subsamples;sx++){
     const value=ew===1?1-(cu+cq+2)/4:1-(cu+ew*cq+1.55)/3.1;if(v>value)inked++;
     const nu=cu*cux-su*sux;su=su*cux+cu*sux;cu=nu;const nq=cq*cqx-sq*sqx;sq=sq*cqx+cq*sqx;cq=nq;
    }
    const nu=ru*cuy-rsu*suy;rsu=rsu*cuy+ru*suy;ru=nu;const nq=rq*cqy-rsq*sqy;rsq=rsq*cqy+rq*sqy;rq=nq;
   }
   out[y*w+x]=inked/(subsamples*subsamples);continue;
  }
  // Area coverage of the same AM lattice: hard dot geometry, resolved below the pixel.
  let inked=0;const x0=x/scale+origin.x+step/2,y0=y/scale+origin.y+step/2;
  for(let sy=0;sy<subsamples;sy++)for(let sx=0;sx<subsamples;sx++){const xx=x0+sx*step,yy=y0+sy*step;if(v>spotT(shape,(xx*c+yy*s)/p.pitch,(-xx*s+yy*c)/p.pitch))inked++;}
  out[y*w+x]=inked/(subsamples*subsamples);
 }
 // Native random spread only where a cell spans enough device pixels to stay a dot.
 // For sub-minBinaryCell cells it would close gaps at random and read as glitch.
 if(!solid&&!fine&&p.edge>0&&scale>=2){const f=sheetFields(p.sheet!.seed);spreadRectangle(out,w,h,1,(x,y)=>f.edge(x/scale+origin.x,y/scale+origin.y),.3+.6*within(p.gain,noiseBudget.dotGain));}
 return out;
}
/** Prepare ink-transfer strength in sheet coordinates. No plate geometry, color or blending.
 * Keep the Float32 low-frequency grid and arithmetic order for pixel-identical output. */
export function prepareSheetTransfer<Id extends string>(w:number,h:number,p:Press<Id>,scale:number){
 const {seed,origin}=p.sheet!,f=sheetFields(seed),budget=noiseBudget.transfer;
 const fraction=within(p.holes,budget.grainArea),grainLoss=within(p.grain,budget.grainLoss),starve=within(p.starve,budget.starvation),roller=within((p.band||0)*.5,budget.roller);
 // Low-frequency transfer (starvation and roller, features ≥32 CSS px). The exact path
 // samples it per pixel; the fast path samples a 2 CSS px grid and interpolates.
 const G=p.fast?Math.max(1,Math.round(2*scale)):1,gw=Math.ceil(w/G)+2,gh=Math.ceil(h/G)+2,slow=new Float32Array(gw*gh);
 for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const xx=gx*G/scale+origin.x,yy=gy*G/scale+origin.y,m=Math.max(0,Math.min(1,(sheetInk(seed,xx,yy)-.42)/.38));slow[gy*gw+gx]=(1-starve*m*m)*(1-roller*sheetRoller(p.sheet!,yy));}
 return (x:number,y:number)=>{
  const fy=y/G,iy=Math.floor(fy),ty=fy-iy;
   const xx=x/scale+origin.x,yy=y/scale+origin.y;
   let lowStrength:number;
   if(G===1)lowStrength=slow[y*gw+x];
   else{const fx=x/G,ix=Math.floor(fx),tx=fx-ix,a=slow[iy*gw+ix],b=slow[iy*gw+ix+1],c2=slow[(iy+1)*gw+ix],d=slow[(iy+1)*gw+ix+1];lowStrength=(a+(b-a)*tx)*(1-ty)+(c2+(d-c2)*tx)*ty;}
   // Absolute threshold, not a per-element histogram: cropping cannot change ink.
   const grain=fraction?Math.max(0,(fraction-f.fine(xx,yy))/fraction):0;
   return .96*(1-grainLoss*grain)*lowStrength;
 };
}


/** Compatibility name: this is the complete transfer + registration + composite render. */
export {renderSheet as paintSheet} from './raster-composite.ts';
