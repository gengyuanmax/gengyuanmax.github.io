import {sheetInk,sheetRoller,sheetFields,type Sheet} from './sheet.ts';
import {valueNoise,salt} from './noise.ts';
import {noiseBudget} from './budget.ts';
export const textTextureVersion='print-type-v4';
/** Transfer of the same press that prints images and grounds (Press fields, title caps). */
export type TextTransfer={grain:number;starve:number;holes:number;band?:number};
export type TextRecipe={size:number;dotted:boolean;radius:number;transfer?:TextTransfer};
export function textTier(size:number){return size>=72?'display':size>=24?'heading':'body';}
/** Uniform hard dots, clipped by the glyph at the final mask stage. */
export function printText(mask:Float32Array,w:number,h:number,scale:number,seed:number,pitch:number,angle:number,recipe:TextRecipe,sheet?:Sheet){
 const tier=textTier(recipe.size),out=new Float32Array(w*h);
 if(!recipe.dotted||tier!=='display'){
  // print-type-v4 (user, 2026-10-14): type is printed by the same press as the images, so
  // it carries the same transfer: low-frequency starvation, fine grain loss and roller
  // marks on the sheet. Outlines stay the DOM's own; no holes, erosion or blur.
  if(recipe.transfer&&sheet&&tier!=='body'){
   const t=recipe.transfer,b=noiseBudget.transfer,f=sheetFields(sheet.seed),cap=tier==='display'?noiseBudget.text.display:noiseBudget.text.heading;
   const fraction=Math.min(b.grainArea,Math.max(0,t.holes)),grain=Math.min(b.grainLoss,Math.max(0,t.grain)),starve=Math.min(b.starvation,Math.max(0,t.starve)),roller=Math.min(b.roller,Math.max(0,(t.band||0)*.5));
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const xx=x/scale+sheet.origin.x,yy=y/scale+sheet.origin.y,m=Math.max(0,Math.min(1,(sheetInk(sheet.seed,xx,yy)-.42)/.38)),fine=f.fine(xx,yy),g=fraction?Math.max(0,(fraction-fine)/fraction):0;
    out[y*w+x]=Math.max(1-cap,(1-grain*g)*(1-starve*m*m)*(1-roller*sheetRoller(sheet,yy)));}
   return out;
  }
  // sharp-type-v3 fallback without a press transfer (static/legacy callers): unchanged values.
  const loss=tier==='display'?.05:tier==='heading'?.04:0,noise=valueNoise(salt(seed,'type-ink'),32);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)out[y*w+x]=1-loss*(sheet?((1-(sheet.band||0))*sheetInk(sheet.seed,x/scale+sheet.origin.x,y/scale+sheet.origin.y)+(sheet.band||0)*sheetRoller(sheet,y/scale+sheet.origin.y)):noise(x/scale,y/scale));
  return out; // DOM alone supplies the sharp outline of solid letters.
 }
 const r=pitch*Math.min(.38,recipe.radius),theta=angle*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta),extent=Math.hypot(w,h)/scale;
 const origin=sheet?.origin||{x:0,y:0},baseU=origin.x*c+origin.y*s,baseV=-origin.x*s+origin.y*c;
 for(let v=Math.floor((baseV-extent)/pitch)*pitch;v<=baseV+extent;v+=pitch)for(let u=Math.floor((baseU-extent)/pitch)*pitch;u<=baseU+extent;u+=pitch){
  const x=u*c-v*s-origin.x,y=u*s+v*c-origin.y;  for(let yy=Math.max(0,Math.floor((y-r)*scale));yy<Math.min(h,Math.ceil((y+r)*scale));yy++)for(let xx=Math.max(0,Math.floor((x-r)*scale));xx<Math.min(w,Math.ceil((x+r)*scale));xx++){
   const distance=Math.hypot((xx+.5)/scale-x,(yy+.5)/scale-y);
   out[yy*w+xx]=Math.max(out[yy*w+xx],distance<=r?mask[yy*w+xx]:0);
  }
 }return out;
}
