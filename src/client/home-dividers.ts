export {};
/** Reveal ink with a moving mask, never by stretching its screen or changing registration. */
const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 const dividers=[...root.querySelectorAll<HTMLElement>('[data-home-divider]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const played=new WeakSet<HTMLElement>();
 const running=new Map<HTMLElement,Animation[]>();
 const enabled=(el:HTMLElement)=>!reduced.matches&&root.dataset.dividerMotion==='once'&&el.closest<HTMLElement>('.he-home')?.dataset.homeDividers==='print';
 function finish(el:HTMLElement){
  el.dataset.printState='done';running.get(el)?.forEach(a=>a.cancel());running.delete(el);
 }
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const entry of entries){
   const el=entry.target as HTMLElement;
   if(!entry.isIntersecting||!enabled(el)||played.has(el))continue;
   played.add(el);observer?.unobserve(el);el.dataset.printState='printing';
   const animations=[...el.querySelectorAll<HTMLElement>('.he-divider-pass')].map(layer=>layer.animate(
    [{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],
    {duration:700,delay:layer.dataset.dividerInk==='b'?110:0,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'}));
   running.set(el,animations);
   Promise.all(animations.map(a=>a.finished)).then(()=>finish(el)).catch(()=>{});
  }
 },{threshold:0.15}):null;
 function sync(){
  for(const el of dividers){
   if(!enabled(el)||!observer||!('animate' in el)){observer?.unobserve(el);finish(el);continue;}
   if(!played.has(el)){el.dataset.printState='waiting';observer.observe(el);}
  }
 }
 reduced.addEventListener('change',sync);root.addEventListener('design:updated',sync);sync();
}
