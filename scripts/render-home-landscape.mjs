import sharp from 'sharp';
import {homeLandscape as L} from '../src/config/home-landscape.ts';
import {resolve,getPalette} from '../src/design/settings.ts';
import {rgb} from '../src/design/element-composition.ts';
import {screenOriginal,paintMaterial,pressSettings,elementPress,onSheet} from '../src/design/print-pipeline/index.ts';

/** Prints the home "mountain and person" sheet in four inks (user, 2026-10-26).
 * The separation is made beforehand by design/photo/home_landscape_4c.py (existing image
 * tools) and committed as ink-density plates; this script only prints them with the
 * shared pipeline: the landscape plates on L.screen, the person's plates on L.figureScreen,
 * merged per ink by the composite. */
async function plateTones(W,H,prefix){
 const out={};
 for(const ink of ['a','b','c','d']){
  const {data,info}=await sharp(new URL(`../${L.plates}/${prefix}${ink}.png`,import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==W||info.height!==H)throw new Error(`Plate ${prefix}${ink} is ${info.width}×${info.height}, expected ${W}×${H}; re-run npm run design:landscape`);
  out[ink]=Float32Array.from({length:W*H},(_,i)=>data[i*4+3]/255);
 }
 return out;
}
export async function printHomeLandscape(config){
 const s=resolve(config,'home').values,p=getPalette(config,s.palette),seed=resolve(config).values.seed,k=L.scale;
 const W=L.width*k,H=L.height*k,mask=new Float32Array(W*H).fill(1);
 const press=onSheet(elementPress(pressSettings(s,L.screen,L.displaySize),'home-landscape','image'),seed,L.origin,1440);
 const figurePress={...press,pitch:pressSettings(s,L.figureScreen,L.displaySize).pitch,level:L.figureScreen};
 const plates=[];
 for(const [prefix,id,pr] of [['','home-landscape',press],['figure-','home-figure',figurePress]])
  for(const [ink,tone] of Object.entries(await plateTones(W,H,prefix)))
   plates.push({ink,coverage:screenOriginal(`${id}-${ink}`,{kind:'photo',mask,tone},W,H,ink,pr,k,L.origin)});
 const inks={a:rgb(p.secondary),b:rgb(p.primary),c:rgb(p.yellow),d:rgb(p.dark),paper:[255,255,255]};
 return {rgba:paintMaterial(plates,W,H,inks,press,k),W,H,press};
}
export async function renderHomeLandscape(config,{output=new URL('../public'+L.output,import.meta.url).pathname}={}){
 const {rgba,W,H,press}=await printHomeLandscape(config);
 await sharp(Buffer.from(rgba),{raw:{width:W,height:H,channels:4}}).removeAlpha().png({compressionLevel:9,palette:true,colors:160,dither:0}).toFile(output);
 console.log(`Rendered home landscape ${output} (${W}×${H}, four inks, ${press.pitch}px landscape / ${L.figureScreen} figure)`);
}
