import test from 'node:test';
import assert from 'node:assert/strict';
import {dotPitch,dotPlateImage,groundFirstCoverage} from '../src/design/print-pipeline/first-frame.ts';
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
test('the CSS dot plate carries the plate angle and printText radius (capped at .38)',()=>{
 const svg=decodeURIComponent(dotPlateImage(75,.37));
 assert.match(svg,/rotate\(75\)/);assert.match(svg,/r='5\.920'/);
 assert.match(decodeURIComponent(dotPlateImage(75,.5)),/r='6\.080'/);
 assert.ok(cssVariables({...defaults,titleTreatment:'dotted'})['--dot-plate'].startsWith('url("data:image/svg+xml,'));
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
