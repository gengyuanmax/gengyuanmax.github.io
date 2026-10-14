import { areaIds } from '../design/settings';
const root=document.querySelector<HTMLElement>('#personal-site');
if(root) {
 const pages=[...root.querySelectorAll<HTMLElement>('.he-page')];
 const track=root.querySelector<HTMLElement>('.he-track')!;
 const viewport=root.querySelector<HTMLElement>('.he-window')!;
 const header=root.querySelector<HTMLElement>('.he-nav-shell')!;
 const shortcuts=root.querySelector<HTMLElement>('.he-shortcuts')!;
 const links=[...root.querySelectorAll<HTMLAnchorElement>('[data-area-link]')];
 const chapters=[...root.querySelectorAll<HTMLElement>('.he-research-chapter')];
 let active=0, jump=0, scrollFrame=0;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function fit() {
  viewport.style.height=pages[active].offsetHeight+'px';
  root!.style.setProperty('--he-header-height',header.offsetHeight+'px');
 }
 function markChapter(id:string) { shortcuts.querySelectorAll<HTMLAnchorElement>('a').forEach(a=>{if(a.dataset.chapter===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}); }
 function navigate(id:string, {history=true,scroll=true,focus=false}={}) {
  const chapter=chapters.find(c=>c.id===id);
  const index=chapter?1:pages.findIndex(p=>p.id===id);
  if(index<0)return;
  clearTimeout(jump);
  const changed=index!==active;
  active=index;
  // Moving focus out of a panel precedes making that panel inert.
  const focused=document.activeElement;
  if(changed&&focused instanceof HTMLElement&&pages.some((p,i)=>i!==index&&p.contains(focused)))links[index].focus({preventScroll:true});
  shortcuts.hidden=index!==1;
  header.dataset.activeArea=pages[index].id;
  pages.forEach((p,i)=>{p.inert=i!==index;p.setAttribute('aria-hidden',String(i!==index));});
  links.forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  track.style.transform=`translateX(-${index*100}%)`;
  fit();
  if(history&&location.hash!==`#${id}`)window.history.pushState(null,'',`#${id}`);
  root!.querySelector('[data-navigation-status]')!.textContent=chapter?shortcuts.querySelector(`[href="#${id}"]`)!.textContent:links[index].dataset.label!;
  if(chapter)markChapter(id);
  if(scroll)jump=window.setTimeout(()=>{
   fit();
   if(chapter)chapter.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
   // The sticky header follows the viewport and is not a stable page-top anchor.
   else root!.scrollIntoView({block:'start',behavior:'instant'});
   if(focus&&chapter){
    const heading=chapter.querySelector<HTMLElement>('h2')!;
    heading.tabIndex=-1;heading.focus({preventScroll:true});heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});
   }
  },changed&&!reduced()?490:0);
 }
 root.dataset.enhanced='true';
 if(import.meta.env.DEV)root.addEventListener('design:navigate',e=>navigate((e as CustomEvent<string>).detail,{history:false,scroll:false}));
 const readHash=()=>{let id='home';try{id=decodeURIComponent(location.hash.slice(1))||'home';}catch{}navigate(id,{history:false,scroll:!!location.hash});};
 navigate('home',{history:false,scroll:false});readHash();
 root.addEventListener('click',event=>{
  const target=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if(!target||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  const id=target.hash.slice(1);
  if(!pages.some(p=>p.id===id)&&!chapters.some(c=>c.id===id))return;
  event.preventDefault();navigate(id,{focus:event.detail===0});
 });
 links.forEach((a,i)=>a.addEventListener('keydown',event=>{
  const target={ArrowLeft:Math.max(0,i-1),ArrowRight:Math.min(3,i+1),Home:0,End:3}[event.key];
  if(target===undefined)return;
  event.preventDefault();links[target].focus();navigate(areaIds[target]);
 }));
 let touch:{x:number;y:number}|null=null;
 viewport.addEventListener('touchstart',e=>{if((e.target as Element).closest('[data-native-scroll],select,input,button,textarea')){touch=null;return;}touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
 viewport.addEventListener('touchend',e=>{
  if(!touch||!e.changedTouches.length)return;
  const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;
  if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.7){const id=areaIds[active+(dx<0?1:-1)];if(id)navigate(id);}
 },{passive:true});
 viewport.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
 let total=0,lastWheel=0,lastMove=0;
 viewport.addEventListener('wheel',e=>{
  if((e.target as Element).closest('[data-native-scroll],select,input,textarea'))return;
  if(e.ctrlKey||Math.abs(e.deltaX)<2||Math.abs(e.deltaX)<Math.abs(e.deltaY)*1.7)return;
  const step=Math.sign(e.deltaX),id=areaIds[active+step];if(!id)return;
  e.preventDefault();const now=performance.now();if(now-lastMove<700)return;
  if(now-lastWheel>180||Math.sign(total)!==step)total=0;
  lastWheel=now;total+=e.deltaX;
  if(Math.abs(total)>100){navigate(id);total=0;lastMove=now;}
 },{passive:false});
 window.addEventListener('scroll',()=>{
  if(active!==1||scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;let id=chapters[0].id;const edge=header.getBoundingClientRect().bottom+80;for(const c of chapters)if(c.getBoundingClientRect().top<=edge)id=c.id;markChapter(id);});
 },{passive:true});
 window.addEventListener('popstate',readHash);window.addEventListener('hashchange',readHash);
 const observer=new ResizeObserver(fit);[header,...pages].forEach(p=>observer.observe(p));
 document.fonts.ready.then(fit);
 if(import.meta.env.DEV)import('./preview');
}
