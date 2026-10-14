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
 assert.ok(['fine','medium','coarse'].includes(aboutPhoto.screen));
 if(aboutPhoto.screen==='coarse')assert.ok(aboutPhoto.displaySize>=72,'coarse is the display tier');
 assert.ok(!aboutPhoto.source.startsWith('public/'),'the unprinted original must not be published');
});
test('printed rules keep their weight, wander only within the budget, and carry ink variation',async()=>{
 const {printRule}=await import('../src/design/print-pipeline/index.ts');
 const {noiseBudget}=await import('../src/design/print-pipeline/budget.ts');
 const {alpha,width,height,pad}=printRule(3,1200,2,{seed:23,origin:{x:200,y:300}},{grain:.08,starve:.08,holes:.04,band:.1});
 let minRow=Infinity,maxRow=0,inked=[];
 for(let y=0;y<height;y++){let s=0;for(let x=0;x<width;x++)s+=alpha[y*width+x]>0?1:0;minRow=Math.min(minRow,s);maxRow=Math.max(maxRow,s);for(let x=0;x<width;x++)if(alpha[y*width+x]>.99)inked.push(1);}
 assert.ok(minRow>=Math.floor((3-noiseBudget.rule.edge)*2),'the line thins below its weight');
 assert.ok(maxRow<=Math.ceil((3+noiseBudget.rule.edge)*2)+2,'the line spreads past its budget');
 const mid=Math.floor(width/2),core=Array.from({length:height},(_,y)=>alpha[y*width+mid]);
 assert.ok(Math.min(...core)<.97,'no ink variation: still a digital line');
 assert.ok(Math.min(...core)>=(1-noiseBudget.transfer.grainLoss)*(1-noiseBudget.transfer.starvation)*(1-noiseBudget.transfer.roller)-1e-6,'ink loss beyond the transfer budget');
});
test('printed blocks (pad 0) keep their exact box and only lose ink inside the transfer budget',async()=>{
 const {printRule}=await import('../src/design/print-pipeline/index.ts');
 const {alpha,width,height}=printRule(40,4,2,{seed:23,origin:{x:500,y:80}},{grain:.08,starve:.08,holes:.04,band:.1},0);
 assert.equal(width,80);assert.equal(height,8);
 const mid=[...Array(width).keys()].map(x=>alpha[3*width+x]);
 assert.ok(Math.min(...mid)>=.7&&Math.max(...mid)<=1);
});
