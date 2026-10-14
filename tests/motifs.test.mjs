import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,validateConfig,resolve} from '../src/design/settings.ts';
import {motifMarkup} from '../src/design/motifs.ts';

test('decorative plates retain separate ink roles and unique fragment references',()=>{
 for(const kind of ['orbit','earth','windows','sequence']){
  const markup=motifMarkup(defaults,`test-${kind}`,kind);
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const m of markup.matchAll(/url\(#([^\)]+)\)/g))assert(ids.includes(m[1]),m[1]);
  assert.match(markup,/fill="var\(--red-ink\)"/);
  assert.match(markup,/fill="var\(--blue-ink\)"/);
  assert.doesNotMatch(markup,/<pattern[^>]*>[^<]*<circle[^>]*fill="currentColor"/);
 }
});
test('coverage is an area fraction; zero coverage clears screened marks',()=>{
 const markup=motifMarkup({...defaults,fieldCoverage:0},'empty','orbit');
 assert.equal([...markup.matchAll(/<pattern[^>]*><circle[^>]*r="0"/g)].length,2);
 const a=motifMarkup({...defaults,fieldPitch:10,fieldCoverage:.25},'a','orbit');
 const b=motifMarkup({...defaults,fieldPitch:10,fieldCoverage:1},'b','orbit');
 const radius=m=>Number(m.match(/<pattern[^>]*><circle[^>]*r="([^"]+)"/)[1]);
 assert.equal(radius(b),radius(a)*2);
});
test('element overrides stay scoped and overlap moves shapes together',()=>{
 const c={version:1,global:{fieldCoverage:.4},areas:{research:{fieldPitch:8}},elements:{'mark-mosaic':{fieldCoverage:0},'mark-avila':{fieldAngle:30}}};
 validateConfig(c);
 assert.equal(resolve(c,'research','mark-mosaic').values.fieldCoverage,0);
 assert.equal(resolve(c,'research','mark-avila').values.fieldCoverage,.4);
 assert.equal(resolve(c,'research','mark-mosaic').values.fieldPitch,8);
 const distance=overlap=>{
  const m=motifMarkup({...defaults,fieldOverlap:overlap},'sample','orbit');
  const a=Number(m.match(/he-field-a"><circle cx="([^"]+)"/)[1]);
  const b=Number(m.match(/he-field-b"[^>]*><circle cx="([^"]+)"/)[1]);
  return a-b;
 };
 assert(distance(1)<distance(0));
 assert.equal(motifMarkup(defaults,'stable','sequence'),motifMarkup(defaults,'stable','sequence'));
});
