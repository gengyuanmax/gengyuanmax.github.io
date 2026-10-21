import './render-brand.mjs';
import {renderPortraitComposition} from './render-portrait-composition.mjs';
import {renderAboutPhoto} from './render-about-photo.mjs';
import {renderHomeLandscape} from './render-home-landscape.mjs';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {validateConfig} from '../src/design/settings.ts';
import {assets,placements} from '../src/data/assets.ts';
const config=JSON.parse(await fs.readFile(new URL('../src/config/design.json',import.meta.url),'utf8'));
validateConfig(config);
await fs.mkdir(new URL('../.design/',import.meta.url),{recursive:true});
await renderPortraitComposition(config);
await renderAboutPhoto(config);
await renderHomeLandscape(config);
for(const [element,placement] of Object.entries(placements)) {
  const asset=assets[placement.asset];
  const bytes=await fs.readFile(new URL('../'+asset.original,import.meta.url));
  const sourceHash=crypto.createHash('sha256').update(bytes).digest('hex');
  if(sourceHash!==asset.sourceHash)throw new Error('Source changed; update asset manifest after review');
  const output='/images/portrait-composition.png';
    const outputHash=crypto.createHash('sha256').update(await fs.readFile(new URL('../public'+output,import.meta.url))).digest('hex');
    await fs.writeFile(new URL('../.design/portrait-selected.json',import.meta.url),JSON.stringify({element,mode:'element-lab-composition',source:asset.original,sourceHash,output,outputHash,recipe:'portrait-composition-applied.json',approval:'User selected the exported recipe for this homepage preview'},null,2)+'\n');
}
