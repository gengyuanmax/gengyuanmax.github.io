// Capture a 1440px desktop Home screenshot after fonts/materials settle, then pass its path.
// No update flag: a new baseline must be intentionally reviewed and replaced.
import fs from 'node:fs';
import sharp from 'sharp';
const input=process.argv[2];
if(!input)throw new Error('Usage: npm run test:name-visual -- /absolute/path/to/1440px-home.png');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/name-v3.json','utf8'));
const meta=await sharp(input).metadata();
if(meta.width!==fixture.viewport.width)throw new Error('Expected a 1440 CSS px screenshot at DPR 1');
const actual=await sharp(input).extract(fixture.crop).removeAlpha().raw().toBuffer();
const expected=await sharp('tests/fixtures/name-v3.png').removeAlpha().raw().toBuffer();
if(actual.length!==expected.length)throw new Error('Snapshot dimensions differ');
let changed=0;for(let i=0;i<actual.length;i+=3)if(Math.max(...[0,1,2].map(c=>Math.abs(actual[i+c]-expected[i+c])))>20)changed++;
const fraction=changed/(actual.length/3);
if(fraction>.005){await sharp(input).extract(fixture.crop).png().toFile('/tmp/name-visual-actual.png');throw new Error(`Name visual regression: ${(fraction*100).toFixed(2)}% pixels changed (limit 0.5%). Actual: /tmp/name-visual-actual.png`);}
console.log(`Name visual snapshot passed: ${(fraction*100).toFixed(3)}% changed pixels.`);
