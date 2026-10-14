import sharp from 'sharp';
import {Buffer} from 'node:buffer';
import {paperPixels,plateVector} from './research-render.ts';
import {researchPrintOrder} from './research-plates.ts';
import {directions} from '../data/research-map.ts';
/** Build-only PNG fallback. The browser uses the same polygon recipe on canvas. */
export async function staticResearchPreview(recipe){
 const paper=paperPixels(recipe);
 const sheets=await Promise.all(researchPrintOrder.map(async id=>({input:await sharp(Buffer.from(plateVector(recipe,directions.find(d=>d.plate===id).id))).png().toBuffer(),blend:'multiply'})));
 const png=await sharp(Buffer.from(paper.rgba),{raw:{width:paper.width,height:paper.height,channels:4}}).composite(sheets).png().toBuffer();
 return `data:image/png;base64,${png.toString('base64')}`;
}
