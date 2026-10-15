import test from 'node:test';
import assert from 'node:assert/strict';
import {routeCoverage,roundedPath} from '../src/design/print-pipeline/index.ts';
const at=(c,w,x,y)=>c[Math.floor(y)*w+Math.floor(x)];
test('bends become arcs of the given radius and the path length is kept in order',()=>{
 const segs=roundedPath([{x:10,y:0},{x:10,y:50},{x:60,y:50}],12);
 assert.deepEqual(segs.map(s=>s.kind),['line','arc','line']);
 assert.ok(Math.abs(segs[1].r-12)<1e-9);
 assert.ok(Math.abs(segs[2].s-(38+Math.PI/2*12))<1e-6);
});
test('strokes are solid along the path, round at bends and empty away from them',()=>{
 for(const pts of [[{x:50,y:0},{x:50,y:50},{x:100,y:50}],[{x:50,y:0},{x:50,y:50},{x:10,y:50}]]){
  const c=routeCoverage(140,80,1,[{points:pts,weight:6}],12);
  assert.ok(at(c,140,50,10)>.9);assert.ok(at(c,140,(pts[1].x+pts[2].x)/2,50)>.9);assert.equal(at(c,140,90,10),0);
 }
 const c=routeCoverage(100,80,1,[{points:[{x:10,y:0},{x:10,y:50},{x:60,y:50}],weight:4}],16);
 assert.equal(at(c,100,10,50),0,'the sharp corner is cut');
 assert.ok(at(c,100,26-16*Math.SQRT1_2,34+16*Math.SQRT1_2)>.5,'arc midpoint is inked');
});
test('stations are rings with a paper centre that knock lines out',()=>{
 const c=routeCoverage(60,60,1,[{points:[{x:30,y:0},{x:30,y:60}],weight:6}],12,[{x:30,y:30,radius:8,ring:3}]);
 assert.equal(at(c,60,30,30),0);assert.ok(at(c,60,30,23)>.5);assert.ok(at(c,60,36.5,30)>.5);
});
import {metroTree} from '../src/design/reading-route.ts';
test('the metro tree keeps the reading tree: one trunk, one tile per row, a station per item',()=>{
 const t=metroTree([{x:100,y:200,row:'a'},{x:600,y:260,row:'a'},{x:300,y:800,row:'b'}],[{top:0,bottom:120,left:-40,right:900}]);
 assert.equal(t.tiles.length,3);
 assert.equal(t.tiles[0].paths[0].points[0].x,t.trunkX);
 assert.deepEqual(t.tiles[1].stations.map(s=>[s.x,s.y]),[[100,200],[600,260]]);
 assert.equal(t.knockouts.length,1);
 // Every piece is horizontal, vertical or 45°.
 for(const tile of t.tiles)for(const p of tile.paths)for(let i=1;i<p.points.length;i++){const dx=Math.abs(p.points[i].x-p.points[i-1].x),dy=Math.abs(p.points[i].y-p.points[i-1].y);assert.ok(dx<1e-9||dy<1e-9||Math.abs(dx-dy)<1e-9);}
});
