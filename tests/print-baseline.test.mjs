import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {printBaseline} from './helpers/print-baseline.mjs';
test('migration preserves the pre-migration a7a7483 ink, tone, state, paper and PNG outputs exactly',async()=>{
 const baseline=JSON.parse(await fs.readFile(new URL('./fixtures/print-baseline-a7a7483.json',import.meta.url),'utf8'));
 assert.deepEqual(await printBaseline(),baseline.results);
});
