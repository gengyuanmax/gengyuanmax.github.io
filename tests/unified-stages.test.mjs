import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {transferPlate} from '../src/design/print-pipeline/transfer.ts';

test('all active print families use the actual shared transfer dispatcher',async()=>{
 for(const name of ['text','polygon','line-screen','rule','first-frame','raster-composite']){
  const source=await fs.readFile(`src/design/print-pipeline/${name}.ts`,'utf8');
  assert.match(source,/transferPlate\(/,name);
 }
 assert.equal(transferPlate({kind:'insert',source:'/already-printed.png'}),'/already-printed.png');
});
test('screen and output adapters cannot create press noise or implement ink spreading',async()=>{
 for(const name of ['text','polygon','line-screen','rule','first-frame','material','sheet','raster-composite','browser']){
  const path=`src/design/print-pipeline/${name}.ts`,source=await fs.readFile(path,'utf8'),ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true);
  const forbidden=new Set(['sheetFields','sheetInk','sheetRoller','valueNoise','fbm','lowNoise','spread','spreadRectangle','Math.random']);
  const visit=node=>{if(ts.isCallExpression(node))assert.ok(!forbidden.has(node.expression.getText(ast)),`${name}: press effects belong in Transfer`);ts.forEachChild(node,visit);};visit(ast);
 }
});

test('shared transfer migration preserves every captured pre-migration output exactly',async()=>{
 const {unifiedOutput}=await import('./helpers/unified-output.mjs');
 const before=JSON.parse(await fs.readFile(new URL('./fixtures/pipeline-pre-unification-20261016.json',import.meta.url),'utf8'));
 assert.deepEqual(await unifiedOutput(),before);
});

test('release media cannot select historical print or portrait-flow renderers',async()=>{
 const source=await fs.readFile('scripts/render-media.mjs','utf8');
 assert.doesNotMatch(source,/renderPortraitPlates|renderPrint|portrait-flow|render-portrait-plates/);
 assert.match(source,/renderPortraitComposition\(config\)/);
 assert.match(source,/renderAboutPhoto\(config\)/);
});
