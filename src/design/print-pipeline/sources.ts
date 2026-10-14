import type {Settings} from '../settings.ts';
import type {Pixels} from '../print.ts';
import type {PlateRecipe,PortraitPlates} from '../portrait-plates.ts';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function darkness(data:Uint8ClampedArray,photo:boolean){
 const n=data.length/4,mask=new Float32Array(n),tone=new Float32Array(n);
 let lo=0,hi=1;
 if(photo){
  const values:number[]=[];
  for(let i=0;i<n;i+=3)if(data[i*4+3]>128)values.push((.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2])/255);
  values.sort((a,b)=>a-b);
  if(values.length>20){lo=values[Math.floor(values.length*portraitSeparation.blackPercentile)];hi=values[Math.floor(values.length*portraitSeparation.whitePercentile)];}
 }
 for(let i=0;i<n;i++){
  const a=data[i*4+3]/255;mask[i]=a;if(!a)continue;
  let light=(.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2])/255;
  if(photo)light=Math.pow(Math.max(0,Math.min(1,(light-lo)/Math.max(.05,hi-lo))),portraitSeparation.gammaPower);
  tone[i]=a*(1-light);
 }
 return{mask,tone};
}

export function separateLegacyPlates(p:Pixels,s:Settings){
 const a=new Float32Array(p.width*p.height),b=s.inkMode==='one'?null:new Float32Array(a.length);
 const f=(v:number)=>{v=clamp((v-.5)*s.contrast+.5);return clamp(v+s.dotGain*.32*4*v*(1-v));};
 for(let i=0;i<a.length;i++){
  const r=p.data[i*4]/255,g=p.data[i*4+1]/255,bl=p.data[i*4+2]/255;
  const d=1-(.299*r+.587*g+.114*bl);
  if(!b)a[i]=f(d);
  else if(s.inkMode==='separated'){const cyan=1-r;a[i]=f(cyan);b[i]=f(Math.max(0,1-g-cyan*.6));}
  else {const v=f(d);a[i]=v**1.9;b[i]=v**.75;}
 }
 return b?[a,b]:[a];
}

export function preparePortrait(p:Pixels,s:PlateRecipe):PortraitPlates{
 const n=p.width*p.height,tone=new Float32Array(n),alpha=new Float32Array(n),a=new Float32Array(n),b=new Float32Array(n);
 for(let i=0;i<n;i++){
  alpha[i]=p.data[i*4+3]>=128?1:0;
  const lum=(.299*p.data[i*4]+.587*p.data[i*4+1]+.114*p.data[i*4+2])/255;
  const normalized=clamp((lum-s.black)/(s.white-s.black));
  const l=Math.round(clamp((normalized-.5)*s.contrast+.5)*(s.levels-1))/(s.levels-1);tone[i]=l;
  // A carries highlights/midtones below 70%; B only the darkest 35%.
  a[i]=l<.7?(.24+.58*(.7-l)/.7)*alpha[i]:0;
  b[i]=l<.35?(.94*((.35-l)/.35)**.7)*alpha[i]:0;
 }
 return {width:p.width,height:p.height,alpha,tone,plates:[a,b]};
}

export type SeparationMode='mono'|'sep'|'duo'|'tri';
export type SeparationRecipe={mode:SeparationMode;black?:number;white?:number;gamma?:number;posterize?:number;contrast?:number;gain?:number};
/** Print Lab e1c9d82 plates(): exact channel order and tone/gain formula.
 * RGB originals use a separate alpha mask; alpha is applied exactly once here. */
export function separatePrintLab(data:Uint8Array|Uint8ClampedArray,recipe:SeparationRecipe){
 if(data.length%4)throw new Error('Invalid RGBA original');
 const {mode,black=0,white=1,gamma=1,posterize=0,contrast=1,gain=0}=recipe;
 if(!['mono','sep','duo','tri'].includes(mode)||gamma<=0)throw new Error('Invalid separation recipe');
 const n=data.length/4,mask=new Float32Array(n),tones=Array.from({length:mode==='mono'?1:mode==='tri'?3:2},()=>new Float32Array(n));
 const span=Math.max(.02,white-black),tc=(c:number)=>{let v=Math.pow(clamp((c-black)/span),1/gamma);if(posterize>1)v=Math.round(v*(posterize-1))/(posterize-1);return v;};
 const f=(v:number)=>{v=clamp((v-.5)*contrast+.5);return Math.min(1,v+gain*.32*4*v*(1-v));};
 for(let i=0;i<n;i++){
  const a=data[i*4+3]/255;mask[i]=a;const r=tc(data[i*4]/255),g=tc(data[i*4+1]/255),b=tc(data[i*4+2]/255),d=1-(.299*r+.587*g+.114*b);
  let values:number[];
  if(mode==='mono')values=[f(d)];else if(mode==='sep'){const cy=1-r;values=[f(Math.max(0,1-g-cy*.6)),f(cy)];}
  else if(mode==='tri')values=[f(1-g),f(1-r),f((1-b)*.85)];else{const v=f(d);values=[v**.75,v**1.9];}
  values.forEach((v,k)=>tones[k][i]=a*v);
 }
 return {mask,tones};
}
/** The selected photo recipe is intentionally preserved, not replaced by channel sep. */
export const portraitSeparation={profile:'photo-percentile-v1',blackPercentile:.02,whitePercentile:.98,gammaPower:1.1} as const;
export function separateOriginal(data:Uint8Array|Uint8ClampedArray,profile:'photo-percentile-v1'|'shape-alpha-v1'|SeparationRecipe){
 if(typeof profile==='object')return separatePrintLab(data,profile);
 const field=darkness(data instanceof Uint8ClampedArray?data:new Uint8ClampedArray(data),profile==='photo-percentile-v1');return {mask:field.mask,tones:[field.tone]};
}
