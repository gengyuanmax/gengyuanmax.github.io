import test from 'node:test';
import assert from 'node:assert/strict';
import {readingTree,levelScale} from '../src/design/reading-route.ts';
// The tree is reconstructed from live geometry. It must not depend on a particular
// work, image size, screen width or pre-filter slot position.
const anchors=[{x:16,y:330,row:'chapter1'},{x:760,y:386,row:'chapter1'},{x:116,y:850,row:'chapter2'}];
const bands=[{top:100,bottom:280},{top:600,bottom:780}];
test('each marker gets one stem from its row bus, which starts at the trunk',()=>{
 const {ink}=readingTree(anchors,bands);
 for(const a of anchors){const stem=ink.find(r=>r.level===2&&Math.abs(r.x+r.width/2-a.x)<1&&Math.abs(r.y+r.height-a.y)<1);assert(stem,`no stem for ${a.x},${a.y}`);
  assert(ink.some(r=>r.level===1&&Math.abs(r.y-stem.y)<1e-9&&r.x<=-18&&r.x+r.width>=stem.x+stem.width-1e-9));}
});
test('line weight falls with depth and edges sit on device pixels',()=>{
 for(const dpr of [1,2,3]){const {ink}=readingTree(anchors,bands,{weight:1.5,dpr,origin:{x:73.4,y:12.25}});
  const width=l=>Math.min(...ink.filter(r=>r.level===l).map(r=>l===1?r.height:r.width));
  assert(width(0)>width(1)&&width(1)>width(2),`dpr ${dpr}: ${width(0)} ${width(1)} ${width(2)}`);
  for(const r of ink)for(const v of [r.x+73.4,r.y+12.25,r.width,r.height])assert(Math.abs(v*dpr-Math.round(v*dpr))<1e-6,`dpr ${dpr}: ${v} off grid`);
 }
 assert.deepEqual([...levelScale],[1,.67,.4]);
});
test('the trunk never overprints a chapter band; it knocks the band out instead',()=>{
 const {ink,knockouts}=readingTree(anchors,bands);
 for(const band of bands){
  assert(!ink.some(r=>r.level===0&&r.y<band.bottom&&r.y+r.height>band.top),'trunk ink inside a band');
 }
 assert.ok(knockouts.length>=1);for(const k of knockouts)assert(bands.some(b=>k.y>=b.top&&k.y+k.height<=b.bottom));
});
test('stacked and filtered layouts lose obsolete branches and empty results draw nothing',()=>{
 const mobile=[{x:16,y:40,row:'one'},{x:16,y:480,row:'two'}];
 assert.equal(readingTree(mobile).ink.filter(r=>r.level===2).length,2);
 assert.equal(readingTree([mobile[1]]).ink.filter(r=>r.level===2).length,1);
 assert.deepEqual(readingTree([]),{ink:[],knockouts:[]});
});
test('a knockout never leaves a sliver of band at the band edge',()=>{
 const {knockouts}=readingTree(anchors,bands.map(b=>({...b,left:-22,right:900})),{weight:3});
 assert.ok(knockouts.length);for(const k of knockouts)assert.ok(k.x-(-22)>=16,`knockout ${k.x-(-22)}px from the band edge`);
});
test('staggered bands that do not reach the trunk are not cut, and the trunk stays ink beside them',()=>{
 const staggered=[{top:100,bottom:280,left:-60,right:700},{top:600,bottom:780,left:250,right:1300}];
 const {ink,knockouts}=readingTree(anchors,staggered,{weight:3});
 assert.equal(knockouts.length,1);assert.ok(knockouts[0].y>=100&&knockouts[0].y+knockouts[0].height<=280);
 assert.ok(ink.some(r=>r.level===0&&r.y<780&&r.y+r.height>600),'trunk must stay ink beside a band that does not reach it');
});
test('About timelines use the same levels: spine is the trunk, entries get level-1 branches',async()=>{
 const {timelineGuides,guideWeights}=await import('../src/design/reading-route.ts');
 const rects=timelineGuides({x:150,top:20,bottom:400},[30,180,330],{weight:3,dpr:2});
 const w=guideWeights(3,2);
 assert.equal(rects.filter(r=>r.level===0).length,1);assert.equal(rects[0].width,w[0]);
 assert.equal(rects.filter(r=>r.level===1).length,3);for(const r of rects.filter(r=>r.level===1))assert.equal(r.height,w[1]);
});
