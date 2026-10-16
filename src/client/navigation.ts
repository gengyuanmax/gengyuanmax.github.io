import { areaIds,resolve,type DesignConfig } from '../design/settings';
import {screen} from '../design/screen';
import {definePrintElement,screenPrintElement,type LineElement} from '../design/print-pipeline/index';
const root=document.querySelector<HTMLElement>('#personal-site');
if(root) {
 const pages=[...root.querySelectorAll<HTMLElement>('.he-page')];
 const track=root.querySelector<HTMLElement>('.he-track')!;
 const viewport=root.querySelector<HTMLElement>('.he-window')!;
 const header=root.querySelector<HTMLElement>('.he-nav-shell')!;
 const shortcuts=root.querySelector<HTMLElement>('.he-shortcuts')!;
 const links=[...root.querySelectorAll<HTMLAnchorElement>('[data-area-link]')];
 const aboutNav=root.querySelector<HTMLElement>('.he-about-shortcuts')!;
 const aboutSections=[...root.querySelectorAll<HTMLElement>('[data-about-section]')];
 const chapters=[...root.querySelectorAll<HTMLElement>('.he-research-chapter, .he-publication-index')];
 root.addEventListener('design:updated',event=>{
  const lineSettings=resolve((event as CustomEvent<DesignConfig>).detail).values;
  const recipe=screen('medium','a',lineSettings);
  root.querySelectorAll<HTMLElement>('[data-line-id]').forEach(indicator=>indicator.innerHTML=screenPrintElement(definePrintElement<LineElement>({id:indicator.dataset.lineId!,profile:'line-v3',finish:'rubbed',source:{kind:'shape'},pitch:recipe.pitch,angle:recipe.angle,coverage:.30,seed:lineSettings.seed,grain:lineSettings.grain,starvation:lineSettings.starvation,texture:indicator.dataset.lineTexture as 'line'|'knurl'|'wave'})));
 });
 let active=0, jump=0, scrollFrame=0, settle=0, chapterIdle=0;
 let chapterTarget:string|null=null,chapterScrolling=false;
 function releaseChapter(){clearTimeout(chapterIdle);chapterTarget=null;chapterScrolling=false;}
 // Hiding the outgoing page and revealing the incoming one restyles two whole page
 // trees; doing it while the slide starts cost ~50ms of style and layout in its first
 // frames. The pages are swapped for assistive technology when the slide lands.
 let hiddenFor=-1;
 function applyHidden(index:number){if(hiddenFor===index)return;hiddenFor=index;pages.forEach((p,i)=>{p.inert=i!==index;p.setAttribute('aria-hidden',String(i!==index));});}
 function settled(){clearTimeout(settle);applyHidden(active);if(!root!.dataset.navigating)return;delete root!.dataset.navigating;root!.dispatchEvent(new CustomEvent("navigation:settled"));}
 track.addEventListener("transitionend",e=>{if(e.target===track&&e.propertyName==="transform")settled();});
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function fit() {
  const height=pages[active].offsetHeight+'px',navHeight=header.offsetHeight+'px',headerHeight=(header.offsetHeight+(active===1?shortcuts.offsetHeight:0))+'px';
  if(root!.style.getPropertyValue('--he-nav-height')!==navHeight)root!.style.setProperty('--he-nav-height',navHeight);
  if(viewport.style.height!==height)viewport.style.height=height;
  if(root!.style.getPropertyValue('--he-header-height')!==headerHeight)root!.style.setProperty('--he-header-height',headerHeight);
 }
 function markAbout(id:string){const index=aboutSections.findIndex(s=>s.id===id);aboutNav.style.setProperty('--about-index',String(Math.max(0,index)));aboutNav.querySelectorAll<HTMLAnchorElement>('a').forEach(a=>{if(a.dataset.aboutLink===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
 function markChapter(id:string) { const index=chapters.findIndex(c=>c.id===id);shortcuts.style.setProperty('--chapter-index',String(Math.max(0,index)));shortcuts.style.setProperty('--chapter-column',String(Math.max(0,index)%2));shortcuts.style.setProperty('--chapter-row',String(Math.floor(Math.max(0,index)/2)));shortcuts.querySelectorAll<HTMLAnchorElement>('a').forEach(a=>{if(a.dataset.chapter===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}); }
 function navigate(id:string, {history=true,scroll=true,focus=false}={}) {
  const aboutSection=aboutSections.find(c=>c.id===id);
  const chapter=chapters.find(c=>c.id===id)||aboutSection;
  const index=aboutSection?3:chapter?1:pages.findIndex(p=>p.id===id);
  if(index<0)return;
  if(chapter instanceof HTMLDetailsElement)chapter.open=true;
  clearTimeout(jump);
  releaseChapter();
  const changed=index!==active;
  // The boot takeover never slides (transitions are off while booting), so it must not
  // hold printing back as "navigating" either.
  const slides=changed&&!reduced()&&root!.dataset.booting===undefined;
  clearTimeout(settle);
  if(slides){
   root!.dataset.navigating='true';
   // Fallback also covers an interrupted transition or a background tab.
   settle=window.setTimeout(settled,550);
  }else settled();
  active=index;
  // Moving focus out of a panel precedes making that panel inert.
  const focused=document.activeElement;
  if(changed&&focused instanceof HTMLElement&&pages.some((p,i)=>i!==index&&p.contains(focused)))links[index].focus({preventScroll:true});
  // At the page top, preserve the paper margin. Only reset when the user has
  // scrolled past the site top, before changing the shortcut row or page height.
  // Unconditional scrollIntoView moved a top-of-page header by the sheet margin.
  if(scroll&&!chapter&&root!.getBoundingClientRect().top<0)root!.scrollIntoView({block:'start',behavior:'instant'});
  header.dataset.activeArea=pages[index].id;
  if(!slides)applyHidden(index);
  links.forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  track.style.transform=`translateX(-${index*100}%)`;
  fit();
  if(history&&location.hash!==`#${id}`)window.history.pushState(null,'',`#${id}`);
  root!.querySelector('[data-navigation-status]')!.textContent=chapter?(aboutSection?aboutNav:shortcuts).querySelector(`[href="#${id}"]`)!.textContent:links[index].dataset.label!;
  if(aboutSection)markAbout(id);else if(chapter)markChapter(id);else if(index===1)markChapter(chapters[0].id);else if(index===3)markAbout(aboutSections[0].id);
  if(scroll&&chapter){
   // Keep the clicked destination selected while smooth scrolling crosses other
   // chapters. Scrollspy must not pull the moving indicator backwards mid-flight.
   chapterTarget=id;
   jump=window.setTimeout(()=>{
   chapterScrolling=true;
   chapterIdle=window.setTimeout(releaseChapter,2000);
   fit();
   chapter.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
   if(focus&&chapter){
    const heading=chapter.querySelector<HTMLElement>('h2, summary')!;
    heading.tabIndex=-1;heading.focus({preventScroll:true});heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});
   }
  },slides?490:0);
  }
 }
 root.dataset.enhanced='true';
 if(import.meta.env.DEV)root.addEventListener('design:navigate',e=>navigate((e as CustomEvent<string>).detail,{history:false,scroll:false}));
 const readHash=()=>{let id='home';try{id=decodeURIComponent(location.hash.slice(1))||'home';}catch{}navigate(id,{history:false,scroll:!!location.hash});};
 // Take over from the boot state in one step: navigating home first and then to the
 // URL's area would commit an intermediate transform and play a slide on load.
 let initial='home';try{initial=decodeURIComponent(location.hash.slice(1))||'home';}catch{}
 if(!pages.some(p=>p.id===initial)&&!chapters.some(c=>c.id===initial)&&!aboutSections.some(c=>c.id===initial))initial='home';
 navigate(initial,{history:false,scroll:!!location.hash});
 delete root.dataset.booting;
 root.addEventListener('click',event=>{
  const target=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if(!target||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  const id=target.hash.slice(1);
  if(!pages.some(p=>p.id===id)&&!chapters.some(c=>c.id===id)&&!aboutSections.some(c=>c.id===id))return;
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
  if(chapterTarget){
   if(chapterScrolling){clearTimeout(chapterIdle);chapterIdle=window.setTimeout(releaseChapter,160);}
   return;
  }
  if(active===3){if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(chapterTarget)return;const edge=header.getBoundingClientRect().bottom+80;const reached=aboutSections.filter(s=>s.getBoundingClientRect().top<=edge);if(reached.length)markAbout(reached.reduce((a,b)=>a.getBoundingClientRect().top>b.getBoundingClientRect().top?a:b).id);});return;}
  if(active!==1||scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(chapterTarget)return;let id=chapters[0].id;const edge=header.getBoundingClientRect().bottom+shortcuts.offsetHeight+80;for(const c of chapters)if(c.getBoundingClientRect().top<=edge)id=c.id;markChapter(id);});
 },{passive:true});
 // Manual scrolling immediately restores scrollspy ownership.
 const interruptChapter=()=>{if(chapterTarget){clearTimeout(jump);releaseChapter();}};
 window.addEventListener('wheel',interruptChapter,{passive:true});
 window.addEventListener('touchstart',interruptChapter,{passive:true});
 window.addEventListener('keydown',e=>{if(['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(e.key))interruptChapter();});
 window.addEventListener('scrollend',()=>{if(chapterScrolling)releaseChapter();});
 window.addEventListener('popstate',readHash);window.addEventListener('hashchange',readHash);
 const observer=new ResizeObserver(fit);[header,shortcuts,...pages].forEach(p=>observer.observe(p));
 document.fonts.ready.then(fit);
 if(import.meta.env.DEV)import('./preview');
}
