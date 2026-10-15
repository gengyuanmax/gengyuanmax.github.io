import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import {rhythm,lineHeight,font} from '../scripts/rhythm.mjs';
const run=async css=>(await postcss([rhythm()]).process(css,{from:undefined})).css;
test('line-heights become whole rows and keep their proportion as the target',()=>{
 assert.match(lineHeight('1.65'),/round\(nearest, 1\.65 \* 1em, var\(--baseline, 8px\)\)/);
 assert.match(font('500 13px/1.3 var(--x)'),/^500 13px\/max\(.*round\(nearest, 1\.3 \* 1em/);
 assert.equal(lineHeight('normal'),'normal');
});
test('vertical spacing is rounded to rows; horizontal spacing is untouched',async()=>{
 const css=await run('#personal-site .a{padding:18px 20px;margin-top:12px;gap:12px 20px}');
 assert.match(css,/--rb-pt:round\(nearest, 18px/);
 assert.match(css,/padding:calc\(var\(--rb-pt\) - min\(var\(--rb-pt\), var\(--rb-t\)\)\) 20px round\(nearest, 18px/);
 assert.match(css,/margin-top:round\(nearest, 12px/);
 assert.match(css,/gap:round\(nearest, 12px, var\(--baseline, 8px\)\) 20px/);
});
test('horizontal rules use whole pixels and give their width back',async()=>{
 const css=await run('#personal-site .a{border-bottom:1.5px solid red}');
 assert.match(css,/border-bottom:2px solid red/);
 assert.match(css,/--rb-b:2px/);
 assert.match(css,/margin-bottom:calc\(var\(--rb-m\) - var\(--rb-t\) - var\(--rb-b\)/);
});
test('rules outside the site and auto margins are left alone',async()=>{
 assert.equal(await run('.desk{line-height:1.5;margin:12px auto}'),'@property --rb-pt{syntax:"<length-percentage>";inherits:false;initial-value:0px}@property --rb-m{syntax:"<length-percentage>";inherits:false;initial-value:0px}@property --rb-t{syntax:"<length>";inherits:false;initial-value:0px}@property --rb-b{syntax:"<length>";inherits:false;initial-value:0px}.desk{line-height:1.5;margin:12px auto}');
 assert.match(await run('#personal-site .a{margin:0 auto}'),/margin:0 auto/);
});
