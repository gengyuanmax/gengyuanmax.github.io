import {makeToneField,toneSettings} from './tone.ts';
import {screenOriginal} from './index.ts';
import {paintMaterial,type Press} from './material.ts';
import type {Settings} from '../settings.ts';
import type {RGB} from './types.ts';
export type FieldOriginal={ink:'a'|'b';coverage:Float32Array;screened:boolean;ring:boolean;kind:'sphere'|'plane'|'source';index:number};
/** 'source': the original already is an ink-density plate (e.g. rendered by a design tool);
 * it is screened as given instead of receiving a constructed tone field. */
export function renderFieldOriginals(originals:FieldOriginal[],w:number,h:number,scale:number,origin:{x:number;y:number},press:Press,settings:Settings,inks:{a:RGB;b:RGB;paper:RGB},retainInks=false){
 const plates=(['a','b'] as const).map(ink=>({ink,coverage:new Float32Array(w*h)})),tones:Float32Array[]=[],screens:Float32Array[]=[];
 for(const item of originals){
  const source=item.kind==='source';
  const tone=source?item.coverage:item.screened?makeToneField(item.coverage,w,h,scale,item.kind,toneSettings(settings,item.ring?1:settings.fieldCoverage/.42),press.seed+item.index*97):item.coverage;
  const mask=source?item.coverage.map(v=>v>.004?1:0):item.coverage;
  const printed=screenOriginal(`field:${item.ink}:${item.index}`,{kind:'shape',mask,tone},w,h,item.ink,press,scale,origin,!item.screened);
  tones.push(tone);screens.push(printed);const dest=plates[item.ink==='a'?0:1].coverage;for(let i=0;i<dest.length;i++)dest[i]=Math.max(dest[i],printed[i]);
 }
 // Retain transferred, registered ink coverage for cross-element sheet assembly.
 const inkLayers=retainInks?(['a','b'] as const).map(ink=>{
  const monochrome=paintMaterial(plates,w,h,{a:ink==='a'?[0,0,0]:[255,255,255],b:ink==='b'?[0,0,0]:[255,255,255],paper:[255,255,255]},press,scale);
  return {ink,coverage:Float32Array.from({length:w*h},(_,i)=>(255-monochrome[i*4])/255)};
 }):undefined;
 return {inkLayers,pixels:paintMaterial(plates,w,h,inks,press,scale),tones,screens};
}
