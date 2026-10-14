import {makeToneField,toneSettings} from './tone.ts';
import {screenOriginal} from './index.ts';
import {paintMaterial,type Press} from './material.ts';
import type {Settings} from '../settings.ts';
import type {RGB} from './types.ts';
export type FieldOriginal={ink:'a'|'b';coverage:Float32Array;screened:boolean;ring:boolean;kind:'sphere'|'plane';index:number};
export function renderFieldOriginals(originals:FieldOriginal[],w:number,h:number,scale:number,origin:{x:number;y:number},press:Press,settings:Settings,inks:{a:RGB;b:RGB;paper:RGB}){
 const plates=(['a','b'] as const).map(ink=>({ink,coverage:new Float32Array(w*h)})),tones:Float32Array[]=[],screens:Float32Array[]=[];
 for(const item of originals){
  const tone=item.screened?makeToneField(item.coverage,w,h,scale,item.kind,toneSettings(settings,item.ring?1:settings.fieldCoverage/.42),press.seed+item.index*97):item.coverage;
  const printed=screenOriginal(`field:${item.ink}:${item.index}`,{kind:'shape',mask:item.coverage,tone},w,h,item.ink,press,scale,origin,!item.screened);
  tones.push(tone);screens.push(printed);const dest=plates[item.ink==='a'?0:1].coverage;for(let i=0;i<dest.length;i++)dest[i]=Math.max(dest[i],printed[i]);
 }
 return {pixels:paintMaterial(plates,w,h,inks,press,scale),tones,screens};
}
