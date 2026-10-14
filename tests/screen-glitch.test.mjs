import test from 'node:test';
import assert from 'node:assert/strict';
import {screenOriginal,pressSettings,elementPress,onSheet} from '../src/design/print-pipeline/index.ts';
import {minBinaryCell} from '../src/design/print-pipeline/sheet.ts';
import {defaults} from '../src/design/settings.ts';

// A uniform tone must print as a uniform screen. Sub-pixel gaps that alias into
// random 1px holes or patches are glitch, not print texture. Tone noise is off so
// that every variation measured here comes from the screen itself.
function uniformGround(scale,tone,level='fine'){
 const cssW=192,cssH=96,w=cssW*scale,h=cssH*scale,origin={x:173.25,y:452.5};
 const p=onSheet(elementPress(pressSettings({...defaults,dotGain:.2,inkEdge:.15},level),'glitch-probe','field'),5,origin,3000);
 const mask=new Float32Array(w*h).fill(1),flat=new Float32Array(w*h).fill(tone);
 return {w,h,scale,coverage:screenOriginal('glitch-probe',{kind:'shape',mask,tone:flat},w,h,'b',p,scale,origin)};
}
function blocks({w,h,scale,coverage}){
 const size=8*scale,values=[];
 for(let by=0;by+size<=h;by+=size)for(let bx=0;bx+size<=w;bx+=size){let sum=0;for(let y=by;y<by+size;y++)for(let x=bx;x<bx+size;x++)sum+=coverage[y*w+x];values.push(sum/size/size);}
 const mean=values.reduce((a,v)=>a+v,0)/values.length;
 return {mean,std:Math.sqrt(values.reduce((a,v)=>a+(v-mean)**2,0)/values.length)};
}
for(const tone of [.35,.6,.82])test(`fine screen at tone ${tone} stays uniform at 1x and 2x`,()=>{
 const one=blocks(uniformGround(1,tone)),two=blocks(uniformGround(2,tone));
 assert.ok(one.std<=.02,`1x block variation ${one.std.toFixed(3)} exceeds .02`);
 assert.ok(two.std<=.02,`2x block variation ${two.std.toFixed(3)} exceeds .02`);
 assert.ok(Math.abs(one.mean-two.mean)<=.03,`ink density differs by DPR: ${one.mean.toFixed(3)} vs ${two.mean.toFixed(3)}`);
});
test('cells of at least minBinaryCell device pixels keep the binary Print Lab screen',()=>{
 const {coverage}=uniformGround(2,.5,'medium');
 assert.equal(4*2>=minBinaryCell,true);
 assert.ok(coverage.every(v=>v===0||v===1),'medium screen at 2x must stay binary');
});
test('cells below minBinaryCell resolve area coverage instead of single samples',()=>{
 const {coverage}=uniformGround(2,.5,'fine');
 assert.ok(coverage.some(v=>v>0&&v<1),'fine screen at 2x must carry fractional dot coverage');
});
