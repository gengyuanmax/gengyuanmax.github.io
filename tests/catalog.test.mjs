import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chronological,artifactGroups,preferredResource,resourceEntries,projectsForPillar} from '../src/data/catalog.ts';
const records=[
 {id:'undated',publishedAt:null,categories:['article']},
 {id:'older',publishedAt:'2024-03-01',categories:['library','demo']},
 {id:'latest',publishedAt:'2026-10-01',categories:['demo','article']},
 {id:'same-day',publishedAt:'2026-10-01',categories:['article']},
 {id:'unclassified',publishedAt:null,categories:[]},
];
const ids=entries=>entries.map(item=>item.id);
test('chronology is newest first, stable on ties, with unknown dates last and source records unchanged',()=>{
 const before=structuredClone(records);
 assert.deepEqual(ids(chronological(records)),['latest','same-day','older','undated','unclassified']);
 assert.deepEqual(records,before);
 for(const publishedAt of ['2026-02-30','2026/01/01','not-a-date'])assert.throws(()=>chronological([{...records[0],publishedAt}]));
});
test('category regrouping preserves chronological order and shows each work once',()=>{
 const groups=artifactGroups(records,'category');
 assert.deepEqual(groups.map(g=>[g.key,ids(g.entries)]),[
  ['demo',['latest']],['article',['same-day','undated']],['library',['older']],['pending',['unclassified']],
 ]);
 assert.equal(new Set(groups.flatMap(g=>ids(g.entries))).size,records.length);
 // A cross-category work remains discoverable through its secondary category.
 assert.deepEqual(ids(artifactGroups(records,'date','demo')[0].entries),['latest','older']);
 assert.deepEqual(artifactGroups(records,'category','demo').map(g=>[g.key,ids(g.entries)]),[['demo',['latest','older']]]);
 assert.deepEqual(artifactGroups(records,'category','missing'),[]);
});
test('resource selection prefers a work page, then real external resources, and never invents a link',()=>{
 assert.deepEqual(preferredResource({page:'/works/example/',arxiv:'https://arxiv.org/abs/example',github:'https://github.com/example/repo'}),{kind:'page',href:'/works/example/'});
 assert.equal(preferredResource({github:'https://github.com/example/repo',arxiv:'https://arxiv.org/abs/example'}).kind,'arxiv');
 assert.equal(preferredResource(),null);
 for(const href of ['javascript:alert(1)','data:text/html,test','//other.example','/\\other.example','https://','https://example.org/\nnext'])assert.equal(preferredResource({page:href}),null);
 assert.deepEqual(resourceEntries({page:'javascript:alert(1)',github:'https://github.com/example/repo'}),[{kind:'github',href:'https://github.com/example/repo'}]);
});
test('featured undated work leads the default view without changing dates or category discovery',()=>{
 const selected={id:'print-lab',publishedAt:null,categories:['demo','article'],featured:true};
 const catalog=[...records,selected];
 assert.deepEqual(ids(artifactGroups(catalog,'date')[0].entries),['print-lab','latest','same-day','older','undated','unclassified']);
 assert.equal(selected.publishedAt,null);
 assert.deepEqual(ids(artifactGroups(catalog,'date','article')[0].entries),['print-lab','latest','same-day','undated']);
 assert.equal(artifactGroups(catalog,'category').flatMap(group=>group.entries).filter(item=>item.id==='print-lab').length,1);
});
test('research membership uses one primary pillar; secondary themes do not duplicate a project',()=>{
 const projects=[{id:'one',primaryTheme:'benchmarking',themes:['benchmarking','machines']},{id:'two',primaryTheme:'machines',themes:['machines','applications']}];
 assert.deepEqual(ids(projectsForPillar(projects,'benchmarking')),['one']);
 assert.deepEqual(ids(projectsForPillar(projects,'machines')),['two']);
 assert.deepEqual(projectsForPillar(projects,'applications'),[]);
});
