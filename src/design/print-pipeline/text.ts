import {sheetInk,sheetRoller,type Sheet} from './sheet.ts';
import {valueNoise,salt} from './noise.ts';
export const textTextureVersion='sharp-type-v3';
export type TextRecipe={size:number;dotted:boolean;radius:number};
export function textTier(size:number){return size>=72?'display':size>=24?'heading':'body';}
/** Uniform hard dots, clipped by the glyph at the final mask stage. */
export function printText(mask:Float32Array,w:number,h:number,scale:number,seed:number,pitch:number,angle:number,recipe:TextRecipe,sheet?:Sheet){
 const tier=textTier(recipe.size),out=new Float32Array(w*h);
 if(!recipe.dotted||tier!=='display'){
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
