import test from 'node:test';
import assert from 'node:assert/strict';
import {screenPlate,paintMaterial,pressSettings,elementPress} from '../src/design/press-material.ts';
import {defaults} from '../src/design/settings.ts';
const press={...pressSettings(defaults),pitch:3,gain:0,edge:0,grain:.3,starve:.25,holes:.05};
test('separate elements crop the same page-anchored screen at both ink angles',()=>{
 for(const ink of ['a','b']){
  const full=screenPlate(new Float32Array(80*80).fill(.36),80,80,ink,press,2);
  const crop=screenPlate(new Float32Array(30*30).fill(.36),30,30,ink,press,2,{x:7.5,y:11});
  for(let y=0;y<30;y++)for(let x=0;x<30;x++)assert.equal(crop[y*30+x],full[(y+22)*80+x+15]);
 }
});
test('Print Lab spreading changes edge shape without adding ink to an empty plate',()=>{
 const tone=new Float32Array(100*100).fill(.25);
 const clean=screenPlate(tone,100,100,'b',press),worn=screenPlate(tone,100,100,'b',{...press,gain:.2,edge:.65});
 assert(worn.reduce((a,b)=>a+b,0)>clean.reduce((a,b)=>a+b,0));
 assert.equal(screenPlate(new Float32Array(10000),100,100,'a',{...press,edge:1}).some(v=>v!==0),false);
});
test('fine grain affects at most four percent and never punches holes',()=>{
 const n=160,coverage=new Float32Array(n*n).fill(1),inks={a:[207,80,55],b:[40,62,181],paper:[255,255,255]};
 const p={...press,starve:0,grain:.2,holes:.03},pixels=paintMaterial([{ink:'a',coverage}],n,n,inks,p);
 const clean=paintMaterial([{ink:'a',coverage}],n,n,inks,{...p,grain:0});
 let affected=0;for(let i=0;i<n*n;i++){
  assert.equal(pixels[i*4+3],255);if(pixels[i*4+2]>clean[i*4+2])affected++;
  assert(pixels[i*4+2]<=102,'ink never loses more than 20% to grain');
 }
 assert(affected/(n*n)>.005&&affected/(n*n)<.04);
 assert.deepEqual(pixels,paintMaterial([{ink:'a',coverage}],n,n,inks,p));
});
test('starvation never removes a full patch, and element patterns are independent',()=>{
 const n=100,coverage=new Float32Array(n*n).fill(1),inks={a:[0,0,0],b:[0,0,0],paper:[255,255,255]};
 const p={...press,grain:0,starve:1,holes:0};
 const first=paintMaterial([{ink:'b',coverage}],n,n,inks,elementPress(p,'plate-one','field'));
 const second=paintMaterial([{ink:'b',coverage}],n,n,inks,elementPress(p,'plate-two','field'));
 for(let i=0;i<n*n;i++){assert(first[i*4]<=72,'starvation is capped at 25%');assert.equal(first[i*4+3],255);}
 assert.notDeepEqual(first,second);
 const title=elementPress(p,'title','title',90);assert.equal(title.patch,30);assert.equal(title.starve,.08);
});
test('two inks multiply and share an offset; a single ink is never misregistered',()=>{
 const n=32,coverage=new Float32Array(n*n).fill(1),inks={a:[207,80,55],b:[40,62,181],paper:[255,255,255]},p={...press,holes:0,grain:0,starve:0};
 const one=paintMaterial([{ink:'b',coverage}],n,n,inks,p);
 assert.deepEqual(one,paintMaterial([{ink:'b',coverage}],n,n,inks,{...p,offset:{x:8,y:6}}));
 const both=paintMaterial([{ink:'a',coverage},{ink:'b',coverage}],n,n,inks,p);
 for(let c=0;c<3;c++)assert(both[(10*n+10)*4+c]<one[(10*n+10)*4+c]);
});

test('separated proofs preserve registration and recombine to the two-ink result',()=>{
 const n=40,a=new Float32Array(n*n),b=new Float32Array(n*n);
 for(let y=7;y<28;y++)for(let x=5;x<24;x++)a[y*n+x]=.8;
 for(let y=10;y<34;y++)for(let x=12;x<31;x++)b[y*n+x]=1;
 const plates=[{ink:'a',coverage:a},{ink:'b',coverage:b}],inks={a:[207,80,55],b:[40,62,181],paper:[255,255,255]};
 for(const offset of [{x:0,y:0},{x:3,y:1.5}]){
  const p={...press,offset},both=paintMaterial(plates,n,n,inks,p,2);
  const red=paintMaterial(plates,n,n,{...inks,b:[255,255,255]},p,2);
  const blue=paintMaterial(plates,n,n,{...inks,a:[255,255,255]},p,2);
  for(let i=0;i<both.length;i++)if(i%4!==3)assert(Math.abs(both[i]-Math.round(red[i]*blue[i]/255))<=1);
 }
});
