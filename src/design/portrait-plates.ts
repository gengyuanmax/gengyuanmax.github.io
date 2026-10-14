export type RGB=[number,number,number];
export type PlateRecipe={black:number;white:number;contrast:number;levels:number;gain:number;starvation:number;grain:number;seed:number};
export type PortraitPlates={width:number;height:number;alpha:Float32Array;tone:Float32Array;plates:[Float32Array,Float32Array]};
export function clamp(n:number){return Math.max(0,Math.min(1,n));}
export function smooth(n:number){const t=clamp(n);return t*t*(3-2*t);}
export function hexRGB(hex:string):RGB{return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)) as RGB;}
import {legacyHash as noise} from './print-pipeline/noise.ts';
export {noise};
export {preparePortrait} from './print-pipeline/sources.ts';
export function samplePlate(p:PortraitPlates,u:number,v:number){
 const x=Math.floor(u*p.width),y=Math.floor(v*p.height);
 if(x<0||y<0||x>=p.width||y>=p.height)return {alpha:0,ink:[0,0]};
 const i=y*p.width+x;return {alpha:p.alpha[i],ink:[p.plates[0][i],p.plates[1][i]]};
}
export function shadowWear(u:number,v:number,strength:number){
 const patch=(x:number,y:number,rx:number,ry:number)=>Math.exp(-(((u-x)/rx)**2+((v-y)/ry)**2));
 return 1-strength*Math.max(patch(.46,.57,.09,.095),patch(.55,.77,.12,.06));
}
