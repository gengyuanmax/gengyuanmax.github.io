import {compositeRasterPlates} from './raster-composite.ts';
import type {RGB} from './types.ts';
export type InkFragment={ink:'a'|'b';coverage:Float32Array;width:number;height:number;x:number;y:number;drawWidth:number;drawHeight:number};
/** Post-transfer sheet assembly: matching ink is a coverage union, never another
 * multiply pass. Different inks are composited only after that union. */
export function composeInkGroup(fragments:InkFragment[],width:number,height:number,inks:{a:RGB;b:RGB;paper:RGB}){
 const plates=(['a','b'] as const).map(ink=>({ink,coverage:unionInkCoverage(fragments.filter(f=>f.ink===ink),width,height)}));
 return compositeRasterPlates(plates,width,height,inks,{offset:{x:0,y:0}},1,()=>1);
}
/** Shared single-ink union for text, pictures, borders and guide strokes. */
export function unionInkCoverage(fragments:Omit<InkFragment,'ink'>[],width:number,height:number){
 const dst=new Float32Array(width*height);
 for(const f of fragments){
  for(let y=Math.max(0,Math.floor(f.y));y<Math.min(height,Math.ceil(f.y+f.drawHeight));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(width,Math.ceil(f.x+f.drawWidth));x++){
   const sx=(x+.5-f.x)*f.width/f.drawWidth-.5,sy=(y+.5-f.y)*f.height/f.drawHeight-.5;
   const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
   const at=(a:number,b:number)=>a<0||b<0||a>=f.width||b>=f.height?0:f.coverage[b*f.width+a];
   const v=(at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy;
   dst[y*width+x]=Math.max(dst[y*width+x],v);
  }
 }
 return dst;
}
