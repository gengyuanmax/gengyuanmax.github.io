import {screenOriginal,pressSettings,paintMaterial,onSheet,elementPress} from './print-pipeline/index.ts';
import {encodeAlphaPNG} from './print-pipeline/png.ts';
import {phraseMisregistration} from './print-pipeline/registration.ts';
import {emphasisMaterial} from './emphasis.ts';
import {getPalette,type Settings,type DesignConfig} from './settings.ts';
/** Printed emphasis band (user, 2026-10-21): the dots are printed through the shared
 * pipeline, not drawn by CSS — fine-tier AM screen on the vermilion plate, the shared
 * transfer (starvation, grain, roller) and worn top/bottom edges. Three bands from three
 * places on the sheet so neighbouring phrases differ. Each is an alpha mask, tiled
 * horizontally under the phrase; the ink colour is the vermilion tint. */
export const emphasisBandWidth=240,emphasisBandHeight=12,emphasisBandScale=3;
export function emphasisBands(s:Settings,config:DesignConfig){
 const p=getPalette(config,s.palette),m=emphasisMaterial(p,s.emphasisPitch,s.emphasisCoverage);
 const w=emphasisBandWidth*emphasisBandScale,h=emphasisBandHeight*emphasisBandScale;
 return [0,1,2].map(k=>{
  // Unprinted first and last rows: wear frays the long edges only, so tiles join.
  const mask=Float32Array.from({length:w*h},(_,i)=>{const y=Math.floor(i/w);return y===0||y===h-1?0:1;});
  const tone=mask.map(v=>v*m.coverage);
  const origin={x:137*k+31,y:89*k+17};
  const press={...elementPress(pressSettings(s,'fine'),`emphasis-${k}`,'field'),offset:{x:0,y:0},registration:{},
   sourceWear:{depth:.9,speckle:.45}};
  const sheeted=onSheet(press,s.seed,origin,1440);
  const plate=screenOriginal(`emphasis-band-${k}`,{kind:'shape',mask,tone},w,h,'a',sheeted,emphasisBandScale,origin);
  const printed=paintMaterial([{ink:'a',coverage:plate}],w,h,{a:[0,0,0],paper:[255,255,255]},sheeted,emphasisBandScale);
  const alpha=Uint8Array.from({length:w*h},(_,i)=>255-printed[i*4]);
  return `url("data:image/png;base64,${btoa(Array.from(encodeAlphaPNG(alpha,w,h),c=>String.fromCharCode(c)).join(''))}")`;
 });
}
/** Misregistration for one phrase: a small tilt and offset, fixed by its text. */
export function emphasisMisprint(text:string){
 const m=phraseMisregistration(text);
 return `--em-band:var(--em-band-${m.variant});--em-tilt:${m.tilt.toFixed(2)}deg;--em-dx:${m.x.toFixed(2)}px;--em-dy:${m.y.toFixed(2)}px;--em-shift:${m.shift}px`;
}
