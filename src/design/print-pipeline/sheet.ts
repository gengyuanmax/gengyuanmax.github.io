import {valueNoise,salt,rng} from './noise.ts';
import {spotT} from './noise.ts';
import {noiseBudget,within,withinSigned} from './budget.ts';
import type {Press} from './material.ts';
import type {PrintPlate,RGB} from './types.ts';
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
const subsamples=4;
export function screenSheet<Id extends string>(tone:Float32Array,w:number,h:number,ink:Id,p:Press<Id>,scale:number,origin:{x:number;y:number},solid:boolean){
 const out=new Float32Array(w*h),angle=p.angles[ink]*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 const shape=p.shapes[ink],fine=!solid&&p.pitch*scale<minBinaryCell,step=1/(subsamples*scale);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const t=tone[y*w+x];if(!t)continue;const v=Math.min(1,t+within(p.gain,noiseBudget.dotGain)*.32*4*t*(1-t));
  if(solid){out[y*w+x]=t;continue;}
  if(!fine){const xx=x/scale+origin.x,yy=y/scale+origin.y;out[y*w+x]=Number(v>spotT(shape,(xx*c+yy*s)/p.pitch,(-xx*s+yy*c)/p.pitch));continue;}
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
export function paintSheet<Id extends string>(plates:PrintPlate<Id>[],w:number,h:number,inks:Record<Id,RGB>&{paper:RGB},p:Press<Id>,scale:number){
 const {seed,origin}=p.sheet!,f=sheetFields(seed),out=new Uint8ClampedArray(w*h*4),budget=noiseBudget.transfer;
 // Plates shift relative to the reference only where an element prints more than one
 // of them; a single-plate element is its own reference (the approved look).
 const multi=new Set(plates.map(v=>v.ink)).size>1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const xx=x/scale+origin.x,yy=y/scale+origin.y,low=sheetInk(seed,xx,yy),m=Math.max(0,Math.min(1,(low-.42)/.38));
  // Absolute threshold, not a per-element histogram: cropping cannot change ink.
  const fraction=within(p.holes,budget.grainArea),fine=f.fine(xx,yy),grain=fraction?Math.max(0,(fraction-fine)/fraction):0;
  const strength=.96*(1-within(p.grain,budget.grainLoss)*grain)*(1-within(p.starve,budget.starvation)*m*m)*(1-within((p.band||0)*.5,budget.roller)*sheetRoller(p.sheet!,yy)),col=[...inks.paper];
  for(const plate of plates){const reg=multi?(plate.ink==='b'?p.offset:p.registration?.[plate.ink]??{x:0,y:0}):{x:0,y:0},sx=x-Math.round(withinSigned(reg.x,noiseBudget.registration.plate)*scale),sy=y-Math.round(withinSigned(reg.y,noiseBudget.registration.plate)*scale);if(sx<0||sy<0||sx>=w||sy>=h)continue;
   const t=plate.coverage[sy*w+sx]*strength,k=inks[plate.ink];for(let channel=0;channel<3;channel++)col[channel]=plate.opaque?col[channel]+(k[channel]-col[channel])*t:col[channel]*(1-t*(1-k[channel]/255));
  }
  const i=(y*w+x)*4;out[i]=col[0];out[i+1]=col[1];out[i+2]=col[2];out[i+3]=col.every(v=>v===255)?0:255;
 }return out;
}
