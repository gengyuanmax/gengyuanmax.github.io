import {groupInkRects} from '../design/print-pipeline/ink-rects';
import {unionInkCoverage} from '../design/print-pipeline/ink-group';
import {printRule,ruleVersion,pressSettings,elementPress} from '../design/print-pipeline/index';
import {paintAlpha,alphaMaskBlob} from '../design/print-pipeline/browser';
import {resolve,type DesignConfig} from '../design/settings';
import type {Rect} from '../design/reading-route';
/** One renderer for every printed non-text mark on the site: guide lines, CSS rules and
 * borders, bars, ticks and small ink blocks, each printed through `rule-v1` on the
 * page's sheet. Lines are painted straight into small canvases (no encoding); marks that
 * must stay CSS boxes (pseudo bars, ink blocks) receive a printed mask. */
function rule(width:number,height:number,origin:{x:number;y:number},dpr:number,config:DesignConfig,pad:number){
 const s=resolve(config).values,p=elementPress(pressSettings(s,'fine'),'guide','field');
 const transfer={grain:p.grain,starve:p.starve,holes:p.holes,band:p.band};
 return printRule(width,height,dpr,{seed:s.seed,origin:{x:Math.round(origin.x*dpr)/dpr,y:Math.round(origin.y*dpr)/dpr}},transfer,pad);
}
const masks=new Map<string,Promise<string>>();
export function ruleMask(width:number,height:number,origin:{x:number;y:number},dpr:number,config:DesignConfig,pad=0){
 const key=JSON.stringify([ruleVersion,Math.round(width*dpr),Math.round(height*dpr),Math.round(origin.x*dpr),Math.round(origin.y*dpr),dpr,resolve(config).values.seed,pad]);
 let url=masks.get(key);
 if(!url){const r=rule(width,height,origin,dpr,config,pad);url=alphaMaskBlob(r.alpha,r.width,r.height);if(masks.size>300)masks.clear();masks.set(key,url);}
 return url;
}
export type InkRect=Rect&{color?:string};
const rgbOf=(c:string):[number,number,number]=>{const m=c.match(/[\d.]+/g)||['0','0','0'];return [+m[0],+m[1],+m[2]];};
/** Draw `rects` (layer coordinates, CSS px) into `layer`. `origin` is the layer's position on the page sheet. */
export function paintGuides(layer:HTMLElement,rects:InkRect[],origin:{x:number;y:number},config:DesignConfig){
 const dpr=Math.max(1,devicePixelRatio||1),pad=1,existing=[...layer.querySelectorAll<HTMLCanvasElement>(':scope > canvas.he-guide')],ink=getComputedStyle(layer).color;
 const groups=groupInkRects(rects.map(r=>{const vertical=r.height>=r.width;return {source:r,x:r.x-(vertical?pad:0),y:r.y-(vertical?0:pad),width:r.width+(vertical?pad*2:0),height:r.height+(vertical?0:pad*2),color:r.color||ink};}));
 groups.forEach((group,i)=>{
  const x=Math.min(...group.map(r=>r.x)),y=Math.min(...group.map(r=>r.y)),width=Math.max(...group.map(r=>r.x+r.width))-x,height=Math.max(...group.map(r=>r.y+r.height))-y;
  const el=existing[i]||layer.appendChild(Object.assign(document.createElement('canvas'),{className:'he-guide'}));
  el.setAttribute('aria-hidden','true');el.dataset.level=String(Math.min(...group.map(r=>r.source.level)));
  const key=JSON.stringify([ruleVersion,'same-ink-union',group,origin,dpr,resolve(config).values.seed]);
  el.style.cssText=`left:${x}px;top:${y}px;width:${width}px;height:${height}px`;
  if(el.dataset.key===key)return;
  const fragments=group.map(r=>{const m=rule(r.source.width,r.source.height,{x:origin.x+r.source.x,y:origin.y+r.source.y},dpr,config,pad);return {coverage:m.alpha,width:m.width,height:m.height,x:(r.x-x)*dpr,y:(r.y-y)*dpr,drawWidth:r.width*dpr,drawHeight:r.height*dpr};});
  const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
  paintAlpha(el,unionInkCoverage(fragments,w,h),w,h,rgbOf(group[0].color));el.dataset.key=key;
 });
 existing.slice(groups.length).forEach(el=>el.remove());
}
