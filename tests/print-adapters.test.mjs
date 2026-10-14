import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {preparePortraitOriginals,paintPortraitOriginals,pressSettings,onSheet,separateOriginal} from '../src/design/print-pipeline/index.ts';
import {defaults} from '../src/design/settings.ts';
import {motifOriginals} from '../src/design/motifs.ts';
import {staticFieldPreview} from '../src/design/print-pipeline/field-static.mjs';

test('photo and shape adapters preserve alpha and the chosen portrait separation',()=>{
 const data=new Uint8ClampedArray([0,0,0,255,255,255,255,255,100,100,100,0]);
 const shape=separateOriginal(data,'shape-alpha-v1'),photo=separateOriginal(data,'photo-percentile-v1');
 assert.deepEqual([...shape.mask],[1,1,0]);assert.deepEqual([...shape.tones[0]],[1,0,0]);assert.deepEqual([...photo.tones[0]],[1,0,0]);
 const width=3,height=1,press=onSheet(pressSettings({...defaults,inkEdge:0}),23,{x:0,y:0});
 const input={shape:data,photo:data,width,height,geometryScale:1,kind:'plane',operation:'over',press,scale:1,origin:{x:0,y:0}};
 const prepared=preparePortraitOriginals(input),inks={a:[207,80,55],b:[40,62,181],paper:[255,255,255]};
 assert.deepEqual(paintPortraitOriginals(prepared,inks),paintPortraitOriginals(preparePortraitOriginals({...input,shape:Buffer.from(data),photo:Buffer.from(data)}),inks));
 assert.throws(()=>preparePortraitOriginals({...input,width:4}),/dimensions/);
});
test('static motifs have complete shared source layers and material PNGs',async()=>{
 const layers=motifOriginals(defaults,'test-earth','earth');
 assert.equal(layers.length,3);assert.equal(layers[0].kind,'sphere');assert.equal(layers[1].ring,true);
 assert.ok(layers.every(l=>!l.markup.includes('url(')));
 const png=await staticFieldPreview(defaults,'test-earth','earth',{primary:'#283eb5',secondary:'#cf5037'},23);
 const {width,height}=await sharp(Buffer.from(png.split(',')[1],'base64')).metadata();
 assert.equal(width,720);assert.equal(height,440);
});
test('active build and browser portrait adapters use the same processing entry',()=>{
 for(const path of ['scripts/render-portrait-composition.mjs','src/design/composition-canvas.ts']){
  const source=fs.readFileSync(path,'utf8');assert.match(source,/preparePortraitOriginals\(/);assert.match(source,/paintPortraitOriginals\(/);
  assert.doesNotMatch(source,/\b(?:darkness|screenOriginal|paintMaterial)\(/);
 }
 assert.equal(fs.existsSync('src/design/ink.ts'),false);
 for(const path of ['src/components/PrintTitle.astro','src/components/PrintWord.astro','src/design/motifs.ts'])assert.doesNotMatch(fs.readFileSync(path,'utf8'),/inkFilter|letter-filter|feTurbulence/);
});
