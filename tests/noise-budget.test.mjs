import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {noiseBudget,budgetedSettings} from '../src/design/print-pipeline/budget.ts';
import {parameters,defaults,validateConfig} from '../src/design/settings.ts';
import {pressSettings,onSheet,paintMaterial,makeToneField,toneSettings} from '../src/design/print-pipeline/index.ts';
import {printText} from '../src/design/print-pipeline/text.ts';
import {screenPolygons} from '../src/design/print-pipeline/polygon.ts';
import {researchPlates} from '../src/design/research-plates.ts';

test('no setting range can exceed the noise budget',()=>{
 for(const [key,max,signed] of budgetedSettings){
  const p=parameters[key];assert.ok(p,`missing setting ${key}`);
  assert.ok(p.max<=max+1e-9,`${key} max ${p.max} exceeds budget ${max}`);
  if(signed)assert.ok(p.min>=-max-1e-9,`${key} min ${p.min} exceeds budget -${max}`);
 }
});
test('approved defaults and the saved configuration sit inside the budget',()=>{
 const saved=JSON.parse(fs.readFileSync(new URL('../src/config/design.json',import.meta.url),'utf8'));
 validateConfig(saved);
 for(const [key,max,signed] of budgetedSettings){
  for(const value of [defaults[key],saved.global[key]].filter(v=>v!==undefined))assert.ok(signed?Math.abs(value)<=max:value>=0&&value<=max,`${key}=${value} outside budget`);
 }
});

// Below: direct calls with values far past any setting. The pipeline itself must clamp.
const extreme={...defaults,grain:1,starvation:1,banding:1,pressGrain:1,dotGain:3,toneNoise:.6,toneNoiseScale:4,registration:40,registrationY:-40};

test('transfer loss on grounds, geometry and images never exceeds the budget',()=>{
 const w=240,h=240,p=onSheet(pressSettings(extreme),23,{x:0,y:0},w),coverage=new Float32Array(w*h).fill(1);
 const rgba=paintMaterial([{ink:'a',coverage}],w,h,{a:[0,0,0],b:[0,0,0],paper:[255,255,255]},p,1);
 const b=noiseBudget.transfer,minimum=.96*(1-b.grainLoss)*(1-b.starvation)*(1-b.roller);
 let lightest=0;for(let i=0;i<rgba.length;i+=4)lightest=Math.max(lightest,rgba[i]);
 assert.ok(1-lightest/255>=minimum-1/255,`ink thinned to ${(1-lightest/255).toFixed(3)}, budget floor ${minimum.toFixed(3)}`);
 assert.ok(Math.abs(p.offset.x)<=noiseBudget.registration.plate&&Math.abs(p.offset.y)<=noiseBudget.registration.plate);
 assert.ok(p.gain<=noiseBudget.dotGain);
});
test('pre-screen tone variation is bounded and never finer than the budget scale',()=>{
 const w=320,h=40,mask=new Float32Array(w*h).fill(1),calm={...toneSettings(defaults),noise:0},wild={...toneSettings(extreme),noise:.6,noiseScale:4};
 const base=makeToneField(mask,w,h,1,'plane',calm,7),noisy=makeToneField(mask,w,h,1,'plane',wild,7);
 let worst=0,step=0;for(let i=0;i<base.length;i++)worst=Math.max(worst,Math.abs(noisy[i]-base[i]));
 for(let x=1;x<w;x++)step=Math.max(step,Math.abs(noisy[x]-noisy[x-1]));
 assert.ok(worst<=noiseBudget.tone.amplitude+1e-6,`tone moved ${worst.toFixed(3)}`);
 // A field whose features are >= 80px cannot change by more than its amplitude over 1px.
 assert.ok(step<=noiseBudget.tone.amplitude*2/(noiseBudget.tone.minScale*.23)*1.6,`tone step ${step.toFixed(4)} too sharp`);
});
test('text ink varies at most by its tier budget, even with full roller banding',()=>{
 const w=200,h=60,mask=new Float32Array(w*h).fill(1),sheet={seed:5,origin:{x:0,y:0},height:300,band:1};
 for(const [size,limit] of [[96,noiseBudget.text.display],[40,noiseBudget.text.heading]]){
  const out=printText(mask,w,h,1,5,8,75,{size,dotted:false,radius:.37},sheet);
  assert.ok(Math.min(...out)>=1-limit-1e-6,`${size}px text lost ${(1-Math.min(...out)).toFixed(3)}`);
 }
});
test('research dots respect the budget for per-dot noise, dot gain and dropout',()=>{
 const w=200,h=200,source={kind:'procedural',sample:()=>({shape:1,focus:.5})};
 const base={angle:15,pitch:7,density:1,coverage:.45,dropout:0,dotGain:1,inkNoise:0,feedNoise:0,fiberNoise:0};
 const calm=screenPolygons(source,w,h,11,'blue',base),wild=screenPolygons(source,w,h,11,'blue',{...base,inkNoise:1,feedNoise:1,fiberNoise:1,dotGain:3,dropout:.9});
 const r=noiseBudget.research,floor=(1-r.ink)*(1-r.feed)*(1-r.fiber),calmTone=new Map(calm.map(d=>[`${d.x.toFixed(3)},${d.y.toFixed(3)}`,d.tone]));
 assert.ok(wild.length>calm.length*.5,'dropout above budget removed most dots');
 for(const d of wild){const t=calmTone.get(`${d.x.toFixed(3)},${d.y.toFixed(3)}`);if(t===undefined)continue;
  assert.ok(d.tone>=t*floor-1e-6&&d.tone<=t*(1+r.ink)+1e-6,`dot tone ${d.tone} outside budget of ${t}`);
  assert.ok(d.radius<=Math.max(7*.76*1.1,7/2*Math.sqrt(d.tone)*r.dotGain*1.1)+1e-6,'dot gain above budget');
 }
});
test('research plate offsets are clamped to the research registration budget',()=>{
 const plates=researchPlates({...defaults,researchOrangeX:9,researchOrangeY:-9,yellowX:12,yellowY:-12});
 for(const id of ['orange','yellow'])for(const axis of ['x','y'])assert.ok(Math.abs(plates[id][axis])<=noiseBudget.registration.research);
});
