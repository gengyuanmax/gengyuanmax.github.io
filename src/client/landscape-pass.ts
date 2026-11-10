export {};
/** Plate pass (user, 2026-11-10): the home landscape is printed light to dark, one ink per
 * pass (yellow → vermilion → blue → dark). Each pass is a whole sheet rendered by the shared
 * pipeline (scripts/render-home-landscape.mjs), revealed along the paper feed. The last pass
 * is the published sheet itself, so the end state is exactly the static print. No screening,
 * noise or compositing happens here. Plays once, on first view; reduced motion, the global
 * printMotion switch or slow images show the finished sheet at once. */
const root=document.querySelector<HTMLElement>('#personal-site');
const figure=root?.querySelector<HTMLElement>('.he-landscape[data-passes]');
const finalSheet=figure?.querySelector<HTMLImageElement>('img');
if(root&&figure&&finalSheet){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const PASS=300,STAGGER=380,READY_WITHIN=1500,AFTER_NAME=1080;
 const enabled=()=>!reduced.matches&&root.dataset.printMotion==='press'&&'animate' in figure&&'IntersectionObserver' in window;
 let layers:HTMLImageElement[]=[],running:Animation[]=[],observer:IntersectionObserver|null=null;
 function done(){
  observer?.disconnect();observer=null;
  running.forEach(a=>a.cancel());running=[];
  layers.forEach(l=>l.remove());layers=[];
  finalSheet!.style.removeProperty('position');
  figure!.dataset.passState='done';
 }
 function play(){
  figure!.dataset.passState='playing';
  layers.forEach(l=>figure!.insertBefore(l,finalSheet!));
  if(getComputedStyle(finalSheet!).position==='static')finalSheet!.style.position='relative';
  running=[...layers,finalSheet!].map((sheet,i)=>sheet.animate(
   [{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}],
   {duration:PASS,delay:i*STAGGER,easing:'steps(10,end)',fill:'both'}));
  Promise.all(running.map(a=>a.finished)).then(done).catch(()=>{});
 }
 if(!enabled())done();
 else{
  figure.dataset.passState='waiting';
  const sources:string[]=JSON.parse(figure.dataset.passes||'[]');
  layers=sources.map(src=>{const img=new Image();img.className='he-landscape-pass';img.alt='';img.decoding='async';img.src=src;return img;});
  const ready=Promise.all([finalSheet,...layers].map(img=>img.decode())).then(()=>true,()=>false);
  observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting))return;
   observer?.disconnect();observer=null;
   Promise.race([ready,new Promise<boolean>(r=>setTimeout(()=>r(false),READY_WITHIN))]).then(ok=>{
    if(!ok||!enabled()||figure.dataset.passState!=='waiting'){done();return;}
    // One entrance at a time: the name's registration settle (duotone-type.css, 160ms + 880ms) lands first.
    setTimeout(()=>{if(enabled()&&figure.dataset.passState==='waiting')play();else done();},Math.max(0,AFTER_NAME-performance.now()));
   });
  },{threshold:.2});
  observer.observe(figure);
  reduced.addEventListener('change',()=>{if(reduced.matches)done();});
  root.addEventListener('design:updated',()=>{if(!enabled())done();});
 }
}
