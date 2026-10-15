import sharp from 'sharp';
import fs from 'node:fs/promises';
// Approved Element Lab render, exported with ink coverage as alpha.
// Crop only transparent margins; do not re-screen or recolor the logo.
const source=new URL('../src/assets/brand/gz-sheet.png',import.meta.url);
const mark=await sharp(source.pathname).trim({background:'#00000000',threshold:0}).png().toBuffer();
await fs.writeFile(new URL('../public/images/gz-logo.png',import.meta.url),mark);
const {width,height}=await sharp(mark).metadata();
const side=Math.max(width,height)+12;
const icon=await sharp({create:{width:side,height:side,channels:4,background:'#00000000'}}).composite([{input:mark,gravity:'centre'}]).png().toBuffer();
await fs.writeFile(new URL('../public/favicon.svg',import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}"><image width="${side}" height="${side}" href="data:image/png;base64,${icon.toString('base64')}"/></svg>\n`);
await sharp(icon).resize(32,32).png().toFile(new URL('../public/favicon-32.png',import.meta.url).pathname);
await sharp(icon).resize(180,180).flatten({background:'#f0ebdf'}).png().toFile(new URL('../public/apple-touch-icon.png',import.meta.url).pathname);
console.log(`Brand mark: ${width}×${height}, transparent background`);
