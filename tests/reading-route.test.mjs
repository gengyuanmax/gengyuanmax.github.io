import test from 'node:test';
import assert from 'node:assert/strict';
import {readingRoute} from '../src/design/reading-route.ts';
// The route is reconstructed from live geometry. It must not depend on a
// particular work, image size, screen width or pre-filter slot position.
function segments(path){
 const tokens=path.match(/[MHV]|-?\d+(?:\.\d+)?/g)||[];
 let x=0,y=0,out=[];
 for(let i=0;i<tokens.length;){const op=tokens[i++];if(op==='M'){x=+tokens[i++];y=+tokens[i++];}else {const next=+tokens[i++];const end=op==='H'?[next,y]:[x,next];out.push({from:[x,y],to:end});[x,y]=end;}}
 return out;
}
test('guide stays in the margin and above each staggered row, with one stem reaching each marker',()=>{
 const anchors=[{x:16,y:130,row:'chapter1'},{x:760,y:186,row:'chapter1'},{x:116,y:650,row:'chapter2'}];
 const lines=segments(readingRoute(anchors));
 for(const a of anchors)assert(lines.some(s=>s.from[0]===a.x&&s.to[0]===a.x&&s.to[1]===a.y&&s.from[1]<a.y));
 const spine=lines[0];assert.equal(spine.from[0],-18);assert.equal(spine.to[0],-18);
 for(const row of ['chapter1','chapter2']){const items=anchors.filter(a=>a.row===row);const y=Math.min(...items.map(a=>a.y))-24;assert(lines.some(s=>s.from[0]===-18&&s.from[1]===y&&s.to[0]===Math.max(...items.map(a=>a.x))));}
});
test('stacked and filtered layouts lose obsolete branches and empty results have no path',()=>{
 const mobile=[{x:16,y:40,row:'one'},{x:16,y:480,row:'two'}];
 assert.equal(segments(readingRoute(mobile)).filter(s=>s.to[0]===16&&s.from[0]===16).length,2);
 const single=segments(readingRoute([mobile[1]]));assert(!single.some(s=>s.to[1]===40));
 assert.equal(readingRoute([]),'');
});
