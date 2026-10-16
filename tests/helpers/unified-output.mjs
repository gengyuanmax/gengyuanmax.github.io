import {printBaseline} from './print-baseline.mjs';
import {lineScreen} from '../../src/design/print-pipeline/line-screen.ts';
import {printText} from '../../src/design/print-pipeline/text.ts';
import {printRule} from '../../src/design/print-pipeline/rule.ts';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:Buffer.from(x.buffer,x.byteOffset,x.byteLength)).digest('hex');
export async function unifiedOutput(){
const result=await printBaseline();
for(const texture of ['line','wave','knurl'])for(const finish of ['original','rubbed'])result[`line-${texture}-${finish}`]=hash(lineScreen(4,15,.3,42,.12,.12,'test',texture,finish));
for(const scale of [1,2,3])for(const size of [16,48,96])for(const sheet of [undefined,{seed:42,origin:{x:10,y:20}}]){
 const key=`${scale}-${size}-${!!sheet}`,mask=new Float32Array(64*48).fill(.8);
 result[`text-${key}`]=hash(printText(mask,64,48,scale,42,6,15,{size,dotted:false,radius:.37,transfer:{grain:.1,starve:.1,holes:.03,band:.1}},sheet));
 result[`dots-${key}`]=hash(printText(mask,64,48,scale,42,6,15,{size,dotted:true,radius:.37},sheet));
}
for(const scale of [1,2,3])result[`rule-${scale}`]=hash(printRule(4,80,scale,{seed:42,origin:{x:10,y:20}},{grain:.1,starve:.1,holes:.03,band:.1}).alpha);
return result;
}
