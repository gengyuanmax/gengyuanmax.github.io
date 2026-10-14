import {pagePlates} from '../src/design/print-pipeline/plates.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../src/design/settings.ts';
import {researchRecipe,researchSeed,shapeEnvelope,dotRadius,paperPixels,plateVector} from '../src/design/research-render.ts';
const config={version:1,global:{},areas:{},elements:{}};
const settings={...defaults,researchSeed:20261014};
test('seeded irregular dots reproduce exactly, differ across seeds, and keep geometry fixed',()=>{
 const a=researchRecipe(settings,config,320),b=researchRecipe(settings,config,320),c=researchRecipe({...settings,researchSeed:20261015},config,320);
 const da=a.stateDots('benchmarking','normal'),db=b.stateDots('benchmarking','normal'),dc=c.stateDots('benchmarking','normal');
 assert.deepEqual(da,db);assert.notDeepEqual(da,dc);assert.deepEqual(a.geometry,c.geometry);
 assert.equal(new Set(da.map(d=>d.points.map(p=>[+(p.x-d.x).toFixed(5),+(p.y-d.y).toFixed(5)]).flat().join(','))).size,da.length);
 assert(da.every(d=>d.points.length===12&&d.tone>=settings.researchDropout));
});
test('silhouette fades continuously before its edge and dense dots can join',()=>{
 assert.equal(shapeEnvelope(0,100),1);assert.equal(shapeEnvelope(85,100),1);assert.equal(shapeEnvelope(100,100),0);assert.equal(shapeEnvelope(110,100),0);
 assert(shapeEnvelope(90,100)>shapeEnvelope(95,100));assert(shapeEnvelope(95,100)>shapeEnvelope(99,100));
 assert(dotRadius(.9,7,1.12)>7/Math.sqrt(2));
});
test('three noise controls change marks; DPR only changes raster size',()=>{
 const base=researchRecipe(settings,config,200),dots=base.stateDots('domain','normal');
 for(const key of ['researchInkNoise','researchFeedNoise','researchFiberNoise'])assert.notDeepEqual(researchRecipe({...settings,[key]:0},config,200).stateDots('domain','normal'),dots);
 const a=paperPixels(base,1),b=paperPixels(base,2);assert.equal(b.width,a.width*2);assert.equal(b.height,a.height*2);
 assert(base.stateDots('domain','active').some(d=>d.tone>dots.reduce((n,d)=>Math.max(n,d.tone),0)));
});
test('research circles print with the page plates: same angles and offsets, vermilion is the reference',()=>{
 const r=researchRecipe(settings,config,320),page=Object.fromEntries(pagePlates(settings).map(p=>[p.ink,p]));
 for(const [id,ink] of [['blue','b'],['orange','a'],['yellow','c']]){
  assert.equal(r.plates[id].angle,page[ink].angle);
  assert.deepEqual(r.transforms[id],{...page[ink].registration,rotation:0,scale:1});
 }
 assert.deepEqual(r.transforms.orange,{x:0,y:0,rotation:0,scale:1});
 const fallback=plateVector(r,'machines');assert(fallback.includes('<polygon'));assert(!/stroke|pattern|mask/.test(fallback));
});
test('automatic seed uses Brussels calendar date and explicit seed is authoritative',()=>{
 const date=new Date('2026-10-14T22:30:00Z');assert.equal(researchSeed({...settings,researchSeed:0},date),20261015);assert.equal(researchSeed(settings,date),20261014);
});
