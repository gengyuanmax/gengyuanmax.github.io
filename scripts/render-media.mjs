import {renderPortraitPlates} from './render-portrait-plates.mjs';
import {renderPortraitComposition} from './render-portrait-composition.mjs';
import {renderAboutPhoto} from './render-about-photo.mjs';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {validateConfig,resolve,getPalette} from '../src/design/settings.ts';
import {cropRect,renderPrint,rendererVersion} from '../src/design/print.ts';
import {assets,placements,portraitReview} from '../src/data/assets.ts';
const config=JSON.parse(await fs.readFile(new URL('../src/config/design.json',import.meta.url),'utf8'));
validateConfig(config);
await renderPortraitPlates(config);
await fs.mkdir(new URL('../.design/',import.meta.url),{recursive:true});
await renderPortraitComposition(config);
await renderAboutPhoto(config);
for(const [element,placement] of Object.entries(placements)) {
  const asset=assets[placement.asset];
  const bytes=await fs.readFile(new URL('../'+asset.original,import.meta.url));
  const sourceHash=crypto.createHash('sha256').update(bytes).digest('hex');
  if(sourceHash!==asset.sourceHash)throw new Error('Source changed; update asset manifest after review');
  const settings=resolve(config,placement.area,element).values;
  if(settings.portraitMaterial==='composition'){
    const output='/images/portrait-composition.png';
    const outputHash=crypto.createHash('sha256').update(await fs.readFile(new URL('../public'+output,import.meta.url))).digest('hex');
    await fs.writeFile(new URL('../.design/portrait-selected.json',import.meta.url),JSON.stringify({element,mode:'element-lab-composition',source:asset.original,sourceHash,output,outputHash,recipe:'portrait-composition-applied.json',approval:'User selected the exported recipe for this homepage preview'},null,2)+'\n');
    continue;
  }
  if(settings.portraitMaterial==='press'){
    const output='/images/portrait-press.png';
    const outputHash=crypto.createHash('sha256').update(await fs.readFile(new URL('../public'+output,import.meta.url))).digest('hex');
    await fs.writeFile(new URL('../.design/portrait-selected.json',import.meta.url),JSON.stringify({element,mode:'source-native-two-plate',source:asset.original,sourceHash,output,outputHash,recipe:'portrait-plates/recipe.json',provenance:'Original photo pixels; separately authored binary outline; no generated person pixels',approval:'outline and print treatment pending'},null,2)+'\n');
    continue;
  }
  if(settings.portraitMaterial==='cutout'){
    const candidate=await fs.readFile(new URL('../public'+portraitReview.source,import.meta.url));
    const outputHash=crypto.createHash('sha256').update(candidate).digest('hex');
    if(outputHash!==portraitReview.hash)throw new Error('Selected cutout changed; review and update its manifest');
    const metadata=await sharp(candidate).metadata();
    if(!metadata.hasAlpha||metadata.width!==portraitReview.width||metadata.height!==portraitReview.height)throw new Error('Selected cutout must retain its original size and transparency');
    await fs.writeFile(new URL('../.design/portrait-selected.json',import.meta.url),JSON.stringify({element,mode:'fixed-cutout',source:asset.original,sourceHash,output:portraitReview.source,outputHash,provenance:portraitReview.provenance,approval:portraitReview.approval,screenedAgain:false},null,2)+'\n');
    console.log(`Verified existing transparent cutout ${portraitReview.source}; no rescreening`);
    continue;
  }
  const crop=cropRect(asset.width,asset.height,settings);
  const {data,info}=await sharp(bytes).extract({left:Math.floor(crop.x),top:Math.floor(crop.y),width:Math.floor(crop.width),height:Math.floor(crop.height)}).resize(720).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const palette=getPalette(config,settings.palette);
  const rendered=renderPrint({width:info.width,height:info.height,data},settings,palette);
  const output=new URL('../public'+asset.derivative,import.meta.url);
  await sharp(Buffer.from(rendered.data),{raw:{width:rendered.width,height:rendered.height,channels:4}}).webp({quality:88}).toFile(output.pathname);
  const outputHash=crypto.createHash('sha256').update(await fs.readFile(output)).digest('hex');
  await fs.writeFile(new URL(`../.design/${placement.recipe}.json`,import.meta.url),JSON.stringify({source:asset.original,sourceHash,recipe:placement.recipe,rendererVersion,settings,palette,output:asset.derivative,outputHash,approval:'pending'},null,2)+'\n');
  await fs.writeFile(new URL('../.design/portrait-selected.json',import.meta.url),JSON.stringify({element,mode:'parameterized-recipe',source:asset.original,sourceHash,output:asset.derivative,outputHash,recipe:placement.recipe,rendererVersion,approval:'pending'},null,2)+'\n');
  console.log(`Rendered ${asset.derivative} from preserved original (${rendererVersion})`);
}
