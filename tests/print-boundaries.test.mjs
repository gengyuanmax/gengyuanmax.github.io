import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {printBoundaries} from './helpers/print-boundaries.mjs';
test('rendering primitives outside the core are limited to the reviewed legacy/source-adapter inventory',async()=>{
 const allowed=JSON.parse(await fs.readFile(new URL('./fixtures/print-legacy-boundaries.json',import.meta.url),'utf8'));
 for(const [path,counts] of Object.entries(await printBoundaries()))for(const [kind,count] of Object.entries(counts))assert(count<=(allowed[path]?.[kind]??0),`${path}: new ${kind} must use print-pipeline or an explicitly reviewed source adapter`);
});
test('active element clients cannot import legacy renderers or private pipeline kernels',async()=>{
 for(const path of ['src/client/research-map.ts','src/client/print-material.ts','src/client/portrait-composition.ts']){
  const code=await fs.readFile(path,'utf8');
  assert(!/from\s+['"][^'"]*\/(?:press-material|print|portrait-flow)['"]/.test(code),path);
  for(const match of code.matchAll(/from\s+['"]([^'"]*print-pipeline\/[^'"]+)['"]/g))assert(/\/(index|browser)(\.ts)?$/.test(match[1]),`${path}: use the public pipeline entry`);
 }
});
