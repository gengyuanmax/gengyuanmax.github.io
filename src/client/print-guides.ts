import {printRule,ruleVersion,pressSettings,elementPress} from '../design/print-pipeline/index';
import {alphaMaskURL} from '../design/print-pipeline/browser';
import {resolve,type DesignConfig} from '../design/settings';
import type {Rect} from '../design/reading-route';
/** One renderer for every guide line on the site (Research and Artifacts reading trees,
 * About timelines): level-weighted rules, each printed through `rule-v1` on the page's
 * sheet. A line's mask is built synchronously and attached with its element, so a line
 * never appears first as flat ink and then changes. */
const cache=new Map<string,string>();
function maskURL(rect:Rect,origin:{x:number;y:number},dpr:number,config:DesignConfig){
 const s=resolve(config).values,p=elementPress(pressSettings(s,'fine'),'guide','field');
 const transfer={grain:p.grain,starve:p.starve,holes:p.holes,band:p.band};
 const sheet={seed:s.seed,origin:{x:Math.round((origin.x+rect.x)*dpr)/dpr,y:Math.round((origin.y+rect.y)*dpr)/dpr}};
 const key=JSON.stringify([ruleVersion,rect.width,rect.height,sheet.origin,dpr,transfer,s.seed]);
 let url=cache.get(key);if(url)return url;
 const {alpha,width,height}=printRule(rect.width,rect.height,dpr,sheet,transfer);
 url=alphaMaskURL(alpha,width,height);
 if(cache.size>400)cache.clear();cache.set(key,url);return url;
}
/** Draw `rects` (layer coordinates, CSS px) into `layer`. `origin` is the layer's position on the page sheet. */
export function paintGuides(layer:HTMLElement,rects:Rect[],origin:{x:number;y:number},config:DesignConfig){
 const dpr=Math.max(1,devicePixelRatio||1),pad=1,existing=[...layer.querySelectorAll<HTMLElement>(':scope > .he-guide')];
 rects.forEach((r,i)=>{
  const vertical=r.height>=r.width,el=existing[i]||layer.appendChild(Object.assign(document.createElement('i'),{className:'he-guide'}));
  el.setAttribute('aria-hidden','true');el.dataset.level=String(r.level);
  const url=maskURL(r,origin,dpr,config);
  el.style.cssText=`left:${r.x-(vertical?pad:0)}px;top:${r.y-(vertical?0:pad)}px;width:${r.width+(vertical?pad*2:0)}px;height:${r.height+(vertical?0:pad*2)}px;-webkit-mask-image:url(${url});mask-image:url(${url})`;
 });
 existing.slice(rects.length).forEach(el=>el.remove());
}
