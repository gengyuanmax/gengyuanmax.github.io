import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4321';
for(const path of ['/','/design/','/src/client/studio.ts','/src/client/preview.ts','/src/client/artifacts.ts','/src/client/home-branches.ts','/src/styles/studio.css','/images/portrait-print.webp','/images/portrait-review.webp']){
 const response=await fetch(origin+path);assert.equal(response.status,200,path);await response.arrayBuffer();console.log('HTTP 200',path);
}
for(const name of ['layout','navigation','home','portrait','composition','material','emphasis']){
 const response=await fetch(origin+'/design/'+name+'/',{redirect:'manual'});
 assert.equal(response.status,302,name);assert.equal(response.headers.get('location'),'/design/');
}
const html=await(await fetch(origin+'/design/')).text();
assert(html.includes('个人主页 · 1440 主版'));
assert(html.includes('data-studio-view="desk"'));
const standalone=await(await fetch(origin+'/design/?view=preview')).text();
assert(standalone.includes('data-studio-view="preview"'));
assert(standalone.includes('value="fit" selected'));
assert(html.includes('value="fit" selected'));
assert(!/href="\/design\/(?:layout|home|navigation|portrait|composition|material|emphasis)\//.test(html));
const token=html.match(/name="design-token" content="([^"]+)"/)?.[1];assert(token&&token!=='__DESIGN_TOKEN__');
const read=async()=>await(await fetch(origin+'/__design/config')).json();
const original=await read();
const post=async(body,auth=true)=>fetch(origin+'/__design/config',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,...(auth?{'X-Design-Token':token}:{})},body:JSON.stringify(body)});
const expectStatus=async(response,expected)=>assert.equal(response.status,expected,await response.text());
assert.equal((await post(original,false)).status,403);
assert.equal((await post({...original,global:{grain:999}})).status,400);
assert.deepEqual(await read(),original);
try{
 const changed=structuredClone(original);changed.elements['home-portrait']={...(changed.elements['home-portrait']||{}),grain:0};
 await expectStatus(await post(changed),200);assert.deepEqual(await read(),changed);
}finally{if(JSON.stringify(await read())!==JSON.stringify(original))await expectStatus(await post(original),200);}
assert.deepEqual(await read(),original);
console.log('Save endpoint: unauthorized and invalid writes rejected; local override round-trip passed; original config restored.');
