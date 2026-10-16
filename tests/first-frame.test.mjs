import test from 'node:test';
import assert from 'node:assert/strict';
import {dotPitch,dotPlateImage,groundFirstCoverage,nameDots} from '../src/design/print-pipeline/first-frame.ts';
import {noiseBudget} from '../src/design/print-pipeline/budget.ts';
import {screen,typeScreenLevel} from '../src/design/screen.ts';
import {textTier} from '../src/design/print-pipeline/text.ts';
import {defaults,cssVariables} from '../src/design/settings.ts';
import {screenOriginal,pressSettings,onSheet,paintMaterial,makeToneField,toneSettings} from '../src/design/print-pipeline/index.ts';

// The first frame is painted by CSS from these values; they must be the pipeline's own.
test('CSS dot pitch equals the pipeline screen pitch for every display size',()=>{
 for(let size=72;size<=200;size+=.5){const level=typeScreenLevel(size);assert.ok(level);assert.equal(dotPitch(size),screen(level,'b',defaults,size).pitch,`size ${size}`);}
});
test('the inline name script uses the same tier thresholds as textTier',()=>{
 for(const size of [16,23.9,24,71.9,72,160])assert.equal(size>=72?'display':size>=24?'heading':'body',textTier(size));
});
test('the CSS dot plate carries the plate angle and the printText base radius (capped at .38)',()=>{
 const svg=decodeURIComponent(dotPlateImage(75,.37,23));
 assert.match(svg,/rotate\(75\)/);
 const mean=r=>{const d=nameDots(r,23);return d.reduce((a,v)=>a+v.r,0)/d.length;};
 assert.ok(Math.abs(mean(.37)-5.92)<.3,`mean radius ${mean(.37)}`);assert.ok(Math.abs(mean(.5)-6.08)<.3);
 assert.ok(cssVariables({...defaults,titleTreatment:'dotted'})['--dot-plate'].startsWith('url("data:image/svg+xml,'));
});
test('name dots vary like print but stay inside the dot budget: none removed, merged or cut',()=>{
 const b=noiseBudget.text.dots,dots=nameDots(.37,23),base=16*.37;
 assert.equal(dots.length,24*24);
 const radii=dots.map(d=>d.r);assert.ok(Math.max(...radii)-Math.min(...radii)>base*.12,'dots are not visibly varied');
 for(const [k,d] of dots.entries()){const i=k%24,j=Math.floor(k/24);
  assert.ok(d.r>=base*(1-b.radius)-1e-9&&d.r<=base+1e-9,`radius ${d.r}`);
  assert.ok(Math.abs(d.x-(i+.5)*16)<=b.shift*16+1e-9&&Math.abs(d.y-(j+.5)*16)<=b.shift*16+1e-9,'shift');
 }
 // Neighbours never touch: the lattice still reads as separate dots.
 for(const [k,d] of dots.entries()){const right=dots[k+1],down=dots[k+24];
  for(const e of [right,down])if(e&&(k%24!==23||e===down))assert.ok(Math.hypot(e.x-d.x,e.y-d.y)>d.r+e.r+.5,'dots merge');}
 assert.deepEqual(nameDots(.37,23),dots,'same seed, same plate');
});
test('a ground\'s flat first frame matches the mean ink of its final screen',()=>{
 for(const groundOpacity of [.18,.5,.85])for(const scale of [1,2]){
  const s={...defaults,groundOpacity,dotGain:.2,toneNoise:0},w=160*scale,h=80*scale,origin={x:40,y:300};
  const p=onSheet({...pressSettings(s,'fine'),grain:0,starve:0,band:0,holes:0},5,origin,2000);
  const flat=new Float32Array(w*h).fill(groundOpacity),tone=makeToneField(flat,w,h,scale,'plane',toneSettings(s),p.seed);
  const coverage=screenOriginal('first-frame-probe',{kind:'shape',mask:flat,tone},w,h,'b',p,scale,origin);
  const rgba=paintMaterial([{ink:'b',coverage}],w,h,{a:[0,0,0],b:[0,0,0],paper:[255,255,255]},{...p,offset:{x:0,y:0}},scale);
  let ink=0;for(let i=0;i<rgba.length;i+=4)ink+=1-rgba[i]/255;ink/=w*h;
  const first=groundFirstCoverage(s);
  assert.ok(Math.abs(first-ink)<=.03,`opacity ${groundOpacity} @${scale}x: first frame ${first.toFixed(3)} vs final ${ink.toFixed(3)}`);
 }
});
