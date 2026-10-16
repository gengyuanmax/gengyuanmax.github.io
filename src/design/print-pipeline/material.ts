import type {Wear} from './wear.ts';
import {screenSheet,type Sheet} from './sheet.ts';
import {screen,type ScreenLevel,type ScreenShape} from '../screen.ts';
import {spotT} from './noise.ts';
import type {Settings} from '../settings.ts';
import {toneSettings,type ToneSettings} from './tone.ts';
import {noiseBudget,within,withinSigned} from './budget.ts';
import {plateTables,type PlateInk} from './plates.ts';

/** Material parameters and AM screening. Ink physics belongs to transfer.ts;
 * compatibility paintMaterial delegates to the shared composite orchestrator. */
export const materialVersion='print-lab-e1c9d82-sheet-v3-no-spread';
export type Press<Id extends string=PlateInk> = {sourceWear?:Wear & {cropBoundary?:boolean};/** Runtime fast path (analytic dot edges, coarse-grid low-frequency transfer); see sheet.ts. */fast?:boolean;sheet?:Sheet;band?:number;level:ScreenLevel;shapes:Record<Id,ScreenShape>;pitch:number;angles:Record<Id,number>;registration?:Partial<Record<Id,{x:number;y:number}>>;gain:number;grain:number;starve:number;cluster:number;edge:number;holes:number;seed:number;offset:{x:number;y:number};patch?:number;role?:'title'|'field'|'image';tone?:ToneSettings};
export function pressSettings(s:Settings,level:ScreenLevel='medium',fontSize=128):Press{
 // Pitch comes from the screen tier; angle, shape and registration from the page's plate list.
 const pitch=screen(level,'a',s,fontSize).pitch,plates=plateTables(s);
 return {level,pitch,shapes:plates.shapes,angles:plates.angles,registration:plates.registration,gain:0,band:within(s.banding,noiseBudget.transfer.roller*2),grain:s.grain,starve:s.starvation,cluster:s.grainSize,edge:0,holes:within(s.pressGrain,noiseBudget.transfer.grainArea),seed:s.seed,offset:{x:withinSigned(s.registration,noiseBudget.registration.plate),y:withinSigned(s.registrationY,noiseBudget.registration.plate)},tone:toneSettings(s)};
}
/** Each element has a stable independent field, rather than restarting the same
 * noise tile. Ink plates then use independent samples from that field. */
export function elementPress<Id extends string>(p:Press<Id>,key:string,role:NonNullable<Press['role']>,fontSize=180):Press<Id>{
 let seed=p.seed;for(const c of key)seed=(Math.imul(seed,31)+c.charCodeAt(0))|0;
 return {...p,seed,role,patch:role==='title'?Math.max(4,fontSize/3):160,
  grain:within(p.grain,role==='title'?.08:noiseBudget.transfer.grainLoss),starve:within(p.starve,role==='title'?.08:noiseBudget.transfer.starvation)};
}
export {materialFields} from './transfer.ts';
export function screenPlate<Id extends string>(tone:Float32Array,width:number,height:number,ink:Id,p:Press<Id>,scale=1,origin={x:0,y:0},solid=false){
 if(p.sheet)return screenSheet(tone,width,height,ink,p,scale,origin,solid);
 const n=Math.max(width,height),mask=new Float32Array(n*n),a=p.angles[ink]*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const value=tone[y*width+x];if(!value)continue;
  // Screening owns only the AM lattice. Physical growth belongs to Transfer (off).
  const v=value;
  const xx=x/scale+origin.x,yy=y/scale+origin.y;
  mask[y*n+x]=solid?value:Number(v>spotT(p.shapes[ink],(xx*c+yy*s)/p.pitch,(-xx*s+yy*c)/p.pitch));
 }
 const out=new Float32Array(width*height);
 for(let y=0;y<height;y++)out.set(mask.subarray(y*n,y*n+width),y*width);
 return out;
}
export {renderMaterial as paintMaterial} from './raster-composite.ts';
