import {transferPlate} from './transfer.ts';
import {rasterOffsets} from './registration.ts';
import type {Press} from './material.ts';
import type {PrintPlate,RGB} from './types.ts';
/** Orchestrates sheet transfer, registration and RGB compositing without changing the recipe. */
export function renderSheet<Id extends string>(plates:PrintPlate<Id>[],w:number,h:number,inks:Record<Id,RGB>&{paper:RGB},p:Press<Id>,scale:number){
 return compositeRasterPlates(plates,w,h,inks,p,scale,transferPlate({kind:'raster',w,h,press:p,scale}));
}
/** Composite already screened coverage with supplied ink strength; no noise generation.
 * The sampler is evaluated at destination sheet coordinates, preserving the approved model. */
export function compositeRasterPlates<Id extends string>(plates:PrintPlate<Id>[],w:number,h:number,inks:Record<Id,RGB>&{paper:RGB},p:Pick<Press<Id>,'offset'|'registration'>,scale:number,transfer:(x:number,y:number)=>number){
 const out=new Uint8ClampedArray(w*h*4);
 // Plates shift relative to the reference only where an element prints more than one
 // of them; a single-plate element is its own reference (the approved look).
 const offsets=rasterOffsets(plates.map(v=>v.ink),p,scale);
 const shifts=plates.map((plate,i)=>({...offsets[i],k:inks[plate.ink],cov:plate.coverage,opaque:plate.opaque}));
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

/** Compatibility render orchestrator: screening is already complete; applies transfer and composite. */
export function renderMaterial<Id extends string>(plates:PrintPlate<Id>[],width:number,height:number,inks:Record<Id,RGB>&{paper:RGB},p:Press<Id>,scale=1){
 if(p.sheet)return renderSheet(plates,width,height,inks,p,scale);
 const data=new Uint8ClampedArray(width*height*4),strengthAt=transferPlate({kind:'legacy-raster',w:width,h:height,press:p,scale});
 const offsets=rasterOffsets(plates.filter(v=>v.coverage.some(x=>x>0)).map(v=>v.ink),p,scale,true),active=plates.filter(v=>v.coverage.some(x=>x>0));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,col=[...inks.paper];
  for(const [plateIndex,plate] of active.entries()){
   // The blue plate's offset lives in p.offset (the shared, overridable field); other plates use the plate list.
   const {dx,dy}=offsets[plateIndex];
   const xx=x-dx,yy=y-dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;
   const cover=plate.coverage[yy*width+xx];if(!cover)continue;
   const strength=strengthAt(x,y,plate.ink);
   const t=cover*strength,K=inks[plate.ink];
   for(let k=0;k<3;k++)col[k]=plate.opaque?col[k]+(K[k]-col[k])*t:col[k]*(1-t*(1-K[k]/255));
  }
  for(let k=0;k<3;k++)data[i*4+k]=col[k];data[i*4+3]=col.every(v=>v===255)?0:255;
 }
 return data;
}
