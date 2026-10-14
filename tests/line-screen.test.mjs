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
