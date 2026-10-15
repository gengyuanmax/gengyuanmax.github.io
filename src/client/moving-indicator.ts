/** Persistent selection markers: read only button geometry, never the content below it.
 * Attribute changes move the same ink surface; no screening during movement. */
const root=document.querySelector<HTMLElement>('#personal-site');
if(root)for(const group of root.querySelectorAll<HTMLElement>('[data-moving-group]')){
 const marker=group.querySelector<HTMLElement>('[data-moving-indicator]')!;
 const choices=[...group.querySelectorAll<HTMLElement>(':scope > a,:scope > button')];
 function sync(){
  const chosen=choices.find(el=>el.getAttribute('aria-current')==='page'||el.getAttribute('aria-pressed')==='true');
  if(!chosen||!group.offsetWidth)return;
  const main=group.dataset.movingGroup==='main',ordering=group.dataset.movingGroup==='ordering';
  const width=chosen.offsetWidth*(main?.75:1)+(ordering?8:0);
  const x=chosen.offsetLeft-(ordering?4:0),y=chosen.offsetTop+chosen.offsetHeight-marker.offsetHeight-(ordering?2:0);
  marker.style.width=width+'px';marker.style.transform=`translate(${x}px,${y}px)`;
  if(!group.hasAttribute('data-marker-ready')){
   // Establish the initial position before enabling interpolation, preventing a boot slide.
   group.setAttribute('data-marker-ready','');
   requestAnimationFrame(()=>requestAnimationFrame(()=>group.setAttribute('data-marker-motion','')));
  }
 }
 const state=new MutationObserver(sync);
 choices.forEach(el=>state.observe(el,{attributes:true,attributeFilter:['aria-current','aria-pressed']}));
 const resize=new ResizeObserver(sync);resize.observe(group);choices.forEach(el=>resize.observe(el));
 document.fonts.ready.then(sync);sync();
}
export {};
