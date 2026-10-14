import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,validateConfig,resolve,cssVariables,editorialBounds,getPalette,mainDesignConfig,activeParameter} from '../src/design/settings.ts';
import {renderPrint,separatePlates,cropRect} from '../src/design/print.ts';
const config=()=>({version:1,global:{palette:'blueVermilion',grain:.1},areas:{home:{grain:.2}},elements:{'home-portrait':{grain:0}}});
test('inheritance preserves zero, follows global edits, and restores parents after reset',()=>{
 const c=config();validateConfig(c);
 assert.equal(resolve(c,'home','home-portrait').values.grain,0);
 assert.equal(resolve(c,'home','home-portrait').sources.grain,'element:home-portrait');
 c.global.palette='pinkBlue';assert.equal(resolve(c,'home','home-portrait').values.palette,'pinkBlue');
 delete c.elements['home-portrait'].grain;assert.equal(resolve(c,'home','home-portrait').values.grain,.2);
 delete c.areas.home.grain;assert.equal(resolve(c,'home','home-portrait').values.grain,.1);
 assert.equal(resolve(c,'research').values.grain,.1);
});
test('invalid keys, scopes, targets, nonfinite and out-of-range values fail closed',()=>{
 for(const mutate of [c=>c.global.grain=NaN,c=>c.global.grain=99,c=>c.global.palette='made-up',c=>c.elements['home-name']={displayFont:'instrument'},c=>c.elements['home-name']={printPitch:6},c=>c.areas.unknown={},c=>c.global.arbitraryCss='red',c=>c.elements.missing={}]){
  const c=config();mutate(c);assert.throws(()=>validateConfig(c));
 }
 assert.throws(()=>validateConfig(null));assert.throws(()=>validateConfig({version:1,global:[],areas:{},elements:{}}));
});
test('palette references resolve coherent paper, text and ink roles',()=>{
 const css=cssVariables({palette:'pinkBlue',geometryStroke:3});
 assert.equal(css['--paper'],'#f3f1e9');assert.equal(css['--blue-ink'],'#173d9a');assert.equal(css['--geometry-stroke'],'3px');
 assert.equal(css['--display-face'],undefined);
 const c=config();c.global.palette='pinkBlue';c.palettes={pinkBlue:{primary:'#123456'}};validateConfig(c);
 assert.equal(cssVariables({palette:'pinkBlue'},c)['--blue-ink'],'#123456');
 assert.equal(cssVariables({palette:'blueVermilion'},c)['--blue-ink'],'#123456','local palette requests keep the global ink pair');
 c.palettes.pinkBlue.primary='url(https://example.org)';assert.throws(()=>validateConfig(c));
});
function solid(value,alpha=255){const data=new Uint8Array(48*48*4);for(let i=0;i<data.length;i+=4)data.set([value,value,value,alpha],i);return {width:48,height:48,data};}
const inkCoverage=p=>p.data.reduce((sum,v,i)=>sum+(i%4===3?v:0),0);
test('screening follows source tone and alpha, with clean empty highlights',()=>{
 const s={...defaults,grain:0,starvation:0,banding:0,edgeFade:0};
 for(const printMethod of ['am','lines','hatch','benday','bayer','fs','fm','threshold']){
  assert.equal(inkCoverage(renderPrint(solid(255),{...s,printMethod})),0,printMethod);
  assert(inkCoverage(renderPrint(solid(0),{...s,printMethod}))>0,printMethod);
  assert.equal(inkCoverage(renderPrint(solid(0,0),{...s,printMethod})),0,printMethod);
 }
});
test('shared print renderer reproduces seeds and responds to independent press settings',()=>{
 const input=solid(120),s={...defaults,grain:.2,starvation:.4,banding:.2};
 assert.deepEqual(renderPrint(input,s),renderPrint(input,s));
 for(const override of [{seed:99},{printAngle:60},{printMethod:'lines'},{registration:0,registrationY:7},{starvation:0},{banding:0},{blend:'normal'},{dotShape:'square'},{dotGain:.4}])
  assert.notDeepEqual(renderPrint(input,s),renderPrint(input,{...s,...override}),JSON.stringify(override));
});
test('colour separation retains channel information; duotone uses luminance',()=>{
 const red={width:1,height:1,data:new Uint8Array([255,0,0,255])},green={width:1,height:1,data:new Uint8Array([0,130,0,255])};
 const sepA=separatePlates(red,{...defaults,inkMode:'separated'}),sepB=separatePlates(green,{...defaults,inkMode:'separated'});
 assert(Math.abs(sepA[0][0]-sepB[0][0])>.8);
 const duoA=separatePlates(red,{...defaults,inkMode:'two'}),duoB=separatePlates(green,{...defaults,inkMode:'two'});
 assert(Math.abs(duoA[0][0]-duoB[0][0])<.004);
});
test('editorial overrides stay on the grid and cannot silently add columns',()=>{
 const c=config();c.elements['artifact-b']={itemSpan:4};assert.throws(()=>validateConfig(c));
 c.elements['artifact-b']={itemStart:9,itemSpan:4,itemOffset:0};validateConfig(c);
 assert.equal(resolve(c,'artifacts','artifact-b').values.itemOffset,0);
 assert.equal(resolve(c,'artifacts','artifact-a').values.itemSpan,8);
 assert.deepEqual(editorialBounds(c,'artifact-a'),{startMin:1,startMax:1,spanMax:8});
 c.elements['artifact-b'].itemStart=8;assert.throws(()=>validateConfig(c),/overlap|重叠/);
 c.elements['artifact-b'].itemStart=1.5;assert.throws(()=>validateConfig(c));
});
test('crop keeps focal point inside original at extremes',()=>{
 for(const x of [0,1])for(const y of [0,1]){
  const rect=cropRect(768,1024,{...defaults,imageZoom:1.8,imageX:x,imageY:y});
  assert(rect.x>=0&&rect.y>=0);assert(rect.x+rect.width<=768);assert(rect.y+rect.height<=1024);
 }
});

test('legacy text and rule colours cannot introduce inks outside the selected pair',()=>{
 const c=config();c.palettes={blueVermilion:{text:'#000000',muted:'#777777',rule:'#999999',primary:'#283eb5'}};
 const p=getPalette(c,'blueVermilion');
 assert.equal(p.text,p.primary);assert.equal(p.muted,p.primary);assert.equal(p.rule,p.primary);
 const css=cssVariables({palette:'blueVermilion'},c);
 for(const role of ['--ink','--muted-ink','--rule-ink'])assert.equal(css[role],'var(--blue-ink)');
});


test('archived drafts converge to the selected main version without losing current adjustments',()=>{
 const old=config();Object.assign(old.global,{homeComposition:'interlock',homeSectionGap:64,homeBrandSize:60});
 old.elements['home-name']={titleTreatment:'dotted'};
 old.elements['home-bridge']={grain:.4};
 const before=structuredClone(old),next=mainDesignConfig(old);
 assert.deepEqual(old,before,'normalizing a draft must not mutate its source');
 assert.deepEqual(mainDesignConfig(next),next,'normalization is idempotent');
 assert.equal(next.global.homeSectionGap,64);assert.equal(next.global.homeBrandSize,60);
 assert.equal(next.elements['home-name'].titleTreatment,'dotted');
 assert.equal(next.elements['home-bridge'],undefined);
 for(const key of ['navigationStyle','homeComposition','portraitMaterial','compositionOperation','compositionShape','rhythm']){
  assert.equal(resolve(next).sources[key],'selected');assert.equal(activeParameter(key,resolve(next).values,'global'),false);
 }
 validateConfig(next);
});
