import fs from 'node:fs/promises';
import sharp from 'sharp';
import {portraitSource} from '../src/design/portrait-source.ts';
import {preparePortrait,hexRGB} from '../src/design/portrait-plates.ts';
import {buildPortraitFlow,rasterizeDots} from '../src/design/portrait-flow.ts';
import {resolve,getPalette} from '../src/design/settings.ts';
export async function renderPortraitPlates(config){
 const s=resolve(config,'home','home-portrait').values,c=portraitSource.crop;
 const image=await sharp(new URL('../public'+portraitSource.source,import.meta.url).pathname).extract(c).ensureAlpha().raw().toBuffer();
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${c.width}" height="${c.height}" viewBox="${c.left} ${c.top} ${c.width} ${c.height}"><path d="${portraitSource.outline}" fill="white"/></svg>`;
 const mask=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
 for(let i=0;i<c.width*c.height;i++)image[i*4+3]=mask[i*4+3]>=128?255:0;
 const input={width:c.width,height:c.height,data:image};
 await sharp(image,{raw:{width:c.width,height:c.height,channels:4}}).png().toFile(new URL('../public'+portraitSource.cutout,import.meta.url).pathname);
 const recipe={black:s.pressBlack,white:s.pressWhite,contrast:s.contrast,levels:s.pressLevels,gain:s.dotGain,starvation:s.starvation,grain:s.pressGrain,seed:s.seed};
 const prepared=preparePortrait(input,recipe),palette=getPalette(config,s.palette),inks=[hexRGB(palette.secondary),hexRGB(palette.primary)];
 const w=390,h=520,g={origin:{x:0,y:0},width:w,height:h,tilt:0,target:{x:w/2,y:h+100}};
 const opts={start:1,pitch:s.printPitch,angle:s.printAngle,blueAngle:s.pressBlueAngle,bend:45,width:.35,density:1,growth:2.25,offset:{x:s.registration,y:s.registrationY},recipe};
 const out=buildPortraitFlow(prepared,g,opts),raster=rasterizeDots(out.dots,inks,w*2,h*2,0,2,s.pressGrain,s.seed);
 await sharp(Buffer.from(raster.data),{raw:{width:w*2,height:h*2,channels:4}}).png().toFile(new URL('../public'+portraitSource.fallback,import.meta.url).pathname);
 const dir=new URL('../.design/portrait-plates/',import.meta.url);await fs.mkdir(dir,{recursive:true});
 for(const [name,field]of [['01-tone',prepared.tone],['02-orange',prepared.plates[0]],['02-blue',prepared.plates[1]]]){
  const bytes=new Uint8Array(c.width*c.height*4);
  for(let i=0;i<field.length;i++){const value=prepared.alpha[i]?Math.round((name==='01-tone'?field[i]:1-field[i])*255):255;bytes.set([value,value,value,255],i*4);}
  await sharp(bytes,{raw:{width:c.width,height:c.height,channels:4}}).png().toFile(new URL(name+'.png',dir).pathname);
 }
 for(let k=0;k<2;k++){
  const bytes=new Uint8Array(w*2*h*2*4);for(let i=0;i<raster.masks[k].length;i++)bytes.set(raster.masks[k][i]?[0,0,0,255]:[255,255,255,255],i*4);
  await sharp(bytes,{raw:{width:w*2,height:h*2,channels:4}}).png().toFile(new URL(k?'03-blue-screen.png':'03-orange-screen.png',dir).pathname);
 }
 await fs.writeFile(new URL('recipe.json',dir),JSON.stringify({source:portraitSource,recipe,inks,printPitchCSS:s.printPitch,angles:[s.printAngle,s.pressBlueAngle],offset:opts.offset,referenceWidthCSS:w,deviceScale:2,status:'review',adaptation:'User-specified 4-level luminance separation, binary grain, 15/75 screens; not the Lab sep channel algorithm.'},null,2)+'\n');
 console.log('Rendered source-native portrait, tone proof, and independent ink plates');
}
