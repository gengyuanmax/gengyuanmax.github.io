import test from 'node:test';
import assert from 'node:assert/strict';
import {compose,paint,screen} from '../src/design/element-composition.ts';
import {selectedComposition} from '../src/config/portrait-composition.ts';
import {resolve,validateConfig} from '../src/design/settings.ts';

test('exported selection takes precedence over the lab startup recipe and stays locally adjustable',()=>{
 // The supplied export retains print.pitch=6, but its selected pitch is 4.
 assert.equal(selectedComposition.print.pitch,selectedComposition.selection.pitch);
 const config={version:1,global:{portraitMaterial:'composition'},areas:{},elements:{}};
 assert.equal(resolve(config,'home','home-portrait').values.compositionPitch,selectedComposition.selection.pitch);
 config.elements['home-portrait']={compositionPitch:5,compositionMis:0};validateConfig(config);
 assert.equal(resolve(config,'home','home-portrait').values.compositionPitch,5);
 assert.equal(resolve(config,'home','home-portrait').values.compositionMis,0);
 assert.equal(resolve(config,'home','mark-news').values.compositionPitch,selectedComposition.selection.pitch);
 delete config.elements['home-portrait'];
 assert.equal(resolve(config,'home','home-portrait').values.compositionPitch,selectedComposition.selection.pitch);
});

test('knockout removes the silhouette, including white holes in the screened photo',()=>{
 const a={mask:new Float32Array([1,1,1]),print:new Float32Array([1,1,1])};
 const b={mask:new Float32Array([0,1,1]),print:new Float32Array([0,0,1])};
 const over=compose(a,b,3,1,1,'over'),knock=compose(a,b,3,1,1,'knock');
 assert.deepEqual([...over[0].coverage],[1,1,1]);
 assert.deepEqual([...knock[0].coverage],[1,0,0]);
 assert.deepEqual([...knock[1].coverage],[0,0,1]);
});
test('trap underlaps the silhouette edge; keyline clears a wider paper margin',()=>{
 const w=25,h=25,mask=new Float32Array(w*h),all=new Float32Array(w*h).fill(1);
 for(let y=6;y<19;y++)for(let x=6;x<19;x++)mask[y*w+x]=1;
 const a={mask:all,print:all},b={mask,print:mask},at=(p,x,y)=>p[0].coverage[y*w+x];
 const trap=compose(a,b,w,h,1,'trap'),knock=compose(a,b,w,h,1,'knock'),line=compose(a,b,w,h,1,'keyline');
 assert.equal(at(trap,6,12),1);assert.equal(at(knock,6,12),0);assert.equal(at(trap,12,12),0);
 assert.equal(at(knock,4,12),1);assert.equal(at(line,4,12),0);
});
test('overprint multiplies on paper and registration displaces only the blue plate',()=>{
 const paper=[243,239,230],a=[255,108,47],b=[61,85,136],mask=new Float32Array([1,1,1]);
 const plates=[{ink:'a',coverage:mask},{ink:'b',coverage:new Float32Array([1,0,0])}];
 const orange=paint([plates[0]],3,1,{paper,a,b},{x:0,y:0});
 const over=paint(plates,3,1,{paper,a,b},{x:1,y:0});
 assert.deepEqual([...over.slice(0,4)],[...orange.slice(0,4)]);
 for(let c=0;c<3;c++)assert(over[4+c]<orange[4+c]);
 assert.deepEqual([...over.slice(8,12)],[...orange.slice(8,12)]);
});
test('screen dots are binary and periodic in a fixed grid',()=>{
 const w=60,h=30,pitch=6,tone=new Float32Array(w*h).fill(.4),print=screen(tone,w,h,pitch,0);
 assert.deepEqual([...new Set(print)].sort(),[0,1]);
 for(let y=0;y<h;y++)for(let x=0;x<w-pitch;x++)assert.equal(print[y*w+x],print[y*w+x+pitch]);
});
