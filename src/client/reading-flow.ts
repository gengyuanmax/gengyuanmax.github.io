import {readingTree,type ReadingAnchor,type ReadingBand} from '../design/reading-route';
const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 const ns='http://www.w3.org/2000/svg';
 const observed=new Set<Element>();
 let frame=0;
 const schedule=()=>{cancelAnimationFrame(frame);if(!root!.dataset.navigating)frame=requestAnimationFrame(draw);};
 const observer=new ResizeObserver(schedule);
 function draw(){
  if(root!.dataset.navigating)return;
  const live=new Set<Element>();
  root!.querySelectorAll<HTMLElement>('[data-reading-host]').forEach(host=>{
   const rect=host.getBoundingClientRect();
   const cards=[...host.querySelectorAll<HTMLElement>('.he-project,.he-artifact')];
   for(const el of [host,...cards]){live.add(el);if(!observed.has(el)){observed.add(el);observer.observe(el);}}
   let svg=host.querySelector<SVGSVGElement>(':scope > .he-reading-route');
   if(!svg){svg=document.createElementNS(ns,'svg');svg.classList.add('he-reading-route');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');host.append(svg);}
   const anchors:ReadingAnchor[]=cards.map((card,i)=>{
    const marker=card.querySelector<HTMLElement>('.he-reading-marker')!;
    const box=marker.getBoundingClientRect();
    const row=getComputedStyle(card).gridRowStart;
    const chapter=card.closest('.he-research-chapter')?.id||'spread';
    return {x:box.left-rect.left+box.width/2,y:box.top-rect.top,row:row==='auto'?`single-${i}`:`${chapter}-${row}`};
   });
   const headers=[...host.querySelectorAll<HTMLElement>('.he-chapter-heading')];
   const bands:ReadingBand[]=headers.map(h=>{const b=h.getBoundingClientRect();return {top:b.top-rect.top,bottom:b.bottom-rect.top};});
   const weight=parseFloat(getComputedStyle(host).getPropertyValue('--reading-weight'))||1.5;
   const origin={x:rect.left+scrollX,y:rect.top+scrollY};
   const grounds=headers.map(h=>h.querySelector<HTMLElement>(':scope > [data-style-element^="plate-"]')||h);
   const bandLeft=grounds.length?Math.max(...grounds.map(g=>g.getBoundingClientRect().left-rect.left)):undefined;
   const {ink,knockouts}=readingTree(anchors,bands,{weight,dpr:Math.max(1,devicePixelRatio||1),origin,bandLeft});
   svg.setAttribute('viewBox',`-22 0 ${rect.width+22} ${rect.height}`);
   svg.replaceChildren(...ink.map(r=>{const e=document.createElementNS(ns,'rect');for(const [k,v] of Object.entries({x:r.x,y:r.y,width:r.width,height:r.height}))e.setAttribute(k,String(v));e.dataset.level=String(r.level);return e;}));
   // Knockouts live inside the band they cut, above its ink and below its type.
   headers.forEach((h,i)=>{
    h.querySelectorAll(':scope > .he-route-knockout').forEach(k=>k.remove());
    const b=h.getBoundingClientRect();
    for(const k of knockouts){if(k.y<bands[i].top-.5||k.y+k.height>bands[i].bottom+.5)continue;
     const e=document.createElement('i');e.className='he-route-knockout';e.setAttribute('aria-hidden','true');
     e.style.cssText=`left:${k.x+rect.left-b.left}px;top:${k.y+rect.top-b.top}px;width:${k.width}px;height:${k.height}px`;h.append(e);}
   });
  });
  for(const el of observed)if(!live.has(el)){observer.unobserve(el);observed.delete(el);}
 }
 root.addEventListener('navigation:settled',schedule);
 root.addEventListener('reading:layout',schedule);
 root.addEventListener('design:updated',schedule);
 root.addEventListener('toggle',schedule,true);
 window.addEventListener('resize',schedule);
 document.fonts.ready.then(schedule);
 schedule();
}
