import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {printBaseline} from './helpers/print-baseline.mjs';
test('print outputs preserve the migration baseline and the approved research order',async()=>{
 const baseline=JSON.parse(await fs.readFile(new URL('./fixtures/print-baseline-a7a7483.json',import.meta.url),'utf8'));
 const order=JSON.parse(await fs.readFile(new URL('./fixtures/research-order-20261014.json',import.meta.url),'utf8'));
 assert.deepEqual(await printBaseline(),{...baseline.results,...order.results});
});
