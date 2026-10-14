import {test} from 'node:test';
import assert from 'node:assert/strict';
import {currentPreview,previewViewport,previewStorageKey,defaultPreviewMode} from '../src/design/preview-state.ts';
const saved={version:1,global:{homeSectionGap:56},areas:{},elements:{}};
test('standalone current preview retains valid unsaved changes, with safe fallback for old or broken storage',()=>{
 const draft=structuredClone(saved);draft.global.homeSectionGap=64;
 const storage={getItem:key=>key===previewStorageKey?JSON.stringify(draft):null};
 assert.equal(currentPreview(saved,storage).config.global.homeSectionGap,64);
 assert.equal(currentPreview(saved,storage).unsaved,true);
 for(const raw of [null,'{broken',JSON.stringify({...saved,global:{homeSectionGap:9999}})]){
  const state=currentPreview(saved,{getItem:()=>raw});assert.equal(state.config.global.homeSectionGap,56);assert.equal(state.unsaved,false);
 }
});
test('the master defaults to 1440 regardless of available room; responsive widths are explicit checks',()=>{
 assert.equal(defaultPreviewMode,'fit');
 assert.deepEqual(previewViewport(defaultPreviewMode,375,375),{width:1440,scale:375/1440});
 assert.deepEqual(previewViewport('window',1130,1440),{width:1440,scale:1130/1440});
 assert.deepEqual(previewViewport('window',784,784),{width:784,scale:1});
 assert.deepEqual(previewViewport('fit',784,784),{width:1440,scale:784/1440});
 assert.deepEqual(previewViewport('375',1130,1440),{width:375,scale:1});
});
