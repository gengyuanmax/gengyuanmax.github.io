/** Development preview state shared by the desk and its standalone link. */
import {mainVersion,designCanvas} from '../config/main-version.ts';
import {mainDesignConfig,validateConfig,type DesignConfig} from './settings.ts';
export const defaultPreviewMode='fit';
export const previewStorageKey=mainVersion+'-draft';
export function currentPreview(saved:DesignConfig,storage:Pick<Storage,'getItem'>){
 const baseline=mainDesignConfig(saved);
 try{
  const raw=storage.getItem(previewStorageKey);if(!raw)return {config:baseline,unsaved:false};
  const input=JSON.parse(raw);validateConfig(input);const config=mainDesignConfig(input);
  return {config,unsaved:JSON.stringify(config)!==JSON.stringify(baseline)};
 }catch{return {config:baseline,unsaved:false};}
}
export function previewViewport(mode:string,available:number,windowWidth:number){
 const width=mode==='window'?windowWidth:mode==='fit'?designCanvas.width:mode==='full'?available:Number(mode);
 const safeWidth=Math.max(1,width);
 return {width:safeWidth,scale:['window','fit'].includes(mode)?Math.min(1,Math.max(1,available)/safeWidth):1};
}
