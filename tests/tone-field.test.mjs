import test from 'node:test';
import assert from 'node:assert/strict';
import {makeToneField,toneSettings,grayscaleTone} from '../src/design/tone-field.ts';
import {screenPlate,pressSettings} from '../src/design/press-material.ts';
import {defaults} from '../src/design/settings.ts';
const n=240,mask=new Float32Array(n*n).fill(1),s=toneSettings(defaults);
test('plane source varies across horizontal, vertical and diagonal samples before screening',()=>{
 const field=makeToneField(mask,n,n,1,'plane',s,17);
 for(const sample of [i=>field[120*n+i],i=>field[i*n+120],i=>field[i*n+i]]){
  const values=Array.from({length:n},(_,i)=>sample(i));assert(Math.max(...values)-Math.min(...values)>.035);
 }
 assert.deepEqual(field,makeToneField(mask,n,n,1,'plane',s,17));
 assert.notDeepEqual(field,makeToneField(mask,n,n,1,'plane',s,18));
 assert(Math.min(...field)>=s.planeMin-1e-6);assert(Math.max(...field)<=s.planeMax+1e-6);
 const printed=screenPlate(field,n,n,'b',{...pressSettings(defaults),edge:0},1);
 const density=(x,y)=>{let sum=0;for(let j=y;j<y+24;j++)for(let i=x;i<x+24;i++)sum+=printed[j*n+i];return sum/576;};
 assert(Math.abs(density(24,24)-density(188,188))>.025,'AM coverage follows the source tone');
});
test('sphere uses the shared light, preserves its silhouette and can be exported as gray pixels',()=>{
 const circle=Float32Array.from(mask,(_,i)=>Math.hypot(i%n-120,Math.floor(i/n)-120)<100?1:0);
 const field=makeToneField(circle,n,n,1,'sphere',{...s,noise:0},5);
 assert(field[75*n+75]<field[170*n+170],'upper-left light uses smaller dots');
 assert.equal(field[0],0);
 const rotated=makeToneField(circle,n,n,1,'sphere',{...s,light:45,noise:0},5);
 assert(rotated[75*n+75]>rotated[170*n+170]);
 const gray=grayscaleTone(field);assert.equal(gray[0],255);assert(gray[(75*n+75)*4]>gray[(170*n+170)*4]);
 assert.equal(makeToneField(circle,n,n,1,'sphere',{...s,exposure:0},5).some(v=>v!==0),false);
});
