import {spotT} from './noise.ts';
import type {Press} from './material.ts';
export {sheetFields,sheetInk,sheetRoller,onSheet,rollerDrum,type Sheet} from './sheet-context.ts';
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
  const t=tone[y*w+x];if(!t)continue;const v=t;
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
 return out;
}
export {prepareSheetTransfer} from './transfer.ts';

/** Compatibility name: this is the complete transfer + registration + composite render. */
export {renderSheet as paintSheet} from './raster-composite.ts';
