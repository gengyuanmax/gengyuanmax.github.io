import test from 'node:test';
import assert from 'node:assert/strict';
import {latticeValue,rng,salt} from '../src/design/print-pipeline/noise.ts';
test('the numeric lattice hash equals the original string-salted value exactly',()=>{
 for(const seed of [0,5,23,1337,4294967295,salt(23,'sheet-ink')])for(let x=-130;x<=130;x+=7)for(let y=-1210;y<=99999;y+=997)
  assert.equal(latticeValue(seed,x,y),rng(salt(seed,`${x}:${y}`))(),`${seed} ${x}:${y}`);
});
