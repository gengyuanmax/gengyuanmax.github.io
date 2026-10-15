import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {encodeAlphaPNG} from '../src/design/print-pipeline/png.ts';
test('the JS mask encoder writes a valid PNG whose alpha is the mask',async()=>{
 for(const [w,h] of [[1,1],[37,5],[400,300]]){
  const alpha=Uint8Array.from({length:w*h},(_,i)=>(i*37)%256);
  const {data,info}=await sharp(Buffer.from(encodeAlphaPNG(alpha,w,h))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,w);assert.equal(info.height,h);
  for(let i=0;i<w*h;i++)assert.equal(data[i*info.channels+info.channels-1],alpha[i]);
 }
});
