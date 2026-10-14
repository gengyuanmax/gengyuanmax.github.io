import test from 'node:test';
import assert from 'node:assert/strict';
import {blockStats,rasterizeDots} from './helpers/uniformity.mjs';
import {defaults} from '../src/design/settings.ts';
import {noiseBudget} from '../src/design/print-pipeline/budget.ts';
import {screenPolygons} from '../src/design/print-pipeline/polygon.ts';
import {rng} from '../src/design/print-pipeline/noise.ts';
import {screenOriginal,pressSettings,elementPress,onSheet,paintMaterial,makeToneField,toneSettings} from '../src/design/print-pipeline/index.ts';

// One glitch limit for every screening profile: designed, slow ink variation is
// allowed; mottle at the scale of a few screen cells is not.
const residualLimit=.02,sheet={seed:5,origin:{x:700,y:900},height:1440};

function ground(scale,settings){
 const s={...defaults,groundOpacity:.85,...settings},w=320*scale,h=320*scale,origin={x:80,y:500};
 const p=onSheet(elementPress(pressSettings(s,'fine'),'uniformity','field'),5,origin,2000);
 const flat=new Float32Array(w*h).fill(.85),tone=makeToneField(flat,w,h,scale,'plane',toneSettings(s),p.seed);
 const rgba=paintMaterial([{ink:'b',coverage:screenOriginal('uniformity',{kind:'shape',mask:flat,tone},w,h,'b',p,scale,origin)}],w,h,{a:[0,0,0],b:[0,0,0],paper:[255,255,255]},{...p,offset:{x:0,y:0}},scale);
 const ink=new Float32Array(w*h);for(let i=0;i<ink.length;i++)ink[i]=1-rgba[i*4]/255;
 return blockStats(ink,w,h,8*scale);
}
function research(scale,pitch,screen,source={kind:'procedural',sample:()=>({shape:1,focus:.4})}){
 const dots=screenPolygons(source,320,320,11,'blue',{angle:15,pitch,density:1,coverage:.45,sheet,...screen});
 return blockStats(rasterizeDots(dots,320*scale,320*scale,scale),320*scale,320*scale,pitch*4*scale);
}
const approvedResearch={dropout:.06,dotGain:1.12,inkNoise:.15,feedNoise:.2,fiberNoise:.065};
const r=noiseBudget.research,maxResearch={dropout:r.dropout,dotGain:r.dotGain,inkNoise:r.ink,feedNoise:r.feed,fiberNoise:r.fiber};
const t=noiseBudget.transfer,maxGround={toneNoise:noiseBudget.tone.amplitude,toneNoiseScale:noiseBudget.tone.minScale,starvation:t.starvation,grain:t.grainLoss,pressGrain:t.grainArea,banding:t.roller*2,dotGain:noiseBudget.dotGain};

for(const scale of [1,2]){
 test(`material-v1 grounds stay free of mottle at ${scale}x (approved and budget ceiling)`,()=>{
  for(const settings of [{},maxGround]){const {residual}=ground(scale,settings);assert.ok(residual<=residualLimit,`residual ${residual.toFixed(4)}`);}
 });
 test(`polygon-v1 research dots stay free of mottle at ${scale}x (approved and budget ceiling)`,()=>{
  for(const pitch of [4,7])for(const screen of [approvedResearch,maxResearch]){const {residual}=research(scale,pitch,screen);assert.ok(residual<=residualLimit,`pitch ${pitch}: residual ${residual.toFixed(4)}`);}
 });
}
test('the metric flags high-frequency pre-screen noise as glitch',()=>{
 const random=rng(3),noisy={kind:'procedural',sample:()=>({shape:1,focus:.15+.5*random()})};
 const {residual}=research(1,7,{...approvedResearch,inkNoise:0,feedNoise:0,fiberNoise:0},noisy);
 assert.ok(residual>residualLimit,`random per-dot tone should exceed the limit, got ${residual.toFixed(4)}`);
});
