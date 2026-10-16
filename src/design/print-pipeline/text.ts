import type {Sheet} from './sheet-context.ts';
import {transferPlate} from './transfer.ts';
export const textTextureVersion='print-type-v4';
/** Transfer of the same press that prints images and grounds (Press fields, title caps). */
export type TextTransfer={grain:number;starve:number;holes:number;band?:number};
export type TextRecipe={size:number;dotted:boolean;radius:number;transfer?:TextTransfer};
export function textTier(size:number){return size>=72?'display':size>=24?'heading':'body';}
/** Uniform hard dots, clipped by the glyph at the final mask stage. */
export function screenText(mask:Float32Array,w:number,h:number,scale:number,seed:number,pitch:number,angle:number,recipe:TextRecipe,sheet?:Sheet){
 const tier=textTier(recipe.size),out=new Float32Array(w*h);
 if(!recipe.dotted||tier!=='display')return out.fill(1);
 const r=pitch*Math.min(.38,recipe.radius),theta=angle*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta),extent=Math.hypot(w,h)/scale;
 const origin=sheet?.origin||{x:0,y:0},baseU=origin.x*c+origin.y*s,baseV=-origin.x*s+origin.y*c;
 for(let v=Math.floor((baseV-extent)/pitch)*pitch;v<=baseV+extent;v+=pitch)for(let u=Math.floor((baseU-extent)/pitch)*pitch;u<=baseU+extent;u+=pitch){
  const x=u*c-v*s-origin.x,y=u*s+v*c-origin.y;  for(let yy=Math.max(0,Math.floor((y-r)*scale));yy<Math.min(h,Math.ceil((y+r)*scale));yy++)for(let xx=Math.max(0,Math.floor((x-r)*scale));xx<Math.min(w,Math.ceil((x+r)*scale));xx++){
   const distance=Math.hypot((xx+.5)/scale-x,(yy+.5)/scale-y);
   out[yy*w+xx]=Math.max(out[yy*w+xx],distance<=r?mask[yy*w+xx]:0);
  }
 }return out;
}

/** Compatibility orchestrator: real screen geometry, then one shared transfer stage. */
export function printText(mask:Float32Array,w:number,h:number,scale:number,seed:number,pitch:number,angle:number,recipe:TextRecipe,sheet?:Sheet){
 const coverage=screenText(mask,w,h,scale,seed,pitch,angle,recipe,sheet);
 return transferPlate({kind:'text',coverage,w,h,scale,seed,recipe,sheet});
}
