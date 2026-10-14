/** Build output backend: same prepared plates as the browser, rasterized by sharp. */
import sharp from 'sharp';
import {Buffer} from 'node:buffer';
export async function renderPngScene(paper,plateVectors){
 const sheets=await Promise.all(plateVectors.map(async vector=>({input:await sharp(Buffer.from(vector)).png().toBuffer(),blend:'multiply'})));
 return sharp(Buffer.from(paper.rgba),{raw:{width:paper.width,height:paper.height,channels:4}}).composite(sheets).png().toBuffer();
}
