import test from 'node:test';
import assert from 'node:assert/strict';
import {pagePlates,referencePlate} from '../src/design/print-pipeline/plates.ts';
import {noiseBudget} from '../src/design/print-pipeline/budget.ts';
import {pressSettings,onSheet,paintMaterial,screenOriginal} from '../src/design/print-pipeline/index.ts';
import {defaults} from '../src/design/settings.ts';

test('the page plate list is the single source of angle, shape and registration',()=>{
 const s={...defaults,registration:2,registrationY:1,yellowX:-1,yellowY:1.5,yellowAngle:0};
 const plates=pagePlates(s),p=pressSettings(s,'medium');
 assert.deepEqual(plates.map(x=>x.ink),['a','b','c','d']);
 assert.deepEqual(plates.find(x=>x.ink===referencePlate).registration,{x:0,y:0});
 for(const plate of plates){
  assert.equal(p.angles[plate.ink],plate.angle);assert.equal(p.shapes[plate.ink],plate.shape);
  assert.deepEqual(p.registration[plate.ink],plate.registration);
 }
 assert.deepEqual(p.offset,plates.find(x=>x.ink==='b').registration,'Press.offset mirrors the blue plate');
});
test('plate offsets in the list are clamped to the registration budget',()=>{
 for(const plate of pagePlates({...defaults,registration:9,registrationY:-9,yellowX:9,yellowY:-9}))
  assert.ok(Math.abs(plate.registration.x)<=noiseBudget.registration.plate&&Math.abs(plate.registration.y)<=noiseBudget.registration.plate);
});
test('any plate in the list shifts by its own offset on multi-plate elements, never on single-plate ones',()=>{
 const s={...defaults,yellowX:-2,yellowY:0,yellowAngle:0},w=40,h=20,scale=1;
 const p=onSheet({...pressSettings(s),grain:0,starve:0,band:0,holes:0},5,{x:0,y:0},400);
 const line=new Float32Array(w*h);for(let y=0;y<h;y++)line[y*w+20]=1;
 const inks={a:[255,0,0],b:[0,0,255],c:[0,0,0],paper:[255,255,255]};
 const darkest=rgba=>{let x0=-1,best=256;for(let x=0;x<w;x++){const v=rgba[(10*w+x)*4];if(v<best){best=v;x0=x;}}return x0;};
 assert.equal(darkest(paintMaterial([{ink:'a',coverage:new Float32Array(w*h)},{ink:'c',coverage:line}],w,h,inks,p,scale)),18,'yellow moves by its list offset');
 assert.equal(darkest(paintMaterial([{ink:'c',coverage:line}],w,h,inks,p,scale)),20,'a single plate is its own reference');
 // Screening a new plate needs no renderer change: its angle comes from the list.
 const tone=new Float32Array(w*h).fill(.5);
 assert.equal(screenOriginal('plate-c',{kind:'shape',mask:tone,tone},w,h,'c',p,scale).length,w*h);
});
