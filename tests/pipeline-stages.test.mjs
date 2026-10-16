import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.cwd();
const {paintSheet}=await import(`${base}/src/design/print-pipeline/sheet.ts`);
const {pressSettings}=await import(`${base}/src/design/print-pipeline/material.ts`);
const {defaults}=await import(`${base}/src/design/settings.ts`);
const {lineScreen}=await import(`${base}/src/design/print-pipeline/line-screen.ts`);
test('RGB transfer/composite preserves latest-main pixels independent of new no-spread screens',()=>{
const hashes={};
for(const fast of [false,true])for(const scale of [1,2]){
const w=73,h=41,p={...pressSettings(defaults),fast,sheet:{seed:42,origin:{x:113,y:207}},grain:.12,starve:.15,holes:.04,band:.1};
const plates=['a','b'].map((ink,j)=>({ink,opaque:j===1,coverage:Float32Array.from({length:w*h},(_,i)=>(i%17)/17)}));
hashes[`${fast}-${scale}`]=createHash('sha256').update(paintSheet(plates,w,h,{a:[207,80,55],b:[40,62,181],paper:[240,235,223]},p,scale)).digest('hex');}
const reference=JSON.parse(readFileSync(new URL('./fixtures/pipeline-stages-32dc02f.json',import.meta.url),'utf8'));
for(const key of Object.keys(hashes))assert.equal(hashes[key],reference[key],key);
});
