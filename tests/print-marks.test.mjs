import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {printMarks} from './helpers/print-marks.mjs';

// Visual regression for tool-rendered elements (2026-10-26). The fixture is the reviewed
// output; a change here needs an explicitly approved visual change and a new fixture.
test('tool-rendered marks and the four-ink landscape print as reviewed',async()=>{
 const {results}=JSON.parse(fs.readFileSync(new URL('./fixtures/print-marks-20261026.json',import.meta.url),'utf8'));
 const actual=await printMarks();
 for(const [id,hash] of Object.entries(results))assert.equal(actual[id],hash,`${id} printed output changed`);
});
