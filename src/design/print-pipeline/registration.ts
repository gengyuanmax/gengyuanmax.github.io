import {noiseBudget,withinSigned} from './budget.ts';
import type {Press} from './material.ts';
import {rng,salt} from './noise.ts';
import type {Transform} from './types.ts';
export function registeredPlates<P extends Record<string,Transform>>(plates:P,seed:number,reference:keyof P){
 return Object.fromEntries((Object.entries(plates) as [string,Transform][]).map(([id,p])=>{const random=rng(salt(seed,`registration:${id}`)),j=()=>random()*2-1;return[id,id===reference?{x:0,y:0,rotation:0,scale:1}:{x:p.x+j()*.1,y:p.y+j()*.1,rotation:p.rotation+j()*.02,scale:p.scale+j()*.0002}];})) as Record<keyof P,Transform>;
}

/** Output backends share one affine frame; only serialization differs. */
export function registrationFrame(t:Transform,width:number,height:number){
 const cx=width/2,cy=height/2;return {cx,cy,x:cx+t.x,y:cy+t.y,rotation:t.rotation,scale:t.scale};
}
/** Same policy with the explicit historical raster convention retained as a recipe. */
export function rasterOffsets<Id extends string>(ids:Id[],p:Pick<Press<Id>,'offset'|'registration'>,scale:number,legacy=false){
 const multi=new Set(ids).size>1,twoInks=ids.includes('a' as Id)&&ids.includes('b' as Id);
 return ids.map(ink=>{
  if(legacy){const reg=ink==='b'?undefined:p.registration?.[ink];return {dx:reg?Math.round(reg.x*scale):twoInks&&ink==='b'?Math.round(p.offset.x*scale):0,dy:reg?Math.round(reg.y*scale):twoInks&&ink==='b'?Math.round(p.offset.y*scale):0};}
  const reg=multi?(ink==='b'?p.offset:p.registration?.[ink]??{x:0,y:0}):{x:0,y:0};
  return {dx:Math.round(withinSigned(reg.x,noiseBudget.registration.plate)*scale),dy:Math.round(withinSigned(reg.y,noiseBudget.registration.plate)*scale)};
 });
}
