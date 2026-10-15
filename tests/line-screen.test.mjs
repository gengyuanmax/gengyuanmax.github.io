import test from 'node:test';
import assert from 'node:assert/strict';
import {definePrintElement,screenPrintElement} from '../src/design/print-pipeline/index.ts';
const recipe={id:'chapter-indicator',profile:'line-v3',source:{kind:'shape'},pitch:4,angle:15,coverage:.3,seed:42,grain:.12,starvation:.12};
test('line screen is stable for a saved recipe and changes only with its seed',()=>{
 const render=seed=>screenPrintElement(definePrintElement({...recipe,seed}));
 assert.equal(render(42),render(42));
 assert.notEqual(render(42),render(43));
});
test('line recipe rejects nonfinite noise parameters before producing SVG',()=>{
 assert.throws(()=>definePrintElement({...recipe,seed:NaN}),/Invalid line screen/);
});
test('two navigation screens have independent SVG definition IDs',()=>{
 const screens=['research-navigation','about-navigation'].map(id=>screenPrintElement(definePrintElement({...recipe,id})));
 const ids=screens.flatMap(svg=>[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 assert.equal(new Set(ids).size,ids.length);
 for(const svg of screens)for(const [,id] of svg.matchAll(/url\(#([^)]*)\)/g))assert(svg.includes(`id="${id}"`));
});
test('roller textures share the line recipe; the default stays the original line screen',()=>{
 const render=texture=>screenPrintElement(definePrintElement({...recipe,...(texture?{texture}:{})}));
 assert.equal(render(),render('line'));
 assert.notEqual(render('knurl'),render('line'));assert.notEqual(render('wave'),render('line'));
 const knurl=render('knurl');
 for(const [,id] of knurl.matchAll(/url\(#([^)]*)\)/g))assert(knurl.includes(`id="${id}"`));
 assert.equal((knurl.match(/<rect /g)||[]).length,2);
});
