import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as native from '../src/design/vendor/print-lab-core.js';
import {separatePrintLab,screenOriginal,paintMaterial,pressSettings,onSheet} from '../src/design/print-pipeline/index.ts';
import {sheetInk,spreadRectangle} from '../src/design/print-pipeline/sheet.ts';
import {defaults} from '../src/design/settings.ts';
// Unmodified reference is independent of production dispatch. Export local stages in memory only.
const referenceCode=fs.readFileSync(new URL('../src/design/vendor/print-lab-reference.js',import.meta.url),'utf8').replace(/^import .*;$/m,'').replace('export {render};','return {render,plates};');
const reference=Function('rng','lowNoise','spotT','spread','boxBlur',referenceCode)(native.rng,native.lowNoise,native.spotT,native.spread,native.boxBlur);
const colors={a:[207,80,55],b:[40,62,181],c:[230,200,20],paper:[240,235,223]};
test('native AM screen and ink transfer match the reference render for mono, duo and tri inputs',()=>{
 const n=40,rgba=Uint8ClampedArray.from({length:n*n*4},(_,i)=>i%4===3?255:(i*31+17)%256);
 for(const mode of ['mono','duo','tri'])for(const blend of ['multiply','opaque']){
  const params={mode,blend,stock:'explicit',inkA:'#cf5037',inkB:'#283eb5',inkC:'#e6c814',paper:'#f0ebdf',process:'none',screen:'am',pattern:'none',shape:'round',angle:15,cell:6*600/n,contrast:1,gain:0,grain:0,starve:0,band:0,tex:0,black:0,white:1,gamma:1,posterize:0,invA:false,invB:false,mx:0,my:0,ca:0,age:0,fox:0,fold:'none'};
  let expected;const canvas={width:n,getContext:()=>({drawImage(){},getImageData:()=>({data:rgba.slice()}),putImageData:({data})=>{expected=data;}})};
  reference.render(canvas,params,{});
  // Same RGBA original enters independent production and reference separation.
  const originals=separatePrintLab(rgba,{...params,mode}).tones,ids=['a','b','c'];
  const press=onSheet({...pressSettings({...defaults,dotGain:0,grain:0,starvation:0,pressGrain:0,inkEdge:0}),band:0,pitch:6,angles:{a:15,b:45,c:75},shapes:{a:'round',b:'round',c:'round'},offset:{x:0,y:0},registration:{}},1337,{x:0,y:0});
  const layers=originals.flatMap((tone,i)=>tone?[{ink:ids[i],opaque:blend==='opaque',coverage:screenOriginal('reference-image',{kind:'photo',mask:new Float32Array(n*n).fill(1),tone},n,n,ids[i],press)}]:[]);
  const actual=paintMaterial(layers,n,n,colors,press);
  let max=0;for(let i=0;i<actual.length;i++)max=Math.max(max,Math.abs(actual[i]-expected[i]));
  assert.ok(max<=1,`${mode}/${blend}: maximum channel error ${max}`);
 }
});
test('binary rectangular spread equals native spread with the same field and no blur',()=>{
 const n=32,mask=Float32Array.from({length:n*n},(_,i)=>i%11===0?1:0),field=Float32Array.from({length:n*n},native.rng(7)),expected=mask.slice();
 native.spread(expected,n,1,field,.42,0);
 spreadRectangle(mask,n,n,1,(x,y)=>field[y*n+x],.42);
 assert.deepEqual(mask,expected);assert.ok(mask.every(v=>v===0||v===1));
});
test('ink patches remain continuous across independently rendered rectangular elements',()=>{
 const w=120,h=24,base={...pressSettings({...defaults,seed:5}),offset:{x:0,y:0},holes:.04,grain:.2,starve:.25};
 const draw=(width,origin,seed)=>paintMaterial([{ink:'a',coverage:new Float32Array(width*h).fill(1)}],width,h,colors,onSheet({...base,seed},5,origin),2);
 const whole=draw(w,{x:10,y:30},10),left=draw(48,{x:10,y:30},999),right=draw(72,{x:34,y:30},-20);
 for(let y=0;y<h;y++){assert.deepEqual(left.subarray(y*48*4,(y+1)*48*4),whole.subarray(y*w*4,(y*w+48)*4));assert.deepEqual(right.subarray(y*72*4,(y+1)*72*4),whole.subarray((y*w+48)*4,(y+1)*w*4));}
 assert.notDeepEqual(whole,draw(w,{x:510,y:730},10));
 assert.notEqual(sheetInk(5,34,30),sheetInk(6,34,30));
});
test('sheet screening is binary from minBinaryCell device pixels, area coverage below, and keeps rectangular dimensions',async()=>{
 const {binaryCell}=await import('../src/design/print-pipeline/sheet.ts');
 for(const scale of [1,2]){const w=80*scale,h=12*scale,tone=new Float32Array(w*h).fill(.4),p=onSheet(pressSettings(defaults),5,{x:20,y:40});
  const screened=screenOriginal('field',{kind:'shape',mask:tone,tone},w,h,'a',p,scale,p.sheet.origin);
  assert.equal(screened.length,w*h);assert.ok(screened.every(v=>v>=0&&v<=1));
  // Medium is 4 CSS px: 8 device px at 2x stays the native binary screen; 4 at 1x cannot hold one.
  if(binaryCell(p.pitch,scale))assert.ok(screened.every(v=>v===0||v===1));else assert.ok(screened.some(v=>v>0&&v<1));
 }
});

test('complete native separation matches reference including tone curve, levels and gain',()=>{
 const n=24,data=Uint8ClampedArray.from({length:n*n*4},(_,i)=>i%4===3?255:(i*73)%256);
 for(const mode of ['mono','sep','duo','tri']){
  const recipe={mode,black:.08,white:.92,gamma:1.3,posterize:4,contrast:1.15,gain:.2};
  assert.deepEqual(separatePrintLab(data,recipe).tones,reference.plates(data,n,mode,recipe.contrast,recipe.gain,recipe).filter(Boolean));
 }
 const transparent=data.slice();for(let i=3;i<transparent.length;i+=4)transparent[i]=0;
 assert.ok(separatePrintLab(transparent,{mode:'tri'}).tones.every(t=>t.every(v=>v===0)));
});

test('roller banding uses sheet Y, respects off, and survives independent crops',async()=>{
 const {sheetRoller}=await import('../src/design/print-pipeline/sheet.ts');
 const sheet={seed:23,origin:{x:0,y:0},height:1440},values=Array.from({length:1441},(_,y)=>sheetRoller(sheet,y));
 assert.ok(values.every(v=>v>=0&&v<=1));assert.ok(Math.max(...values)-Math.min(...values)>.5);
 assert.ok(Math.abs(values[71]-values[72])<.05,'roller has no step at a cell boundary');
 const w=20,h=600,press=onSheet({...pressSettings(defaults),grain:0,starve:0,holes:0,band:.8},23,{x:0,y:0});
 const ink=[{ink:'a',coverage:new Float32Array(w*h).fill(1)}];
 const on=paintMaterial(ink,w,h,colors,press),off=paintMaterial(ink,w,h,colors,{...press,band:0});
 assert.notDeepEqual(on,off);
 for(let x=1;x<w;x++)assert.deepEqual(on.subarray(x*4,x*4+4),on.subarray(0,4));
 const crop=paintMaterial([{ink:'a',coverage:new Float32Array(w*100).fill(1)}],w,100,colors,onSheet(press,23,{x:0,y:200}));
 assert.deepEqual(crop,on.subarray(200*w*4,300*w*4));
});
