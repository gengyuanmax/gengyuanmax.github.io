import test from 'node:test';
import assert from 'node:assert/strict';
import {researchGeometry,researchLabelArc,regionOrder,regionKey} from '../src/design/research-geometry.ts';
import {researchMemberships} from '../src/data/research-memberships.ts';
test('horizontal circle controls preserve overlap, canvas bounds and readable label separation',()=>{
 for(const ratio of [.55,.95,4/3,1.4])for(const stagger of [-30,0,30]){
  const g=researchGeometry(ratio,stagger),c=['machines','benchmarking','domain'].map(id=>g.circles[id]);
  assert(c[0].x<c[1].x&&c[1].x<c[2].x);
  assert.equal(c[0].y,c[2].y);
  for(const p of c){assert(p.x-g.r>=0&&p.x+g.r<=g.width);assert(p.y-g.r>=0&&p.y+g.r<=g.height);}
  for(let i=1;i<c.length;i++)assert(Math.hypot(c[i].x-c[i-1].x,c[i].y-c[i-1].y)<2*g.r,'adjacent circles continue to overlap');
  for(const ids of regionOrder){const p=g.anchors[regionKey(ids)];if(!p)continue;const actual=Object.entries(g.circles).filter(([,c])=>Math.hypot(c.x-p.x,c.y-p.y)<g.r).map(([id])=>id);assert.equal(regionKey(actual),regionKey(ids));}
 }
});
test('default adjacent overlap is one third of the diameter and labels stay concentric at each size',()=>{
 const g=researchGeometry(),a=g.circles.benchmarking,b=g.circles.domain;
 assert(Math.abs((2*g.r-(b.x-a.x))/(2*g.r)-1/3)<.002);
 for(const scale of [.5,.8,1])for(const id of ['benchmarking','domain','machines']){
  const arc=researchLabelArc(g,id,scale);
  assert.deepEqual({x:arc.cx,y:arc.cy},g.circles[id]);
  assert(Math.abs(arc.fontSize*scale-18)<1e-12);
  assert((arc.radius-g.r)*scale>=14-1e-10);
 }
});
test('membership correction preserves existing research page cross links',()=>{
 assert.deepEqual(researchMemberships.c,['domain','machines']);
 assert.deepEqual(researchMemberships.f,['benchmarking','machines']);
 assert.equal(researchMemberships.d.length,3);
});
