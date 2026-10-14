import test from 'node:test';
import assert from 'node:assert/strict';
import {separateSubject,raggedFrame,raggedFrameRecipe} from '../src/design/print-pipeline/index.ts';
import {aboutPhoto} from '../src/config/about-photo.ts';
const px=(...c)=>c;
function swatch(colors,w=48,h=48){const data=new Uint8ClampedArray(colors.length*w*h*4);colors.forEach(([r,g,b],k)=>{for(let i=0;i<w*h;i++){const j=(k*w*h+i)*4;data[j]=r;data[j+1]=g;data[j+2]=b;data[j+3]=255;}});return {data,w,h:h*colors.length};}
const mean=(tone,k,size=48*48)=>{let s=0;for(let i=k*size;i<(k+1)*size;i++)s+=tone[i];return s/size;};
test('a sunlit red-rock subject prints denser than the darker land behind it, and the sky stays light',()=>{
 const rock=px(196,92,62),land=px(78,66,60),sky=px(205,210,228),{data,w,h}=swatch([rock,land,sky]);
 const {tone}=separateSubject(data,w,h,1),r=mean(tone,0),l=mean(tone,1),s=mean(tone,2);
 assert.ok(r>l+.15,`rock ${r.toFixed(2)} vs land ${l.toFixed(2)}: silhouette would merge`);
 assert.ok(l>s+.15,`land ${l.toFixed(2)} vs sky ${s.toFixed(2)}`);
 assert.ok(s<.2&&r<=.95);
});
test('the ragged frame is seeded, bounded by its inset and depth, and never a straight crop',()=>{
 const w=360,h=300,f=raggedFrame(w,h,1,23),g=raggedFrame(w,h,1,23),k=raggedFrameRecipe;
 assert.deepEqual(f,g);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const d=Math.min(x,y,w-1-x,h-1-y);if(d<k.inset-1)assert.equal(f[y*w+x],0);if(d>k.inset+k.depth+k.feather+1)assert.equal(f[y*w+x],1);}
 const firstInk=[];for(let y=0;y<h;y+=4){let x=0;while(x<w&&f[y*w+x]===0)x++;firstInk.push(x);}
 assert.ok(Math.max(...firstInk)-Math.min(...firstInk)>=3,'left edge is a straight line');
});
test('the About photograph is printed from the kept source on the shared screen tiers',()=>{
 assert.ok(['fine','medium'].includes(aboutPhoto.screen));
 assert.ok(!aboutPhoto.source.startsWith('public/'),'the unprinted original must not be published');
});
