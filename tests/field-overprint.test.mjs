import test from 'node:test';
import assert from 'node:assert/strict';
import {renderFieldOriginals} from '../src/design/print-pipeline/field.ts';
import {pressSettings} from '../src/design/print-pipeline/material.ts';
import {onSheet} from '../src/design/print-pipeline/sheet-context.ts';
import {defaults} from '../src/design/settings.ts';

const w=24,h=24,origin={x:0,y:0};
const press=onSheet({...pressSettings(defaults),offset:{x:0,y:0},registration:{a:{x:0,y:0},b:{x:0,y:0}},grain:0,starve:0,holes:0,band:0},23,origin);
const inks={a:[207,80,55],b:[40,62,181],paper:[255,255,255]};
const original=ink=>({ink,coverage:new Float32Array(w*h).fill(1),screened:false,ring:false,kind:'plane',index:0});
const render=items=>renderFieldOriginals(items,w,h,1,origin,press,defaults,inks).pixels;
test('field artwork merges repeated same-ink shapes before compositing',()=>{
 assert.deepEqual(render([original('b'),original('b')]),render([original('b')]));
});
test('field artwork multiplies different inks rather than covering the lower plate',()=>{
 const a=render([original('a')]),b=render([original('b')]),ab=render([original('a'),original('b')]);
 const i=(12*w+12)*4;
 for(let c=0;c<3;c++){
  assert.ok(Math.abs(ab[i+c]-a[i+c]*b[i+c]/255)<=1);
  assert.ok(ab[i+c]<Math.min(a[i+c],b[i+c]));
 }
 assert.deepEqual(ab,render([original('b'),original('a')]));
});

import {composeInkGroup} from '../src/design/print-pipeline/ink-group.ts';
const fragment=(ink,coverage,x=0)=>({ink,coverage:Float32Array.from(coverage),width:coverage.length,height:1,x,y:0,drawWidth:coverage.length,drawHeight:1});
test('separate picture and glyph fragments union blue coverage, including partial edges',()=>{
 const image=fragment('b',[1,.5,0]),text=fragment('b',[.4,1,.7]);
 const together=composeInkGroup([image,text],3,1,inks);
 assert.deepEqual(together,composeInkGroup([fragment('b',[1,1,.7])],3,1,inks));
 assert.deepEqual(together,composeInkGroup([text,image],3,1,inks));
});
test('red artwork survives under a blue glyph while the blue artwork is not printed twice',()=>{
 const red=fragment('a',[1,1]),image=fragment('b',[1,0]),text=fragment('b',[1,1]);
 assert.deepEqual(composeInkGroup([red,image,text],2,1,inks),composeInkGroup([red,text],2,1,inks));
 const combined=composeInkGroup([red,text],2,1,inks);
 assert.equal(combined[0],Math.round(inks.a[0]*inks.b[0]/255));
});
test('moving a title changes placement without shifting the underlying artwork lattice',()=>{
 const art=fragment('b',[1,0,0]),label=fragment('b',[1],2);
 assert.deepEqual(composeInkGroup([art,label],3,1,inks),composeInkGroup([fragment('b',[1,0,1])],3,1,inks));
});
