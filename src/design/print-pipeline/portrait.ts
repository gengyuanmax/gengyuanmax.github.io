import {separateOriginal} from './sources.ts';
import {makeToneField} from './tone.ts';
import {compose} from './composition.ts';
import {screenOriginal} from './index.ts';
import {paintMaterial,type Press} from './material.ts';
import type {Operation} from '../element-composition.ts';
import type {RGB} from './types.ts';
export type PortraitOriginals={shape:Uint8Array|Uint8ClampedArray;photo:Uint8Array|Uint8ClampedArray;width:number;height:number;geometryScale:number;kind:'sphere'|'plane';operation:Operation;press:Press;scale:number;origin:{x:number;y:number}};
/** Both browser and build stop adapting sources here. Every later stage is shared. */
export function preparePortraitOriginals(input:PortraitOriginals){
 const {width,height,press,scale,origin}=input;
 if(input.shape.length!==width*height*4||input.photo.length!==width*height*4)throw new Error('Portrait originals must match the raster dimensions');
 const shape=separateOriginal(input.shape,'shape-alpha-v1'),photo=separateOriginal(input.photo,'photo-percentile-v1');
 const geometryTone=press.tone?makeToneField(shape.tones[0],width,height,scale,input.kind,press.tone,press.seed):shape.tones[0];
 const a={mask:shape.mask,print:screenOriginal('home-portrait:geometry',{kind:'shape',mask:shape.mask,tone:geometryTone},width,height,'a',press,scale,origin)};
 const b={mask:photo.mask,print:screenOriginal('home-portrait:photo',{kind:'photo',mask:photo.mask,tone:photo.tones[0]},width,height,'b',press,scale,origin)};
 return {width,height,a,b,geometryTone,plates:compose(a,b,width,height,input.geometryScale,input.operation),press,scale};
}
export function paintPortraitOriginals(prepared:ReturnType<typeof preparePortraitOriginals>,inks:{a:RGB;b:RGB;paper:RGB}){
 return paintMaterial(prepared.plates,prepared.width,prepared.height,inks,prepared.press,prepared.scale);
}
