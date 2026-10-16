import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {printBaseline} from './helpers/print-baseline.mjs';
test('non-expansion stages preserve historical tone, paper and registration baselines',async()=>{
 const baseline=JSON.parse(await fs.readFile(new URL('./fixtures/print-baseline-a7a7483.json',import.meta.url),'utf8'));
 const order=JSON.parse(await fs.readFile(new URL('./fixtures/research-order-20261014.json',import.meta.url),'utf8'));
 // User explicitly disabled expansion on 2026-10-16. Historical rendered hashes
 // remain untouched; they are no longer the approved screen/print output.
 const actual=await printBaseline(),expected={...baseline.results,...order.results};
 const unchanged=Object.keys(expected).filter(k=>/-tone$|-paper$|-affine$/.test(k));
 assert.ok(unchanged.length>=10);
 for(const key of unchanged)assert.equal(actual[key],expected[key],key);
});
