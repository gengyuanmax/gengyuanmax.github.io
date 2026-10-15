import test from 'node:test';
import assert from 'node:assert/strict';
import {screenOriginal,paintMaterial,pressSettings,elementPress,onSheet,makeToneField,toneSettings} from '../src/design/print-pipeline/index.ts';
import {defaults} from '../src/design/settings.ts';
// The runtime fast path must look the same as the exact path the baselines pin:
// equal ink density, no block-scale difference, small per-pixel deviation.
function pair(scale,tone,level){
 const cssW=160,cssH=80,w=cssW*scale,h=cssH*scale,origin={x:211.5,y:733.25};
 const base=onSheet(elementPress(pressSettings({...defaults,dotGain:.2},level),'fast-probe','field'),23,origin,1440);
 const mask=new Float32Array(w*h).fill(1),flat=new Float32Array(w*h).fill(tone);
 const t=makeToneField(flat,w,h,scale,'plane',toneSettings(defaults),base.seed);
 const run=p=>{const cov=screenOriginal('fast-probe',{kind:'shape',mask,tone:t},w,h,'b',p,scale,origin);return {cov,rgba:paintMaterial([{ink:'b',coverage:cov}],w,h,{a:[0,0,0],b:[0,0,0],paper:[255,255,255]},{...p,offset:{x:0,y:0}},scale)};};
 return {w,h,exact:run(base),fast:run({...base,fast:true})};
}
const ink=rgba=>{let s=0;for(let i=0;i<rgba.length;i+=4)s+=1-rgba[i]/255;return s/(rgba.length/4);};
for(const scale of [1,2,3])for(const tone of [.3,.6,.85])test(`fast path matches exact at ${scale}x, tone ${tone}`,()=>{
 const {w,h,exact,fast}=pair(scale,tone,'fine');
 assert.ok(Math.abs(ink(exact.rgba)-ink(fast.rgba))<=.012,`density ${ink(exact.rgba).toFixed(3)} vs ${ink(fast.rgba).toFixed(3)}`);
 // 8 CSS px blocks: the eye compares tone, not pixels.
 const size=8*scale;let worst=0;
 for(let by=0;by+size<=h;by+=size)for(let bx=0;bx+size<=w;bx+=size){let a=0,b=0;for(let y=by;y<by+size;y++)for(let x=bx;x<bx+size;x++){const i=(y*w+x)*4;a+=exact.rgba[i];b+=fast.rgba[i];}worst=Math.max(worst,Math.abs(a-b)/size/size/255);}
 assert.ok(worst<=.03,`block difference ${worst.toFixed(3)}`);
});
