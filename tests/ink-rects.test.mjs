import test from 'node:test';
import assert from 'node:assert/strict';
import {groupInkRects} from '../src/design/print-pipeline/ink-rects.ts';
import {unionInkCoverage} from '../src/design/print-pipeline/ink-group.ts';
import fs from 'node:fs';
const r=(x,y,width,height,color='blue')=>({x,y,width,height,color});
test('timeline spine, stems and frame corners join, disjoint rules stay small',()=>{
 const groups=groupInkRects([r(10,0,2,100),r(10,20,10,1),r(10,70,10,1),r(60,0,2,10)]);
 assert.deepEqual(groups.map(g=>g.length).sort(),[1,3]);
});
test('joining a bridge merges both components, but never different inks',()=>{
 assert.equal(groupInkRects([r(0,0,2,4),r(4,0,2,4),r(1,0,4,1)]).length,1);
 assert.equal(groupInkRects([r(0,0,2,4),r(0,0,2,4,'orange')]).length,2);
});
test('repeated translucent guide coverage is max union, not source-over opacity accumulation',()=>{
 const f={coverage:new Float32Array([.8,.5]),width:2,height:1,x:0,y:0,drawWidth:2,drawHeight:1};
 assert.deepEqual(unionInkCoverage([f,f],2,1),f.coverage);
});
test('already printed sheet marks, contact stamps and grouped outputs are excluded from generic reprinting',()=>{
 const source=fs.readFileSync('src/client/print-rules.ts','utf8');
 assert.match(source,/const skip=.*\.he-sheet-marks,\.he-contact-icon,\.he-ink-group-output/);
});

import {compositeRasterPlates} from '../src/design/print-pipeline/raster-composite.ts';
test('shared raster composite coalesces repeated ink IDs for every caller',()=>{
 const b={ink:'b',coverage:new Float32Array([.7,1])},inks={b:[40,62,181],paper:[255,255,255]},p={offset:{x:0,y:0}};
 assert.deepEqual(compositeRasterPlates([b,b],2,1,inks,p,1,()=>.9),compositeRasterPlates([b],2,1,inks,p,1,()=>.9));
});
