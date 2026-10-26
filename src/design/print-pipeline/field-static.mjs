import sharp from 'sharp';
import {motifOriginals,motifScreenLevel} from '../motifs.ts';
import {renderFieldOriginals,onSheet,elementPress,pressSettings} from './index.ts';
/** Canonical 360×220 CSS-pixel source, 2× sampling. Same stages as the live field. */
export async function staticFieldPreview(settings,id,kind,palette,sheetSeed){
 const width=720,height=440,scale=2,origin={x:0,y:0};
 const originals=await Promise.all(motifOriginals(settings,id,kind).map(async item=>{
  const rgba=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 360 220"><g fill="black" color="black">${item.markup}</g></svg>`)).ensureAlpha().raw().toBuffer();
  return {...item,coverage:Float32Array.from({length:width*height},(_,i)=>rgba[i*4+3]/255)};
 }));
 const p=onSheet(elementPress(pressSettings(settings,motifScreenLevel(kind)),id,'field'),sheetSeed,origin);
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const {pixels}=renderFieldOriginals(originals,width,height,scale,origin,p,settings,{a:rgb(palette.secondary),b:rgb(palette.primary),c:rgb(palette.yellow??'#dfba29'),d:rgb(palette.dark??'#2c2a2e'),paper:[255,255,255]});
 const png=await sharp(Buffer.from(pixels),{raw:{width,height,channels:4}}).png().toBuffer();
 return `data:image/png;base64,${png.toString('base64')}`;
}
