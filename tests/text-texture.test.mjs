import test from 'node:test';
import assert from 'node:assert/strict';
import {printText,textTier} from '../src/design/print-pipeline/text.ts';
test('text tiers protect body and bound low-frequency ink variation',()=>{
 const mask=new Float32Array(128*64).fill(1);
 for(const [size,min] of [[16,1],[20,1],[24,.96],[60,.96],[72,.95],[128,.95]]){
  const recipe={size,dotted:false,radius:.3};
  const result=printText(mask,128,64,1,123,8,75,recipe);
  assert.ok(result.every(v=>v>=min-1e-6&&v<=1));
  assert.deepEqual(result,printText(mask,128,64,1,123,8,75,recipe));
 }
 assert.equal(textTier(71),'heading');assert.equal(textTier(72),'display');
});
test('complete display dots do not touch glyph boundary and ignore noise seed',()=>{
 const w=96,h=64,mask=Float32Array.from({length:w*h},(_,i)=>i%w>12&&i%w<84&&Math.floor(i/w)>12&&Math.floor(i/w)<52?1:0);
 const recipe={size:128,dotted:true,radius:.3};
 const dots=printText(mask,w,h,1,123,8,75,recipe);
 assert.ok(dots.some(v=>v===1));assert.deepEqual(dots,printText(mask,w,h,1,987,8,75,recipe));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(dots[y*w+x])assert.ok(mask[y*w+x]&&mask[y*w+x-1]&&mask[y*w+x+1]&&mask[(y-1)*w+x]&&mask[(y+1)*w+x]);
});
