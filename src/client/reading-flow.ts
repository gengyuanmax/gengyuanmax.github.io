import {readingTree,timelineGuides,type ReadingAnchor,type ReadingBand} from '../design/reading-route';
import {paintGuides} from './print-guides';
import {paperOrigin} from '../design/print-pipeline/browser';
import {design} from '../config/design';
import type {DesignConfig} from '../design/settings';
const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 let config:DesignConfig=design;
 const observed=new Set<Element>();
 let frame=0;
 let stale=false;
 const schedule=()=>{clearTimeout(frame);if(root!.dataset.navigating){stale=true;return;}frame=window.setTimeout(draw,16);};
 const observer=new ResizeObserver(schedule);
 function draw(){
  if(root!.dataset.navigating)return;
  const live=new Set<Element>();
  root!.querySelectorAll<HTMLElement>('[data-reading-host]').forEach(host=>{
   const rect=host.getBoundingClientRect();
   const cards=[...host.querySelectorAll<HTMLElement>('.he-project,.he-artifact')];
   for(const el of [host,...cards]){live.add(el);if(!observed.has(el)){observed.add(el);observer.observe(el);}}
   let layer=host.querySelector<HTMLElement>(':scope > .he-reading-route');
   if(!layer){layer=document.createElement('div');layer.className='he-reading-route';layer.setAttribute('aria-hidden','true');host.append(layer);}
   const anchors:ReadingAnchor[]=cards.map((card,i)=>{
    const marker=card.querySelector<HTMLElement>('.he-reading-marker')!;
    const box=marker.getBoundingClientRect();
    const row=getComputedStyle(card).gridRowStart;
    const chapter=card.closest('.he-research-chapter')?.id||'spread';
    return {x:box.left-rect.left+box.width/2,y:box.top-rect.top,row:row==='auto'?`single-${i}`:`${chapter}-${row}`};
   });
   const headers=[...host.querySelectorAll<HTMLElement>('.he-chapter-heading')];
   const grounds=headers.map(h=>h.querySelector<HTMLElement>(':scope > [data-style-element^="plate-"]')||h);
   const bands:ReadingBand[]=headers.map((h,i)=>{const b=h.getBoundingClientRect(),g=grounds[i].getBoundingClientRect();return {top:b.top-rect.top,bottom:b.bottom-rect.top,left:g.left-rect.left,right:g.right-rect.left};});
   const weight=parseFloat(getComputedStyle(host).getPropertyValue('--reading-weight'))||1.5;
   const origin={x:rect.left+scrollX,y:rect.top+scrollY};
   const {ink,knockouts}=readingTree(anchors,bands,{weight,dpr:Math.max(1,devicePixelRatio||1),origin});
   const page=host.closest<HTMLElement>('.he-page')||root!;
   paintGuides(layer,ink,paperOrigin(host,page),config);
   // Knockouts live inside the band they cut, above its ink and below its type.
   headers.forEach((h,i)=>{
    h.querySelectorAll(':scope > .he-route-knockout').forEach(k=>k.remove());
    const b=h.getBoundingClientRect();
    for(const k of knockouts){if(k.y<bands[i].top-.5||k.y+k.height>bands[i].bottom+.5||k.x+k.width<bands[i].left!||k.x>bands[i].right!)continue;
     const e=document.createElement('i');e.className='he-route-knockout';e.setAttribute('aria-hidden','true');
     e.style.cssText=`left:${k.x+rect.left-b.left}px;top:${k.y+rect.top-b.top}px;width:${k.width}px;height:${k.height}px`;h.append(e);}
   });
  });
  root!.querySelectorAll<HTMLElement>('.he-about-body .he-timeline').forEach(list=>{
   live.add(list);if(!observed.has(list)){observed.add(list);observer.observe(list);}
   const box=list.getBoundingClientRect();if(!box.width)return;
   const before=getComputedStyle(list,'::before'),items=[...list.querySelectorAll<HTMLElement>(':scope > li:not(.he-timeline-guides)')];
   const left=parseFloat(before.left)||0,width=parseFloat(before.width)||0,top=parseFloat(before.top)||0,bottom=box.height-(parseFloat(before.bottom)||0);
   const entries=items.map(li=>{const m=getComputedStyle(li,'::before');return li.getBoundingClientRect().top-box.top+(parseFloat(m.top)||0)+(parseFloat(m.height)||0)/2;});
   const weight=parseFloat(getComputedStyle(list).getPropertyValue('--reading-weight'))||1.5,page=list.closest<HTMLElement>('.he-page')||root!,origin=paperOrigin(list,page);
   let layer=list.querySelector<HTMLElement>(':scope > .he-timeline-guides');
   if(!layer){layer=document.createElement('li');layer.className='he-timeline-guides';layer.setAttribute('aria-hidden','true');layer.setAttribute('role','presentation');list.append(layer);}
   paintGuides(layer,timelineGuides({x:left+width/2,top,bottom},entries,{weight,dpr:Math.max(1,devicePixelRatio||1),origin}),origin,config);
   list.dataset.guides='print';
  });
  for(const el of observed)if(!live.has(el)){observer.unobserve(el);observed.delete(el);}
 }
 root.addEventListener('navigation:settled',()=>{if(stale){stale=false;schedule();}});
 root.addEventListener('reading:layout',schedule);
 root.addEventListener('design:updated',e=>{config=(e as CustomEvent<DesignConfig>).detail;schedule();});
 root.addEventListener('toggle',schedule,true);
 window.addEventListener('resize',schedule);
 document.fonts.ready.then(schedule);
 schedule();
}
