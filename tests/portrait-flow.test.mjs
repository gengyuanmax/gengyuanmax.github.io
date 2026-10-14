import test from 'node:test';
import assert from 'node:assert/strict';
import {fixedGrid,buildPortraitFlow,flowPath,radiusEnvelope,rasterizeDots} from '../src/design/portrait-flow.ts';
import {preparePortrait,shadowWear} from '../src/design/portrait-plates.ts';
const recipe={black:.09,white:.91,contrast:1.3,levels:4,gain:.12,starvation:.2,grain:.05,seed:23};
const geometry={origin:{x:480,y:80},width:320,height:426,tilt:-2,target:{x:240,y:560},news:{center:{x:270,y:560},radius:36,coverage:.16,ring:{x:243,y:562},ringRadius:30,ringWidth:10}};
const options={start:.82,pitch:4.5,angle:15,blueAngle:75,bend:45,width:.35,density:.08,growth:2.25,offset:{x:2,y:1},recipe};
function pixels(color,alpha=255){return {width:48,height:64,data:Uint8ClampedArray.from(Array.from({length:48*64},()=>[...color,alpha]).flat())};}
test('four-level source separation preserves pixels, respects binary alpha and confines blue to darks',()=>{
 const p=pixels([140,140,140]),original=p.data.slice(),plates=preparePortrait(p,recipe);
 assert.deepEqual(p.data,original);
 assert.ok(new Set(plates.tone).size<=4);
 assert.ok(plates.plates[0][0]>0);assert.equal(plates.plates[1][0],0);
 const dark=preparePortrait(pixels([10,10,10]),recipe);assert.ok(dark.plates[1][0]>.8);
 const empty=preparePortrait(pixels([10,10,10],100),recipe);assert.ok(empty.plates.every(p=>p.every(v=>v===0)));
 assert.ok(shadowWear(.46,.57,.2)<=.81);assert.ok(shadowWear(.9,.1,.2)>.99);
});
test('photo and tail dots lie on stationary per-ink grids; News remains a separate vector composition',()=>{
 const result=buildPortraitFlow(preparePortrait(pixels([40,40,40]),recipe),geometry,options);
 assert.ok(result.dots.length>1000);
 for(const p of result.dots){
  const x=p.x-(p.ink?2:0)-result.origin.x,y=p.y-(p.ink?1:0)-result.origin.y,a=(p.ink?75:15)*Math.PI/180;
  for(const n of [(x*Math.cos(a)+y*Math.sin(a))/options.pitch-.5,(-x*Math.sin(a)+y*Math.cos(a))/options.pitch-.5])assert.ok(Math.abs(n-Math.round(n))<1e-8);
 }
 const empty=buildPortraitFlow(preparePortrait(pixels([10,10,10],0),recipe),geometry,options);
 assert.equal(empty.dots.length,0,'Empty photo plates must not generate a second, coarse copy of the News ornament');
 assert.ok(options.width>=.25);
 const end=flowPath(geometry,options).at(-1);assert.deepEqual({x:end.x,y:end.y},geometry.target);
});
test('radius envelope peaks at 20 percent then declines without changing pitch',()=>{
 let last=0;for(let i=0;i<=20;i++){const r=radiusEnvelope(i/100,2.25);assert.ok(r>=last);last=r;}
 assert.equal(last,2.25);
 for(let i=21;i<=100;i++){const r=radiusEnvelope(i/100,2.25);assert.ok(r<=last);last=r;}
 assert.equal(last,0);
 const a=fixedGrid({left:0,top:0,right:100,bottom:100},5,15),b=fixedGrid({left:20,top:20,right:80,bottom:80},5,15);
 assert.deepEqual(a.filter(p=>p.x>=20&&p.x<=80&&p.y>=20&&p.y<=80),b);
});
test('raster has binary alpha, independent masks, multiply intersections and deterministic five-percent paper holes',()=>{
 const inks=[[207,80,55],[40,62,181]],dots=[{x:100,y:100,r:150,ink:0},{x:100,y:100,r:150,ink:1}];
 const solid=rasterizeDots(dots,inks,200,200,0,1),grain=rasterizeDots(dots,inks,200,200,0,1,.05,23);
 assert.deepEqual([...solid.data.slice(0,4)],[32,19,39,255]);
 assert.deepEqual(grain,rasterizeDots(dots,inks,200,200,0,1,.05,23));
 for(let i=3;i<grain.data.length;i+=4)assert.ok([0,255].includes(grain.data[i]));
 for(let k=0;k<2;k++){const hole=1-grain.masks[k].reduce((a,b)=>a+b,0)/40000;assert.ok(hole>.04&&hole<.06);}
});
