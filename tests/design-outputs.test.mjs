import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Design-tool outputs (Blender marks, the four-ink landscape separation) are committed;
// CI has no Python. design/outputs.json, written by `npm run design`, ties each output to
// the exact inputs that produced it, so a changed generator, source or output fails here.
const manifest=JSON.parse(fs.readFileSync('design/outputs.json','utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
for(const [name,{inputs,outputs}] of Object.entries(manifest)){
 test(`design output ${name} is current`,()=>{
  for(const [path,hash] of Object.entries(inputs))assert.equal(sha(path),hash,`${path} changed since ${name} was generated; run npm run design`);
  for(const [path,hash] of Object.entries(outputs))assert.equal(sha(path),hash,`${path} differs from what npm run design produced; regenerate instead of editing it`);
 });
}
test('every tool-rendered mark and the landscape are covered',()=>{
 assert.deepEqual(Object.keys(manifest).sort(),['home-landscape','mark-icq','mark-meretriever','mark-reexplore','mark-surgeon','paper-vintage']);
});
