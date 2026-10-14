import {rng,salt} from './noise.ts';
import type {Transform} from './types.ts';
export function registeredPlates<P extends Record<string,Transform>>(plates:P,seed:number,reference:keyof P){
 return Object.fromEntries((Object.entries(plates) as [string,Transform][]).map(([id,p])=>{const random=rng(salt(seed,`registration:${id}`)),j=()=>random()*2-1;return[id,id===reference?{x:0,y:0,rotation:0,scale:1}:{x:p.x+j()*.1,y:p.y+j()*.1,rotation:p.rotation+j()*.02,scale:p.scale+j()*.0002}];})) as Record<keyof P,Transform>;
}
