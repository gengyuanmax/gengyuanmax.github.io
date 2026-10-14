import {paintGuides,ruleMask,type InkRect} from './print-guides';
import {paperOrigin} from '../design/print-pipeline/browser';
import {design} from '../config/design';
import type {DesignConfig} from '../design/settings';
/** Every non-text mark drawn by CSS is printed too (user, 2026-10-15): borders and rules,
 * ink bars and ticks drawn as ::before/::after, and small solid ink blocks.
 * - Borders: measured, hidden in CSS, and printed into a layer under the content.
 * - Pseudo bars and ink blocks: printed in place with a mask, so their own transitions
 *   and animations (nav underline, divider reveal) keep working.
 * CSS hides these marks from the first frame in JS mode and they appear once printed;
 * without JS the CSS marks remain. */
const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 let config:DesignConfig=design,timer=0;
 const hostSelector='.he-page,.he-nav-shell,.he-colophon';
 const skip=(el:Element)=>!!el.closest('.he-grid-guides,.he-guide,.he-rule-layer,select,input,textarea,.he-reading-route,.he-timeline-guides,[data-style-element="grid"]');
 const ink=(c:string)=>!!c&&c!=='transparent'&&!/rgba\([^)]*,\s*0\)$/.test(c)&&!/^rgb\(240, 235, 223\)$/.test(c);
 const groundLike=(el:Element)=>el.matches('.he-project-ground,.he-divider-band,[data-material-mask],.he-type-a,.he-type-b,img,canvas,svg,svg *');
 function host(el:Element){return el.closest<HTMLElement>(hostSelector)||root!;}
 function measure(){
  const borders=new Map<HTMLElement,InkRect[]>(),blocks:{el:HTMLElement;w:number;h:number}[]=[],pseudos:{el:HTMLElement;which:'before'|'after';w:number;h:number}[]=[];
  for(const el of root!.querySelectorAll<HTMLElement>('*')){
   if(skip(el))continue;
   const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;
   const r=el.getBoundingClientRect();if(!r.width&&!r.height)continue;
   const h=host(el),hb=h.getBoundingClientRect(),zoom=hb.width/(h.offsetWidth||hb.width)||1;
   const x=(r.left-hb.left)/zoom,y=(r.top-hb.top)/zoom,w=r.width/zoom,ht=r.height/zoom;
   const add=(rect:InkRect)=>{if(rect.width>0&&rect.height>0){const list=borders.get(h)||[];list.push(rect);borders.set(h,list);}};
   const side=(s:'Top'|'Right'|'Bottom'|'Left')=>{const bw=parseFloat(cs[`border${s}Width`]);return bw>0&&cs[`border${s}Style`]!=='none'&&ink(cs[`border${s}Color`])?bw:0;};
   const t=side('Top'),b=side('Bottom'),l=side('Left'),rt=side('Right');
   if(t)add({x,y,width:w,height:t,level:1,color:cs.borderTopColor});
   if(b)add({x,y:y+ht-b,width:w,height:b,level:1,color:cs.borderBottomColor});
   if(l)add({x,y,width:l,height:ht,level:1,color:cs.borderLeftColor});
   if(rt)add({x:x+w-rt,y,width:rt,height:ht,level:1,color:cs.borderRightColor});
   if(!groundLike(el)&&ink(cs.backgroundColor)&&cs.maskImage==='none'&&!el.dataset.printBlock)blocks.push({el,w,h:ht});
   else if(el.dataset.printBlock)blocks.push({el,w,h:ht});
   if(groundLike(el))continue;
   for(const which of ['before','after'] as const){const p=getComputedStyle(el,`::${which}`);
    if(p.content==='none'||p.display==='none')continue;
    const pw=parseFloat(p.width),ph=parseFloat(p.height);if(!(pw>0&&ph>0))continue;
    // Paper grain layers are paper, not ink: never mask them.
    if(/feTurbulence|paper-grain/.test(p.backgroundImage))continue;
    if(ink(p.backgroundColor)||p.backgroundImage!=='none')pseudos.push({el,which,w:pw,h:ph});}
  }
  return {borders,blocks,pseudos};
 }
 function draw(){
  try{
   root!.dataset.rulesMeasure='';
   const {borders,blocks,pseudos}=measure();
   delete root!.dataset.rulesMeasure;
   const dpr=Math.max(1,devicePixelRatio||1),pageOf=(el:Element)=>el.closest<HTMLElement>('.he-page')||root!;
   const hosts=new Set([...root!.querySelectorAll<HTMLElement>(hostSelector),root!]);
   for(const h of hosts){
    let layer=h.querySelector<HTMLElement>(':scope > .he-rule-layer');
    const rects=borders.get(h)||[];
    if(!rects.length){layer?.remove();continue;}
    if(!layer){layer=document.createElement('div');layer.className='he-rule-layer';layer.setAttribute('aria-hidden','true');h.prepend(layer);}
    paintGuides(layer,rects,paperOrigin(h,pageOf(h)),config);
   }
   const pending:Promise<void>[]=[];
   for(const {el,w,h} of blocks){const o=paperOrigin(el,pageOf(el));pending.push(ruleMask(w,h,o,dpr,config).then(url=>{el.style.setProperty('--print-block',`url(${url})`);el.dataset.printBlock='';}));}
   for(const {el,which,w,h} of pseudos){
    const o=paperOrigin(el,pageOf(el));
    pending.push(ruleMask(w,h,o,dpr,config).then(url=>{el.style.setProperty(`--print-${which}`,`url(${url})`);const set=new Set((el.dataset.printPseudo||'').split(' ').filter(Boolean));set.add(which);el.dataset.printPseudo=[...set].join(' ');}));
   }
   // Marks hidden until printed appear together once their masks exist.
   void Promise.all(pending).then(()=>{root!.dataset.rulesReady='';root!.dataset.rulesPasses=String(Number(root!.dataset.rulesPasses||0)+1);},()=>{root!.dataset.rulesMeasure='';});
  }catch(error){root!.dataset.rulesMeasure='';console.warn('Keeping CSS rules.',error);}
 }
 const schedule=()=>{clearTimeout(timer);timer=window.setTimeout(()=>requestAnimationFrame(draw),root!.dataset.rulesReady===undefined?0:120);};
 const observer=new ResizeObserver(schedule);root.querySelectorAll('.he-page,.he-nav-shell').forEach(el=>observer.observe(el));
 root.addEventListener('design:updated',e=>{config=(e as CustomEvent<DesignConfig>).detail;schedule();});
 root.addEventListener('toggle',schedule,true);root.addEventListener('reading:layout',schedule);
 // State that adds or moves a mark (a pressed filter's bar, an opened details) reprints.
 new MutationObserver(schedule).observe(root,{subtree:true,attributes:true,attributeFilter:['aria-pressed','aria-expanded','open','hidden','data-artifact-view']});
 window.addEventListener('resize',schedule);void document.fonts.ready.then(schedule);schedule();
}
