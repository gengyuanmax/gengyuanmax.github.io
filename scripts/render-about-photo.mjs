import sharp from 'sharp';
import {aboutPhoto as photo} from '../src/config/about-photo.ts';
import {resolve,getPalette} from '../src/design/settings.ts';
import {rgb} from '../src/design/element-composition.ts';
import {separateSubject,raggedFrame,screenOriginal,paintMaterial,pressSettings,elementPress,onSheet} from '../src/design/print-pipeline/index.ts';

/** One-ink print of the About photograph: subject separation keeps the arch's silhouette,
 * a ragged inked frame replaces the straight crop, medium AM screen, shared transfer. */
export async function renderAboutPhoto(config){
 const s=resolve(config,'about').values,p=getPalette(config,s.palette),seed=resolve(config).values.seed;
 const W=photo.width*photo.scale,H=Math.round(W*photo.crop.height/photo.crop.width);
 const src=await sharp(new URL('../'+photo.source,import.meta.url).pathname).extract(photo.crop).resize(W,H).ensureAlpha().raw().toBuffer();
 const separated=separateSubject(src,W,H,photo.scale),frame=raggedFrame(W,H,photo.scale,seed);
 const tone=separated.tone.map((t,i)=>t*frame[i]);
 const press=onSheet(elementPress(pressSettings(s,photo.screen),'about-photo','image'),seed,photo.origin,1440);
 const coverage=screenOriginal('about-photo',{kind:'photo',mask:frame,tone},W,H,'b',press,photo.scale,photo.origin);
 // White paper is the neutral carrier: the page multiplies the ink onto its own paper.
 const rgba=paintMaterial([{ink:'b',coverage}],W,H,{a:rgb(p.secondary),b:rgb(p.primary),paper:[255,255,255]},press,photo.scale);
 await sharp(Buffer.from(rgba),{raw:{width:W,height:H,channels:4}}).png({compressionLevel:9,palette:false}).toFile(new URL('../public'+photo.output,import.meta.url).pathname);
 console.log(`Rendered About photograph ${photo.output} (${W}×${H}, ${photo.screen} screen)`);
}
