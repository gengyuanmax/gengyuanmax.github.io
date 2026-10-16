import sharp from 'sharp';
import {aboutPhoto as photo} from '../src/config/about-photo.ts';
import {resolve,getPalette} from '../src/design/settings.ts';
import {rgb} from '../src/design/element-composition.ts';
import {separateSubject,raggedFrame,screenOriginal,paintMaterial,pressSettings,elementPress,onSheet} from '../src/design/print-pipeline/index.ts';

/** One-ink print of the About photograph. Knockout (user choice): the folio is a solid
 * blue box like the old "04" plate, and the arch is what the box does not print, so its
 * shape comes out of the box in reverse. The subject separation keeps the silhouette. */
export async function renderAboutPhoto(config){
 const s=resolve(config,'about').values,p=getPalette(config,s.palette),seed=resolve(config).values.seed;
 const W=photo.width*photo.scale,H=Math.round(W*photo.crop.height/photo.crop.width);
 const src=await sharp(new URL('../'+photo.source,import.meta.url).pathname).extract(photo.crop).resize(W,H).ensureAlpha().raw().toBuffer();
 const separated=separateSubject(src,W,H,photo.scale),box=new Float32Array(W*H).fill(1);
 const knockout=photo.treatment==='knockout',frame=knockout?box:raggedFrame(W,H,photo.scale,seed);
 // Knockout inverts the separation: sky and land carry the ink, the lit rock is paper.
 const tone=separated.tone.map((t,i)=>knockout?Math.max(0,Math.min(.97,1.02-1.1*t)):t*frame[i]);
 const press=onSheet({...elementPress(pressSettings(s,photo.screen,photo.displaySize),'about-photo','image'),...photo.press},seed,photo.origin,1440);
 const coverage=screenOriginal('about-photo',{kind:'photo',mask:frame,tone},W,H,'b',press,photo.scale,photo.origin);
 // White paper is the neutral carrier: the page multiplies the ink onto its own paper.
 const rgba=paintMaterial([{ink:'b',coverage}],W,H,{a:rgb(p.secondary),b:rgb(p.primary),paper:[255,255,255]},press,photo.scale);
 await sharp(Buffer.from(rgba),{raw:{width:W,height:H,channels:4}}).png({compressionLevel:9,palette:false}).toFile(new URL('../public'+photo.output,import.meta.url).pathname);
 console.log(`Rendered About photograph ${photo.output} (${W}×${H}, ${photo.treatment}, ${press.pitch}px ${photo.screen} screen)`);
}
