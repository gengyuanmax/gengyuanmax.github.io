import test from 'node:test';
import assert from 'node:assert/strict';
import {definePrintElement,screenPrintElement,paintMaterial,pressSettings} from '../src/design/print-pipeline/index.ts';
import {createPrintMount} from '../src/design/print-pipeline/mount.ts';
import {defaults} from '../src/design/settings.ts';
test('four named ink plates screen, register and composite deterministically without a/b aliases',()=>{
 const ids=['blue','orange','yellow','green'],n=24;
 const p={...pressSettings(defaults),angles:{blue:15,orange:75,yellow:0,green:45},shapes:Object.fromEntries(ids.map(id=>[id,'round'])),registration:{green:{x:2,y:1}},edge:0,grain:0,starve:0,holes:0};
 const mask=new Float32Array(n*n).fill(1),tone=new Float32Array(n*n).fill(.6);
 const plates=ids.map(plate=>({ink:plate,coverage:screenPrintElement(definePrintElement({id:plate,profile:'material-v1',source:{kind:'shape',mask,tone},width:n,height:n,scale:1,plate,press:p}))}));
 const inks={blue:[40,62,181],orange:[207,80,55],yellow:[230,200,20],green:[40,160,80],paper:[255,255,255]};
 const rendered=paintMaterial(plates,n,n,inks,p);
 assert.deepEqual(rendered,paintMaterial(plates,n,n,inks,p));
 assert.notDeepEqual(rendered,paintMaterial(plates.slice(0,3),n,n,inks,p));
 assert.notDeepEqual(rendered,paintMaterial(plates,n,n,inks,{...p,registration:{}}));
});
test('source declarations reject mismatched arrays and unregistered ink; inserts preserve original identity',()=>{
 const base={id:'sample',profile:'material-v1',source:{kind:'photo',mask:new Float32Array(4),tone:new Float32Array(4)},width:2,height:2,scale:1,plate:'a',press:pressSettings(defaults)};
 assert.throws(()=>definePrintElement({...base,width:3}),/dimensions/);
 assert.throws(()=>definePrintElement({...base,plate:'yellow'}),/Unregistered/);
 assert.equal(screenPrintElement(definePrintElement({id:'insert',profile:'insert',source:{kind:'graphic',src:'/original.svg'}})),'/original.svg');
});
test('mount rejects out-of-order completion, preserves last success after failure, and allows retry',()=>{
 const mount=createPrintMount();let visible='fallback';
 const first=mount.begin('one'),second=mount.begin('two');
 assert.equal(first.commit(()=>visible='one'),false);assert.equal(visible,'fallback');
 assert(second.commit(()=>visible='two'));assert.equal(visible,'two');
 assert.throws(()=>mount.begin('failed').commit(()=>{throw Error('prepare failed');}));assert.equal(visible,'two');
 assert(mount.begin('failed').commit(()=>visible='retry'));assert.equal(visible,'retry');
 assert.equal(mount.begin('failed'),null);
 const pending=mount.begin('pending');assert.equal(mount.begin('failed'),null);
 assert.equal(pending.commit(()=>visible='stale'),false);assert.equal(visible,'retry');
 mount.invalidate();assert(mount.begin('failed'));
});
test('solid DOM lettering keeps its full rectangular material carrier before browser glyph clipping',()=>{
 const n=40,flat=new Float32Array(n*n).fill(1),press=pressSettings(defaults);
 const printed=screenPrintElement(definePrintElement({id:'solid-title',profile:'material-v1',source:{kind:'text',mask:flat,tone:flat},width:n,height:n,scale:1,plate:'a',press,solid:true}));
 assert.deepEqual(printed,flat);
});
