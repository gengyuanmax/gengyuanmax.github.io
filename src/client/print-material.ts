import {paperOrigin,textCoverage,pixelSurface,publishCanvas,svgCoverage,createPrintMount,alphaMaskURL,publishMask,clearMask} from '../design/print-pipeline/browser';
import {typeScreenLevel} from '../design/screen';
import {dotPitch} from '../design/print-pipeline/index';
import {recordScreen,clearScreen} from './screen-data';
import {design} from '../config/design';
import {resolve,getPalette,type DesignConfig,type Area} from '../design/settings';
import {renderFieldOriginals,type FieldOriginal,onSheet,screenOriginal,paintMaterial,pressSettings,elementPress,materialVersion,textTextureVersion,textTier} from '../design/print-pipeline/index';
import {rgb} from '../design/element-composition';
import {makeToneField,toneSettings} from '../design/tone-field';
import {rememberTone} from './tone-proof';
import {printMask,printField} from './print-jobs';

const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 let config:DesignConfig=design,frame=0,generation=0;
 const mounts=new WeakMap<SVGSVGElement,ReturnType<typeof createPrintMount>>();
 const inkMounts=new WeakMap<HTMLElement,ReturnType<typeof createPrintMount>>();
 const observer=new ResizeObserver(schedule);
 // Pages are not observed: their height no longer feeds the print (the roller drum is
 // fixed), and images loading below would restart every pass while the page settles.
 root.querySelectorAll<SVGSVGElement>('[data-print-field]').forEach(el=>observer.observe(el));
 root.querySelectorAll<HTMLElement>('.he-type-line').forEach(el=>observer.observe(el));
 root.querySelectorAll<HTMLElement>('.he-project-ground,.he-divider-band').forEach(el=>observer.observe(el));
 /** Layout is read once per pass, before any mask is written: reading geometry or style
  * after a write forces a full style/layout recalculation, which cost seconds per pass. */
 type Metrics={cw:number;ch:number;fontSize:number;styleKey:string;origin:{x:number;y:number};pageHeight:number};
 let metrics=new Map<Element,Metrics>();
 function measure(el:HTMLElement):Metrics{
  // The navigation is its own sheet: measured against the site root, its sheet height
  // changed with every page switch and reprinted (flashed) every tab label.
  const page=(el.closest<HTMLElement>('.he-page,.he-nav-shell')||root!),cs=getComputedStyle(el);
  return {cw:el.clientWidth||el.offsetWidth,ch:el.clientHeight||el.offsetHeight,fontSize:parseFloat(cs.fontSize),styleKey:[cs.fontFamily,cs.fontSize,cs.fontWeight,cs.fontVariationSettings,cs.letterSpacing].join('|'),origin:paperOrigin(el,page),pageHeight:page.offsetHeight};
 }
 const metricsOf=(el:HTMLElement)=>{let m=metrics.get(el);if(!m){m=measure(el);metrics.set(el,m);}return m;};
