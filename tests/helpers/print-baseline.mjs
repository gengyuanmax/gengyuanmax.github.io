import {createHash} from 'node:crypto';
import {defaults} from '../../src/design/settings.ts';
import {pressSettings,elementPress,screenPlate,paintMaterial} from '../../src/design/press-material.ts';
import {makeToneField,toneSettings} from '../../src/design/tone-field.ts';
import {darkness,compose} from '../../src/design/element-composition.ts';
import {researchRecipe,paperPixels,plateVector} from '../../src/design/research-render.ts';
import {staticResearchPreview} from '../../src/design/research-static.mjs';
export async function printBaseline(){
 const hash=v=>createHash('sha256').update(typeof v==='string'?v:ArrayBuffer.isView(v)?Buffer.from(v.buffer,v.byteOffset,v.byteLength):JSON.stringify(v)).digest('hex');
 const result={};const colors={a:[207,80,55],b:[40,62,181],paper:[255,255,255]};
 for(const scale of [1,2])for(const role of ['title','field','image']){
  const width=64*scale,height=48*scale,p=elementPress(pressSettings({...defaults,seed:5},role==='title'?'coarse':role==='field'?'fine':'medium',96),`baseline-${role}`,role,96);
  const rgba=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;rgba.set([x*255/width,y*255/height,85,(x>4*scale&&y>3*scale)?255:0],i);}
  const a=darkness(rgba,false),b=darkness(rgba,true),tone=makeToneField(a.mask,width,height,scale,'sphere',toneSettings(defaults),p.seed);
  const A=screenPlate(tone,width,height,'a',p,scale,{x:3.25,y:8}),B=screenPlate(b.tone,width,height,'b',p,scale,{x:3.25,y:8});
  result[`${role}-${scale}`]=hash(paintMaterial(compose({mask:a.mask,print:A},{mask:b.mask,print:B},width,height,scale,'over'),width,height,colors,p,scale));
  result[`${role}-${scale}-tone`]=hash(tone);result[`${role}-${scale}-screen`]=hash(B);
 }
 const settings={...defaults,researchSeed:20261014},config={version:1,global:{},areas:{},elements:{}};
 for(const width of [160,640]){
  const r=researchRecipe(settings,config,width);
  for(const id of ['benchmarking','domain','machines'])for(const state of ['normal','active','quiet'])result[`research-${width}-${id}-${state}`]=hash(r.stateDots(id,state));
  result[`research-${width}-paper`]=hash(paperPixels(r).rgba);
  result[`research-${width}-affine`]=hash(r.transforms);
  result[`research-${width}-svg`]=hash(plateVector(r,'machines'));
  result[`research-${width}-png`]=hash(await staticResearchPreview(r));
 }
 return result;
}
