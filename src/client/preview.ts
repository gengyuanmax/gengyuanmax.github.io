import {currentPreview} from '../design/preview-state';
import {initScreenAudit} from './screen-audit';
import {design} from '../config/design';
import {validateConfig,mainDesignConfig,resolve,cssVariables,getPalette,designAttributes,type DesignConfig,type Area} from '../design/settings';
import {inkFilter} from '../design/ink';
import {motifMarkup,type Motif} from '../design/motifs';
const root=document.querySelector<HTMLElement>('#personal-site')!;
const applied=new WeakMap<HTMLElement,string[]>();
initScreenAudit(root);
if(parent!==window)root.dataset.designPreview='true';
function attrs(el:HTMLElement,s:Parameters<typeof designAttributes>[0]){for(const [k,v]of Object.entries(designAttributes(s)))el.setAttribute(k,v);}
function setStyle(el:HTMLElement,values:Parameters<typeof cssVariables>[0],config:DesignConfig){
 for(const key of applied.get(el)||[])el.style.removeProperty(key);
 if(!applied.has(el))for(const key of Object.keys(cssVariables(resolve(design).values)))el.style.removeProperty(key);
 const css=cssVariables(values,config);Object.entries(css).forEach(([k,v])=>el.style.setProperty(k,v));applied.set(el,Object.keys(css));
}
function apply(input:DesignConfig,grid:boolean,flow:boolean,proof:unknown,audit:boolean){
 validateConfig(input);const config=mainDesignConfig(input);
 const global=resolve(config).values;setStyle(root,global,config);attrs(root,global);root.dataset.grid=String(grid);root.dataset.flow=String(flow);
 root.dataset.screenAudit=String(audit);root.dataset.typeProof=!audit&&['red','blue','yellow'].includes(String(proof))?String(proof):'overprint';
 document.body.style.setProperty('--paper',getPalette(config,global.palette).paper);
 root.querySelectorAll<HTMLElement>('[data-style-area]').forEach(el=>{const area=el.dataset.styleArea as Area;setStyle(el,config.areas[area]||{},config);attrs(el,resolve(config,area).values);});
 root.querySelectorAll<HTMLElement>('[data-style-element]').forEach(el=>{const id=el.dataset.styleElement!,area=el.dataset.styleAreaOwner as Area;const s=resolve(config,area,id).values;setStyle(el,s,config);attrs(el,s);});
 root.querySelectorAll<SVGElement>('[data-ink-filter]').forEach(el=>{const id=el.dataset.inkFilter!;el.innerHTML=inkFilter(resolve(config,el.dataset.inkArea as Area,id).values,`ink-${id}`);});
 root.querySelectorAll<SVGElement>('[data-print-field]').forEach(el=>{const id=el.dataset.printField!;el.innerHTML=motifMarkup(resolve(config,el.dataset.printArea as Area,id).values,id,el.dataset.printKind as Motif);});
 root.querySelectorAll('.he-page').forEach(page=>page.querySelectorAll<HTMLElement>('[data-flow-label]').forEach((el,i)=>{el.dataset.flowNumber=String(i+1);}));
 root.dispatchEvent(new CustomEvent('design:updated',{detail:config}));root.dispatchEvent(new CustomEvent('design:proof-updated'));
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent)return;
 if(event.data?.type==='research:replay')root.dispatchEvent(new Event('research:replay'));
 if(event.data?.type==='design:apply')try{apply(event.data.config,event.data.grid===true,event.data.flow===true,event.data.proof,event.data.screenAudit===true);}catch(error){parent.postMessage({type:'design:error',message:String(error)},location.origin);}
 if(event.data?.type==='design:select-area'&&['home','research','artifacts','about'].includes(event.data.area))root.dispatchEvent(new CustomEvent('design:navigate',{detail:event.data.area}));
});
let lastHeight=0;
new ResizeObserver(()=>{const height=Math.ceil(root.offsetTop+root.offsetHeight+24);if(height!==lastHeight){lastHeight=height;parent.postMessage({type:'design:preview-size',height},location.origin);}}).observe(root);
if(parent!==window)parent.postMessage({type:'design:ready'},location.origin);
else{
 const current=new URLSearchParams(location.search).get('design-preview')==='current';
 const state=current?currentPreview(design,sessionStorage):{config:design,unsaved:false};
 apply(state.config,false,false,'overprint',false);
 if(current){const status=root.querySelector('.author-entry span');if(status)status.textContent=`当前调整预览 · ${state.unsaved?'未保存':'已保存'} · 公开文案待确认`;}
}
