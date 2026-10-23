import {makeToneField,toneSettings} from './tone.ts';
import {screenOriginal} from './index.ts';
import {paintMaterial,type Press} from './material.ts';
import type {Settings} from '../settings.ts';
import type {RGB} from './types.ts';
import type {PlateInk} from './plates.ts';
export type FieldOriginal={ink:PlateInk;coverage:Float32Array;screened:boolean;ring:boolean;kind:'sphere'|'plane'|'source';index:number};
/** 'source': the original already is an ink-density plate (e.g. rendered by a design tool);
 * it is screened as given instead of receiving a constructed tone field. */
export function renderFieldOriginals(originals:FieldOriginal[],w:number,h:number,scale:number,origin:{x:number;y:number},press:Press,settings:Settings,inks:{a:RGB;b:RGB;c?:RGB;d?:RGB;paper:RGB},retainInks=false){
 // One plate per ink this element actually prints; accent inks (c, d) only when used.
 const used=(['a','b','c','d'] as const).filter(ink=>ink==='a'||ink==='b'||originals.some(o=>o.ink===ink));
 const plates=used.map(ink=>({ink,coverage:new Float32Array(w*h)})),tones:Float32Array[]=[],screens:Float32Array[]=[];
 for(const item of originals){
  const source=item.kind==='source';
  const tone=source?item.coverage:item.screened?makeToneField(item.coverage,w,h,scale,item.kind,toneSettings(settings,item.ring?1:settings.fieldCoverage/.42),press.seed+item.index*97):item.coverage;
  const mask=source?item.coverage.map(v=>v>.004?1:0):item.coverage;
  const printed=screenOriginal(`field:${item.ink}:${item.index}`,{kind:'shape',mask,tone},w,h,item.ink,press,scale,origin,!item.screened);
  tones.push(tone);screens.push(printed);const dest=plates.find(p=>p.ink===item.ink)!.coverage;for(let i=0;i<dest.length;i++)dest[i]=Math.max(dest[i],printed[i]);
 }
 // Retain transferred, registered ink coverage for cross-element sheet assembly.
 // Cross-element ink groups know the two type inks only; accent-ink elements keep their own output.
 const inkLayers=retainInks&&used.length===2?(['a','b'] as const).map(ink=>{
  const monochrome=paintMaterial(plates,w,h,{a:ink==='a'?[0,0,0]:[255,255,255],b:ink==='b'?[0,0,0]:[255,255,255],paper:[255,255,255]},press,scale);
  return {ink,coverage:Float32Array.from({length:w*h},(_,i)=>(255-monochrome[i*4])/255)};
 }):undefined;
 return {inkLayers,pixels:paintMaterial(plates,w,h,inks as Record<PlateInk,RGB>&{paper:RGB},press,scale),tones,screens};
}
