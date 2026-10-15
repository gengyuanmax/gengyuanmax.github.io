import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const html=await fs.readFile('dist/index.html','utf8');
const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs');
for(const [,id]of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(id),`Missing target: ${id}`);
for(const [,value]of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))for(const id of value.split(/\s+/))assert(ids.includes(id),`Missing ARIA target: ${id}`);
assert.equal((html.match(/data-area-link=/g)||[]).length,4);
assert.equal((html.match(/data-chapter=/g)||[]).length,4);
assert.equal((html.match(/data-content-id="artifact-/g)||[]).length,5);
assert(!html.includes('data-enhanced'),'Static page must remain readable without JS');
assert(!html.includes(' inert'),'Server HTML must not hide sections without JS');
for(const [paragraph]of html.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g))assert((paragraph.match(/class="[^\"]*\bem-ink\b/g)||[]).length<=2,'At most two primary emphases per paragraph');
for(const [block]of html.matchAll(/<(?:h[1-6]|a|nav)\b[^>]*>[\s\S]*?<\/(?:h[1-6]|a|nav)>/g))assert(!/class="[^\"]*\bem-(ink|knock)\b/.test(block),'Do not put print emphasis in headings, navigation or links');
for(const area of html.split(/data-style-area="(?:home|research|artifacts|about)"/).slice(1))assert((area.match(/class="[^\"]*\bem-knock\b/g)||[]).length<=1,'At most one knockout emphasis per area');
for(const phrase of ['Making sense of','A little curiosity','Always curious','Notes from the','Let’s talk'])assert(!html.includes(phrase),`Unapproved legacy copy: ${phrase}`);
assert(html.includes('data-home-layout="main"'),'Approved Home layout must be in static HTML');
const home=html.slice(html.indexOf('id="home"'),html.indexOf('id="research"'));
assert(home.indexOf('he-home-profile')<home.indexOf('he-home-research')&&home.indexOf('he-home-research')<home.indexOf('news-heading'),'Static reading order must match the selected layout');
assert.equal((home.match(/data-memberships=/g)||[]).length,3,'Three research direction links exist before JS');
assert(!home.includes('he-branch-papers'),'Home research presents directions, not project lists');
for(const anchor of ['#benchmarking','#applications','#machines'])assert(home.includes(`href="${anchor}"`),'Direction links target existing research sections');
for(const name of ['design','__design'])await assert.rejects(fs.access(`dist/${name}`));
async function walk(dir){const result=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())result.push(...await walk(file));else result.push(file);}return result;}
const files=await walk('dist');
for(const file of files.filter(f=>/\.(html|js|css)$/.test(f))){const body=await fs.readFile(file,'utf8');assert(!body.includes('X-Design-Token')&&!body.includes('/__design/config')&&!body.includes('本地设计台')&&!body.includes('design:layout-study')&&!body.includes('he-layout-research')&&!body.includes('he-screen-audit-layer')&&!body.includes('homepage-layout-study')&&!body.includes('design-preview=current')&&!body.includes('当前调整预览'),`Authoring code leaked: ${file}`);}
for(const [,src]of html.matchAll(/(?:src|href)="(\/(?:_astro|images)\/[^"?#]+)"/g))await fs.access('dist'+src);
console.log(`Build verified: ${ids.length} unique IDs, four areas, four shortcuts, five interleaved artifacts, no authoring route or editor code.`);

assert(!html.includes('noindex'),'Production homepage must be indexable');
assert(html.includes('<title>Gengyuan Zhang</title>'),'Use the public page title');
assert(html.includes('rel="canonical" href="https://gengyuanmax.github.io/"'));
for(const file of ['.nojekyll','LICENSE','licenses/print-lab.txt','licenses/natural-earth.md','robots.txt','sitemap.xml','404.html','assets/pdf/new_CV.pdf','assets/pdf/ZHANG_cv_2406.pdf'])await fs.access(`dist/${file}`);
for(const file of ['new_CV.pdf','ZHANG_cv_2406.pdf'])assert.deepEqual(await fs.readFile(`dist/assets/pdf/${file}`),await fs.readFile(`assets/pdf/${file}`),'Previously published PDFs must remain byte-identical');
for(const route of ['publications','projects','repositories','cv'])assert((await fs.readFile(`dist/${route}/index.html`,'utf8')).includes('location.replace('));
for(const file of ['index.html','print.html','layout.html','object.html','element.html'])assert.deepEqual(await fs.readFile(`dist/print-lab/${file}`),await fs.readFile(`print-lab/${file}`),'Preserve Print Labs migration exactly');
console.log('Release metadata, old landing redirects, PDF integrity and Print Labs redirects verified.');
