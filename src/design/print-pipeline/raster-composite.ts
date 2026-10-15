import {prepareSheetTransfer} from './sheet.ts';
import {noiseBudget,withinSigned} from './budget.ts';
import type {Press} from './material.ts';
import type {PrintPlate,RGB} from './types.ts';
/** Orchestrates sheet transfer, registration and RGB compositing without changing the recipe. */
export function renderSheet<Id extends string>(plates:PrintPlate<Id>[],w:number,h:number,inks:Record<Id,RGB>&{paper:RGB},p:Press<Id>,scale:number){
 return compositeRasterPlates(plates,w,h,inks,p,scale,prepareSheetTransfer(w,h,p,scale));
}
/** Composite already screened coverage with supplied ink strength; no noise generation.
 * The sampler is evaluated at destination sheet coordinates, preserving the approved model. */
export function compositeRasterPlates<Id extends string>(plates:PrintPlate<Id>[],w:number,h:number,inks:Record<Id,RGB>&{paper:RGB},p:Pick<Press<Id>,'offset'|'registration'>,scale:number,transfer:(x:number,y:number)=>number){
 const out=new Uint8ClampedArray(w*h*4);
 // Plates shift relative to the reference only where an element prints more than one
 // of them; a single-plate element is its own reference (the approved look).
 const multi=new Set(plates.map(v=>v.ink)).size>1;
 const shifts=plates.map(plate=>{const reg=multi?(plate.ink==='b'?p.offset:p.registration?.[plate.ink]??{x:0,y:0}):{x:0,y:0};return {dx:Math.round(withinSigned(reg.x,noiseBudget.registration.plate)*scale),dy:Math.round(withinSigned(reg.y,noiseBudget.registration.plate)*scale),k:inks[plate.ink],cov:plate.coverage,opaque:plate.opaque};});
 const paper=inks.paper;
 for(let y=0;y<h;y++){
  for(let x=0;x<w;x++){
   const strength=transfer(x,y);
   let r=paper[0],g=paper[1],bl=paper[2];
   for(const sh of shifts){const sx=x-sh.dx,sy=y-sh.dy;if(sx<0||sy<0||sx>=w||sy>=h)continue;
    const t=sh.cov[sy*w+sx]*strength;if(!t)continue;const k=sh.k;
    if(sh.opaque){r+=(k[0]-r)*t;g+=(k[1]-g)*t;bl+=(k[2]-bl)*t;}else{r*=1-t*(1-k[0]/255);g*=1-t*(1-k[1]/255);bl*=1-t*(1-k[2]/255);}
   }
   const i=(y*w+x)*4;out[i]=r;out[i+1]=g;out[i+2]=bl;out[i+3]=r===255&&g===255&&bl===255?0:255;
  }
 }
 return out;
}
