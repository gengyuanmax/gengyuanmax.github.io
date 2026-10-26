import {noiseBudget,withinSigned} from './budget.ts';
import type {ScreenShape} from '../screen.ts';

/** The page's plates: one entry per ink drum. Every element that prints on the page
 * takes its angle, dot shape and registration from here; nothing hard-codes "a/b".
 * Adding an ink means adding a row (and its palette colour), not touching renderers.
 *
 * Registration is relative to the reference plate (offset 0). A real sheet has one
 * offset per drum, so this is the only place a plate's offset is defined. Text keeps
 * its tighter CSS clamp (duotone-type.css) as an explicit legibility rule. */
export type PlateInk='a'|'b'|'c'|'d';
export type PagePlate={ink:PlateInk;palette:'secondary'|'primary'|'yellow'|'dark';label:string;angle:number;shape:ScreenShape;registration:{x:number;y:number}};
export type PlateSettings={secondaryAngle:number;primaryAngle:number;yellowAngle:number;darkAngle:number;secondaryDotShape:string;primaryDotShape:string;registration:number;registrationY:number;yellowX:number;yellowY:number;darkX:number;darkY:number};
export const referencePlate:PlateInk='a';
export function pagePlates(s:PlateSettings):readonly PagePlate[]{
 const offset=(x:number,y:number)=>({x:withinSigned(x,noiseBudget.registration.plate),y:withinSigned(y,noiseBudget.registration.plate)});
 const shape=(v:string)=>(v==='square'?'square':'round') as ScreenShape;
 return [
  {ink:'a',palette:'secondary',label:'vermilion',angle:s.secondaryAngle,shape:shape(s.secondaryDotShape),registration:{x:0,y:0}},
  {ink:'b',palette:'primary',label:'blue',angle:s.primaryAngle,shape:shape(s.primaryDotShape),registration:offset(s.registration,s.registrationY)},
  // Yellow shares the blue plate's dot shape until it has its own setting.
  {ink:'c',palette:'yellow',label:'yellow',angle:s.yellowAngle,shape:shape(s.primaryDotShape),registration:offset(s.yellowX,s.yellowY)},
  // Dark (near-black) accent plate for illustrations: shadows, steel. 45° keeps it clear of the other three.
  {ink:'d',palette:'dark',label:'dark',angle:s.darkAngle,shape:shape(s.primaryDotShape),registration:offset(s.darkX,s.darkY)},
 ];
}
/** Lookup tables in the shape the screening and transfer stages consume. The transfer
 * reads the blue plate's offset from Press.offset (kept equal to this table by pressSettings). */
export function plateTables(s:PlateSettings){
 const plates=pagePlates(s);
 return {
  angles:Object.fromEntries(plates.map(p=>[p.ink,p.angle])) as Record<PlateInk,number>,
  shapes:Object.fromEntries(plates.map(p=>[p.ink,p.shape])) as Record<PlateInk,ScreenShape>,
  registration:Object.fromEntries(plates.map(p=>[p.ink,p.registration])) as Record<PlateInk,{x:number;y:number}>,
 };
}