const decodeImage=(url:string)=>{const image=new Image();image.src=url;return image.decode().catch(()=>{});};
 async function textureMask(el:HTMLElement,ink:'a'|'b',s:ReturnType<typeof resolve>['values']){
  const target=el.querySelector<HTMLElement>('[data-print-transfer]')||el;
  const ground=el.matches('.he-project-ground,.he-divider-band');
  // Solid type only carries low-frequency transfer (features ≥32 CSS px; its 1px grain
  // covers <4% of the area at <8% loss), so its mask is computed at 2 CSS px per sample
  // and scaled by CSS. Screened grounds keep device resolution.
  const m=metricsOf(el);if(!m.cw||!m.ch)return;
  const dpr=ground?Math.max(1,devicePixelRatio||1):.5,w=Math.max(1,Math.round(m.cw*dpr)),h=Math.max(1,Math.round(m.ch*dpr));
  const owner=el.closest<HTMLElement>('[data-style-element]')!;
  const identity=(owner?.dataset.styleElement||'shared-type')+(ground?'':':'+(el.dataset.inkCopy||el.textContent));
  const fontSize=m.fontSize,level=ground?'fine':'coarse';
  let p=elementPress(pressSettings(s,level,fontSize),identity,ground?'field':'title',fontSize);p={...p,fast:true};
  const origin=m.origin;
  p=onSheet(p,resolve(config).values.seed,origin,m.pageHeight);
  const key=JSON.stringify([textTextureVersion,m.styleKey,el.textContent,document.fonts.status,w,h,p,ink,ground?origin:null,ground?s.groundOpacity:null,s.titleDotRadius]);let mount=inkMounts.get(el);if(!mount){mount=createPrintMount();inkMounts.set(el,mount);}const ticket=mount.begin(key);if(!ticket)return;
  if(ground){recordScreen(el,p,ink);el.dataset.toneSource='plane';}else clearScreen(el);
  try{
   const r=await printMask({kind:'mask',w,h,dpr,ground,groundOpacity:s.groundOpacity,tone:toneSettings(s),identity,ink,press:p,origin,fontSize,radius:s.titleDotRadius,proof:import.meta.env.DEV});
   if(import.meta.env.DEV&&r.tone&&r.screened)rememberTone(identity,r.tone,r.screened,w,h,dpr);
   await publishMask(target,r.png,ticket);

  }catch(error){console.warn('Keeping the unprinted ink.',error);}
 }

 let settleTimer=0;
 function schedule(){
  // Coalesce bursts (fonts, images and observers settling) into one pass; a pass in
  // flight is only superseded when the next one actually starts.
  cancelAnimationFrame(frame);clearTimeout(settleTimer);
  if(root!.dataset.navigating){++generation;return;}
  settleTimer=window.setTimeout(()=>void render(),60);
 }
 /** Each element is its own task so input can interleave; areas that are not on screen are
  * prepared in idle time afterwards, so opening them later finds finished prints. */
 const yieldToMain=()=>new Promise<void>(done=>setTimeout(done,0));
 const whenIdle=()=>new Promise<void>(done=>{if('requestIdleCallback' in window)requestIdleCallback(()=>done(),{timeout:1500});else setTimeout(done,40);});
 const offscreen=(el:Element)=>el.closest('.he-page')?.getAttribute('aria-hidden')==='true';
 let fieldMetrics=new Map<SVGSVGElement,{cw:number;ch:number;origin:{x:number;y:number};pageHeight:number}>();
 function measureField(svg:SVGSVGElement){const page=svg.closest<HTMLElement>('.he-page')||root!,b=svg.getBoundingClientRect();return {cw:b.width?svg.clientWidth:0,ch:b.height?svg.clientHeight:0,origin:paperOrigin(svg,page),pageHeight:page.offsetHeight};}
 async function renderField(svg:SVGSVGElement,run:number){
   const fm=fieldMetrics.get(svg)||measureField(svg);if(!fm.cw||!fm.ch)return;
   const el=svg.parentElement!;
   const s=resolve(config,svg.dataset.printArea as Area,svg.dataset.printField).values,global=resolve(config).values;
   let p=elementPress(pressSettings({...s,registration:global.registration,registrationY:global.registrationY}),svg.dataset.printField!,'field');p={...p,fast:true};
   const dpr=Math.max(1,devicePixelRatio||1),w=Math.round(fm.cw*dpr),h=Math.round(fm.ch*dpr),origin=fm.origin;
   const palette=getPalette(config,s.palette),proof=root!.dataset.typeProof,key=JSON.stringify([w,h,s.fieldCoverage,s.fieldOverlap,fm.pageHeight,p,global.seed,palette,origin,proof]);p=onSheet(p,global.seed,origin,fm.pageHeight);let mount=mounts.get(svg);if(!mount){mount=createPrintMount();mounts.set(svg,mount);}const ticket=mount.begin(key);if(!ticket)return;
   try{
    const originals:FieldOriginal[]=[],screenedInks=new Set<'a'|'b'>();
    for(const ink of ['a','b'] as const){
     const children=[...(svg.querySelector(`.he-field-${ink}`)?.children||[])];
     for(const [index,node] of children.entries()){
      const patterned=(node.getAttribute('fill')||'').startsWith('url('),e=node.cloneNode(true) as Element;
      if(patterned)e.setAttribute('fill','black');
      const source=await svgCoverage(e.outerHTML,w,h);if(run!==generation||!ticket.current())return;
      const ring=e.tagName==='circle'&&e.getAttribute('fill')==='none'&&Number(e.getAttribute('stroke-width'))>=6;
      const screened=patterned||ring;if(screened)screenedInks.add(ink);
      const kind=e.getAttribute('data-print-tone')==='sphere'||e.tagName==='circle'&&!ring?'sphere':'plane';
      originals.push({ink,coverage:source,screened,ring,kind,index});
     }
    }
    const {pixels,tones,screens}=await printField({kind:'field',originals,w,h,dpr,origin,press:p,settings:s,inks:{a:proof==='blue'?[255,255,255]:rgb(palette.secondary),b:proof==='red'?[255,255,255]:rgb(palette.primary),paper:[255,255,255]}});if(run!==generation||!ticket.current())return;
    if(import.meta.env.DEV)originals.forEach((item,i)=>{if(item.screened)rememberTone(`${svg.dataset.printField}:${item.ink}:${item.index}`,tones[i],screens[i],w,h,dpr);});
    let canvas=el.querySelector<HTMLCanvasElement>('.he-material-field');
    if(!canvas){canvas=document.createElement('canvas');canvas.className='he-material-field';canvas.setAttribute('aria-hidden','true');el.append(canvas);}
    const prepared=pixelSurface(pixels,w,h);
    ticket.commit(()=>{publishCanvas(canvas!,prepared);el.dataset.materialReady='true';});
    recordScreen(canvas,p,[...screenedInks].join('') as 'a'|'b'|'ab');
    canvas.dataset.pressRecipe=JSON.stringify({level:p.level,shapes:p.shapes,pitch:p.pitch,angles:p.angles,offset:p.offset,origin,tone:p.tone,units:'CSS px',materialVersion});

   }catch(error){console.warn('Keeping pre-rendered print fallback.',error);}
   }
 async function render(){
  const run=++generation;
  await document.fonts.ready;if(run!==generation)return;
  const later:(()=>void|Promise<void>)[]=[];
  // Visible jobs start together and compute in workers; the page stays responsive.
  const visible:Promise<void>[]=[];
  const now=async(job:()=>void|Promise<void>)=>{visible.push(Promise.resolve(job()).catch(()=>{}));await yieldToMain();return run===generation;};
  // Read phase: every geometry and style the jobs need, before anything is written.
  const fields=[...root!.querySelectorAll<SVGSVGElement>('[data-print-field]')],lines=[...root!.querySelectorAll<HTMLElement>('.he-type-line')];
  const grounds=[...root!.querySelectorAll<HTMLElement>('.he-project-ground')],bands=[...root!.querySelectorAll<HTMLElement>('.he-divider-band')];
  fieldMetrics=new Map(fields.map(svg=>[svg,measureField(svg)]));metrics=new Map();
  const sizes=new Map(lines.map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]));
  for(const el of lines)for(const layer of el.querySelectorAll<HTMLElement>(':scope > .he-type-a, :scope > .he-type-b'))metrics.set(layer,measure(layer));
  for(const el of [...grounds,...bands])metrics.set(el,measure(el));
  const hidden=new Map([...fields,...lines,...grounds,...bands].map(el=>[el,offscreen(el)]));
  // Write phase for type state, all at once.
  for(const el of lines){const size=sizes.get(el)!;el.dataset.pressLarge=String(size>=24);el.dataset.pressFine=String(size<24);el.dataset.textTier=el.dataset.displayScreen==='true'?'display':textTier(size);el.style.setProperty('--dot-pitch',`${dotPitch(size)}px`);}
  // Illustrations stay paper until printed, while type and grounds already show their
  // final ink and only gain texture: print the visible illustrations first.
  for(const svg of fields){
   if(hidden.get(svg))later.push(()=>renderField(svg,run));else if(!await now(()=>renderField(svg,run)))return;
  }
  for(const el of lines){
   const size=sizes.get(el)!;
   const owner=el.closest<HTMLElement>('[data-style-element]'),area=owner?.dataset.styleAreaOwner||el.closest<HTMLElement>('[data-style-area]')?.dataset.styleArea;
   const job=()=>{
    const tasks:Promise<void>[]=[];const s=resolve(config,area as Area|undefined,owner?.dataset.styleElement).values;
    for(const ink of ['a','b'] as const){const layer=el.querySelector<HTMLElement>(`.he-type-${ink}`);if(!layer)continue;
     const dotted=(size>=72||el.dataset.displayScreen==='true')&&s.titleTreatment==='dotted'&&ink==='b'&&typeScreenLevel(size)!==null;
     // Every text plate has separate screen and transfer surfaces. Transfer never replaces the screen.
     if(size>=24)tasks.push(textureMask(layer,ink,s));
     else{clearMask(layer.querySelector<HTMLElement>('[data-print-transfer]')||layer);inkMounts.get(layer)?.invalidate();}
     if(dotted)recordScreen(layer,elementPress(pressSettings(s,typeScreenLevel(size)!,size),owner?.dataset.styleElement||'shared-type','title',size),ink,size);
     else clearScreen(layer);
    }
    return Promise.all(tasks).then(()=>{});
   };
   if(hidden.get(el))later.push(job);else if(!await now(job))return;
  }
  for(const el of grounds){
   const job=()=>{const s=resolve(config,el.dataset.styleAreaOwner as Area,el.dataset.styleElement).values;if(s.groundOpacity===0){clearScreen(el);return;}
    return textureMask(el,s.groundInk==='primary'?'b':'a',s);};
   if(hidden.get(el))later.push(job);else if(!await now(job))return;
  }
  for(const el of bands){
   const job=()=>{const s=resolve(config,'home').values;
    if(s.homeDividerStyle!=='print'){clearScreen(el);inkMounts.get(el)?.invalidate();return;}
    return textureMask(el,'b',{...s,groundOpacity:s.homeDividerCoverage});};
   if(hidden.get(el))later.push(job);else if(!await now(job))return;
  }
  await Promise.all(visible);if(run!==generation)return;
  root!.dispatchEvent(new CustomEvent('design:screen-rendered'));
  for(const job of later){await whenIdle();if(run!==generation)return;await job();}
 }
 root.addEventListener('design:updated',e=>{config=(e as CustomEvent<DesignConfig>).detail;schedule();});
 root.addEventListener('design:type-updated',()=>{root!.querySelectorAll<HTMLElement>('.he-type-line').forEach(el=>observer.observe(el));schedule();});
 root.addEventListener('design:proof-updated',schedule);
 root.addEventListener('navigation:settled',schedule);window.addEventListener('resize',schedule);void document.fonts.ready.then(schedule);schedule();
 const pageObserver=new MutationObserver(schedule);root.querySelectorAll('.he-page').forEach(page=>pageObserver.observe(page,{attributes:true,attributeFilter:['aria-hidden']}));
}
