import test from 'node:test';
import assert from 'node:assert/strict';
import {screenOriginal,pressSettings,onSheet,transferPolicy} from '../src/design/print-pipeline/index.ts';
import {screenPolygons} from '../src/design/print-pipeline/polygon.ts';
import {defaults} from '../src/design/settings.ts';
import {transferEdgeOffset,transferDotRadius} from '../src/design/print-pipeline/transfer.ts';
test('all raster original kinds ignore stale spreading controls at DPR 1/2/3',()=>{
 assert.equal(transferPolicy.spread,false);
 for(const kind of ['photo','shape','text'])for(const scale of [1,2,3]){
  const w=60,h=48,mask=Float32Array.from({length:w*h},(_,i)=>i%w>12&&i%w<45?1:0),tone=mask.map(v=>v*.4);
  const p=onSheet({...pressSettings(defaults),pitch:7,gain:0,edge:0},42,{x:10,y:20});
  const draw=press=>screenOriginal('policy-test',{kind,mask,tone},w,h,'b',press,scale,p.sheet.origin);
  const clean=draw(p),stale=draw({...p,edge:1,gain:.4});
  assert.deepEqual(stale,clean);
  assert.ok(stale.every((v,i)=>mask[i]||v===0),'no ink outside original');
 }
});
test('vector transfer never expands nominal dot/line bounds',()=>{
 for(const offset of [-1,-.1,0,.1,1])assert.ok(transferEdgeOffset(offset)<=0);
 assert.equal(transferDotRadius(3,1.3),3);
 const p={angle:15,pitch:7,density:1,coverage:.45,dropout:0,dotGain:1.3,inkNoise:0,feedNoise:0,fiberNoise:0};
 const dots=screenPolygons({kind:'procedural',sample:()=>({shape:1,focus:.95})},40,40,42,'blue',p);
 assert.deepEqual(dots,screenPolygons({kind:'procedural',sample:()=>({shape:1,focus:.95})},40,40,42,'blue',{...p,dotGain:1}));
 for(const d of dots){assert.ok(d.radius<=p.pitch/2*Math.sqrt(d.tone)+1e-9);for(const v of d.points)assert.ok(Math.hypot(v.x-d.x,v.y-d.y)<=d.radius+1e-9);}
});
