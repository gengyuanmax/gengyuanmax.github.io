import test from 'node:test';
import assert from 'node:assert/strict';
import {routeBands,routeCoverage} from '../src/design/print-pipeline/route.ts';
const tiles=[{paths:[{weight:10,points:[{x:20,y:0},{x:20,y:600}]}],stations:[]},{paths:[{weight:6,points:[{x:20,y:240},{x:20,y:260},{x:100,y:260}]}],stations:[{x:100,y:280,radius:8,ring:3}]}];
test('route publication bands do not overlap and each junction includes all same-ink paths',()=>{
 const bands=routeBands(tiles);
 for(let i=1;i<bands.length;i++)assert.ok(bands[i].y>=bands[i-1].y+bands[i-1].height);
 const junction=bands.find(b=>b.y<=260&&b.y+b.height>260);
 assert.equal(junction.paths.length,2);
 assert.equal(junction.stations.length,1);
});
test('cropped padded bands reconstruct the single unioned route plate exactly',()=>{
 const paths=tiles.flatMap(t=>t.paths),stations=tiles.flatMap(t=>t.stations);
 for(const scale of [1,2]){
  const full=routeCoverage(130,620,scale,paths,14,stations);
  for(const b of routeBands(tiles,128)){
   const shift=q=>({x:q.x-b.x,y:q.y-b.y+b.padding});
   const local=routeCoverage(b.width,b.height+2*b.padding,scale,b.paths.map(p=>({...p,points:p.points.map(shift)})),14,b.stations.map(s=>({...s,...shift(s)})));
   for(let y=0;y<b.height*scale;y++)for(let x=0;x<b.width*scale;x++){
    const gx=x+b.x*scale,gy=y+b.y*scale;if(gx<0||gy<0||gx>=130*scale||gy>=620*scale)continue;
    assert.equal(local[(y+b.padding*scale)*b.width*scale+x],full[gy*130*scale+gx]);
   }
  }
 }
});
test('empty routes publish no bands',()=>assert.deepEqual(routeBands([]),[]));
