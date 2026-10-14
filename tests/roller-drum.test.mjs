import test from 'node:test';
import assert from 'node:assert/strict';
import {sheetRoller,rollerDrum} from '../src/design/print-pipeline/sheet.ts';

test('roller bands do not depend on page length, so phone and desktop share them',()=>{
 for(const y of [0,100,700,1439,2000,5000])
  assert.equal(sheetRoller({seed:7,origin:{x:0,y:0},height:1437},y),sheetRoller({seed:7,origin:{x:0,y:0},height:3879},y));
});
test('the drum runs on past the canvas without a clamp or a seam',()=>{
 const sheet={seed:7,origin:{x:0,y:0}},values=[];
 for(let y=0;y<rollerDrum*3;y+=1)values.push(sheetRoller(sheet,y));
 let step=0;for(let i=1;i<values.length;i++)step=Math.max(step,Math.abs(values[i]-values[i-1]));
 assert.ok(step<.05,`roller jumps by ${step}`);
 const tail=values.slice(rollerDrum+200,rollerDrum*2);assert.ok(Math.max(...tail)-Math.min(...tail)>.05,'roller is flat past the first drum');
});
