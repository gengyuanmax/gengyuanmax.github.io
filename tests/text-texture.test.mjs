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
test('uniform display dots clip to glyph boundaries and ignore noise seed',()=>{
 const w=96,h=64,mask=Float32Array.from({length:w*h},(_,i)=>i%w>12&&i%w<84&&Math.floor(i/w)>12&&Math.floor(i/w)<52?1:0);
 const recipe={size:128,dotted:true,radius:.37};
 const dots=printText(mask,w,h,1,123,8,75,recipe);
 assert.ok(dots.some(v=>v===1));assert.deepEqual(dots,printText(mask,w,h,1,987,8,75,recipe));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(dots[y*w+x])assert.ok(mask[y*w+x]);
 assert.ok(dots.some((v,i)=>v&&i%w===13));
 assert.ok(dots.every(v=>v===0||v===1));
});
test('display and heading type carry the press transfer, bounded by their tier budget; body stays solid',async()=>{
 const {noiseBudget}=await import('../src/design/print-pipeline/budget.ts');
 const w=200,h=120,mask=new Float32Array(w*h).fill(1),sheet={seed:23,origin:{x:300,y:900},height:1440,band:.1},transfer={grain:.08,starve:.08,holes:.04,band:.1};
 for(const [size,cap] of [[96,noiseBudget.text.display],[40,noiseBudget.text.heading]]){
  const out=printText(mask,w,h,1,5,8,75,{size,dotted:false,radius:.37,transfer},sheet);
  const min=Math.min(...out),mean=out.reduce((a,v)=>a+v,0)/out.length;
  assert.ok(min>=1-cap-1e-6,`${size}px lost ${(1-min).toFixed(3)}`);
  assert.ok(1-min>.06,`${size}px transfer too faint to read as print (${(1-min).toFixed(3)})`);
  assert.ok(mean>.93,`${size}px mean ink ${mean.toFixed(3)} too thin`);
 }
 assert.ok(printText(mask,w,h,1,5,8,75,{size:16,dotted:false,radius:.37,transfer},sheet).every(v=>v===1));
});
