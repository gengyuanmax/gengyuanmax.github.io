import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {resolve,getPalette,validateConfig} from '../../src/design/settings.ts';
import {printObjects} from '../../src/config/print-objects.ts';
import {staticFieldPreview} from '../../src/design/print-pipeline/field-static.mjs';
import {printHomeLandscape} from '../../scripts/render-home-landscape.mjs';

/** Fingerprints of the printed output of every tool-rendered element: the static print of
 * the three project marks and the four-ink home landscape, from the committed config. */
export const markIds=['mark-icq','mark-icqhl','mark-reexplore','mark-surgeon','mark-meretriever','mark-mevtr'];
export async function printMarks(){
 const config=JSON.parse(fs.readFileSync(new URL('../../src/config/design.json',import.meta.url),'utf8'));validateConfig(config);
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),seed=resolve(config).values.seed,result={};
 for(const id of markIds){
  const {area,kind}=printObjects[id],s=resolve(config,area,id).values;
  const png=await staticFieldPreview(s,id,kind,getPalette(config,s.palette),seed);
  result[id]=hash(Buffer.from(png.split(',')[1],'base64'));
 }
 const {rgba}=await printHomeLandscape(config);
 result['home-landscape']=hash(Buffer.from(rgba.buffer,rgba.byteOffset,rgba.byteLength));
 return result;
}
