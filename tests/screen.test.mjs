import test from 'node:test';
import assert from 'node:assert/strict';
import {screen,screenScale,typeScreenLevel} from '../src/design/screen.ts';
import {defaults,resolve,validateConfig,cssVariables} from '../src/design/settings.ts';
import {pressSettings,screenPlate} from '../src/design/press-material.ts';

test('only the three shared tiers set pitch; old element pitch values cannot leak in',()=>{
 const s={...defaults,screenPitch:7.25,compositionPitch:11,fieldPitch:13,titleDotPitch:.105};
 assert.equal(pressSettings(s,'fine').pitch,2);assert.equal(pressSettings(s,'medium').pitch,4);
 for(const font of [96,104.6,126.36,144,180]){
  const a=screen('coarse','a',s,font),b=screen('coarse','b',s,font);
  assert.equal(a.pitch,b.pitch);assert(Number.isInteger(a.pitch));
  assert(a.pitch>=screenScale.medium*1.5);assert(Math.abs(a.pitch-font/16)<=.5);
 }
});
test('all tiers share each ink angle and shape while each ink retains its own setting',()=>{
 const s={...defaults,primaryAngle:75,secondaryAngle:15,primaryDotShape:'square',secondaryDotShape:'round'};
 for(const level of ['fine','medium','coarse']){
  const p=pressSettings(s,level,128);
  assert.deepEqual(p.angles,{a:15,b:75,c:defaults.yellowAngle});assert.deepEqual(p.shapes,{a:'round',b:'square',c:'square'});
  const tone=new Float32Array(64*64).fill(.35),clean={...p,edge:0,gain:0};
  assert.notDeepEqual(screenPlate(tone,64,64,'b',clean),screenPlate(tone,64,64,'b',{...clean,shapes:{...clean.shapes,b:'round'}}));
 }
});
test('legacy local palette and registration overrides cannot split the page into different presses',()=>{
 const c={version:1,global:{palette:'blueVermilion',registration:2,registrationY:1,primaryAngle:75,secondaryAngle:15},areas:{home:{palette:'pinkBlue',registration:3}},elements:{'home-name':{palette:'blackRed',registration:-3,registrationY:-2.5}}};
 validateConfig(c);
 const s=resolve(c,'home','home-name').values;
 assert.equal(s.palette,'blueVermilion');assert.equal(s.registration,2);assert.equal(s.registrationY,1);
 const css=cssVariables(c.areas.home,c);
 assert.equal(css['--blue-ink'],'#283eb5');assert.equal(css['--registration-x'],'2px');
 assert.equal(css['--screen-fine'],'2px');assert.equal(css['--screen-medium'],'4px');assert.equal(css['--screen-coarse'],'0.0625em');
 assert.equal(css['--screen-angle-a'],'15deg');assert.equal(css['--screen-angle-b'],'75deg');
});
test('separate same-ink objects use the same phase at every supported tier',()=>{
 for(const level of ['fine','medium','coarse'])for(const ink of ['a','b']){
  const p={...pressSettings(defaults,level,128),gain:0,edge:0};
  const full=screenPlate(new Float32Array(100*100).fill(.3),100,100,ink,p,2);
  const crop=screenPlate(new Float32Array(32*32).fill(.3),32,32,ink,p,2,{x:12,y:9});
  for(let y=0;y<32;y++)for(let x=0;x<32;x++)assert.equal(crop[y*32+x],full[(y+18)*100+x+24]);
 }
});

test('responsive display names keep a screened plate; only fine text becomes solid',()=>{
 for(const [font,expectedLevel,pitch] of [[126.36,'coarse',8],[100,'coarse',6],[88,'coarse',6],[87,'fine',2],[50.26,'fine',2],[43,'fine',2]]){
  const level=typeScreenLevel(font);
  assert.equal(level,expectedLevel);
  const p=pressSettings(defaults,level,font);
  assert.equal(p.pitch,pitch);
  const mask=screenPlate(new Float32Array(64*64).fill(Math.PI*.34**2),64,64,'b',p,2);
  assert(mask.some(v=>v<.1),'the plate retains open spaces instead of a solid fill');
  assert(mask.some(v=>v>.9),'the plate retains readable ink dots');
 }
 for(const font of [12,15.99,16])assert.equal(typeScreenLevel(font),null);
});
