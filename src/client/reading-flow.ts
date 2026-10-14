import {readingRoute,type ReadingAnchor} from '../design/reading-route';
const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 const ns='http://www.w3.org/2000/svg';
 const observed=new Set<Element>();
 let frame=0;
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);};
 const observer=new ResizeObserver(schedule);
 function draw(){
  const live=new Set<Element>();
  root!.querySelectorAll<HTMLElement>('[data-reading-host]').forEach(host=>{
   const rect=host.getBoundingClientRect();
   const cards=[...host.querySelectorAll<HTMLElement>('.he-project,.he-artifact')];
   for(const el of [host,...cards]){live.add(el);if(!observed.has(el)){observed.add(el);observer.observe(el);}}
   let svg=host.querySelector<SVGSVGElement>(':scope > .he-reading-route');
   if(!svg){svg=document.createElementNS(ns,'svg');svg.classList.add('he-reading-route');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.append(document.createElementNS(ns,'path'));host.append(svg);}
   const anchors:ReadingAnchor[]=cards.map((card,i)=>{
    const marker=card.querySelector<HTMLElement>('.he-reading-marker')!;
    const box=marker.getBoundingClientRect();
    const row=getComputedStyle(card).gridRowStart;
    const chapter=card.closest('.he-research-chapter')?.id||'spread';
    return {x:box.left-rect.left+box.width/2,y:box.top-rect.top,row:row==='auto'?`single-${i}`:`${chapter}-${row}`};
   });
   svg.setAttribute('viewBox',`-22 0 ${rect.width+22} ${rect.height}`);
   svg.querySelector('path')!.setAttribute('d',readingRoute(anchors));
  });
  for(const el of observed)if(!live.has(el)){observer.unobserve(el);observed.delete(el);}
 }
 root.addEventListener('reading:layout',schedule);
 root.addEventListener('design:updated',schedule);
 root.addEventListener('toggle',schedule,true);
 window.addEventListener('resize',schedule);
 document.fonts.ready.then(schedule);
 schedule();
}
