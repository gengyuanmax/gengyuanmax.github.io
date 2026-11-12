import {artifacts,artifactCategories} from '../data/content';
import {artifactGroups,type ArtifactMode} from '../data/catalog';
import {artifactComposition,placements} from '../config/compositions';
import {design} from '../config/design';
import {resolve,styleText,designAttributes,type DesignConfig} from '../design/settings';
import {printMotionOn} from './plate-pass';
import {publishCanvas} from '../design/print-pipeline/browser';
const root=document.querySelector<HTMLElement>('#personal-site');
const host=root?.querySelector<HTMLElement>('.he-artifact-groups');
const controls=root?.querySelector<HTMLElement>('.he-artifact-controls');
if(root&&host&&controls){
 const cards=new Map([...host.querySelectorAll<HTMLElement>('[data-content-id]')].map(el=>[el.dataset.contentId!.replace(/^artifact-/,''),el]));
 let mode:ArtifactMode='date',filter='all',config:DesignConfig=design,renderTimer=0;
 const syncChoice=()=>controls!.querySelectorAll<HTMLButtonElement>('[data-artifact-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.artifactMode===mode)));
 // Changing the order or the filter is printed like a page change (user, 2026-11-12): the old
 // sheet stays on screen while the vermilion line-v3 drum (the nav drum's band, turned
 // horizontal) rolls down it, and the new arrangement appears behind the drum. The old sheet
 // is a frozen copy (its canvases copied pixel for pixel) that the printers skip, so nothing
 // on it reprints or blinks; the new one waits under it until its prints have settled.
 const drum=root.querySelector<HTMLElement>('.he-artifact-drum');
 let old:HTMLElement|null=null,rolling:Animation[]=[];
 function freeze(){
  const copy=host!.cloneNode(true) as HTMLElement;
  const from=host!.querySelectorAll('canvas'),to=copy.querySelectorAll('canvas');
  to.forEach((c,i)=>{const s=from[i];if(s?.width&&s.height)publishCanvas(c,s);});
  copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));copy.querySelectorAll('[data-print-field]').forEach(e=>e.removeAttribute('data-print-field'));
  copy.classList.add('he-sheet-old');copy.setAttribute('aria-hidden','true');copy.inert=true;
  copy.style.height=`${host!.offsetHeight}px`;
  return copy;
 }
 function finishDrum(){rolling.forEach(a=>a.cancel());rolling=[];old?.remove();old=null;if(drum)drum.style.removeProperty('visibility');}
 function settle(){return new Promise<void>(resolve=>{let done=false;const go=()=>{if(!done){done=true;resolve();}};
  root!.addEventListener('design:screen-rendered',()=>setTimeout(go,40),{once:true});setTimeout(go,240);});}
 function rollDown(){
  if(!old||!drum)return finishDrum();
  // The drum rolls over what the reader sees: from the top of the list to the bottom of the
  // viewport (or the end of the list). Below that the old copy simply goes when it is done.
  const band=drum.offsetHeight||40,top=host!.getBoundingClientRect().top;
  const height=Math.max(old.offsetHeight,host!.offsetHeight);old.style.height=`${height}px`;
  const travel=Math.max(band,Math.min(height,innerHeight-top));
  const timing={duration:Math.min(760,Math.max(480,travel*.6)),easing:'cubic-bezier(.45,.05,.4,1)',fill:'both' as FillMode};
  rolling=[old.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:`inset(${travel}px 0 0 0)`}],timing),
   drum.animate([{transform:`translateY(${-band}px)`,visibility:'visible'},{transform:`translateY(${travel-band}px)`,visibility:'visible'}],timing)];
  rolling[0].finished.then(finishDrum,()=>{});
 }
 let reprint=false;
 function scheduleRender(){clearTimeout(renderTimer);renderTimer=window.setTimeout(render,matchMedia('(prefers-reduced-motion:reduce)').matches||(reprint&&printMotionOn(root!))?0:170);}
 function render(){
  // Freeze the old sheet before its cards move into the new arrangement.
  const drumming=reprint&&!!drum&&printMotionOn(root!);reprint=false;
  if(drumming){finishDrum();old=freeze();}
  const sections=document.createDocumentFragment();
  let count=0;
  for(const group of artifactGroups(Object.values(artifacts),mode,filter)){
   if(!group.entries.length)continue;
   const section=document.createElement('section');section.className='he-artifact-group';
   if(mode==='category'){const h=document.createElement('h2');h.className='he-artifact-group-label';h.textContent=artifactCategories[group.key]||group.key;section.append(h);}
   const spread=document.createElement('div');spread.className='he-artifact-spread';spread.dataset.readingHost='';
   group.entries.forEach((item,index)=>{
    const card=cards.get(item.id)!;const slot=artifactComposition[index%artifactComposition.length],id=`artifact-${slot.id}`,position=placements[id as keyof typeof placements];
    const s=resolve(config,'artifacts',id).values;
    card.className=`he-artifact he-artifact-${slot.slot}`;card.dataset.styleElement=id;
    card.style.cssText=styleText(s,config)+`;--item-row:${position.row+Math.floor(index/artifactComposition.length)*3}`;
    for(const [key,value]of Object.entries(designAttributes(s)))card.setAttribute(key,value);
    card.querySelector<HTMLElement>('.he-reading-marker')!.textContent=String(count+1).padStart(2,'0');card.dataset.flowNumber=String(++count+1);spread.append(card);
   });
   section.append(spread);sections.append(section);
  }
  if(!count){const empty=document.createElement('p');empty.textContent='No artifacts in this category.';sections.append(empty);}
  host!.replaceChildren(sections);
  if(drumming){host!.append(old!,drum!);root!.dispatchEvent(new CustomEvent('reading:layout'));settle().then(rollDown);}
  else{if(old&&drum)host!.append(old,drum);root!.dispatchEvent(new CustomEvent('reading:layout'));}   // a render mid-drum keeps the drum going
  syncChoice();
  controls!.querySelector<HTMLElement>('[data-artifact-status]')!.textContent=`${count} ${count===1?'artifact':'artifacts'}`;
 }
 controls.hidden=false;
 controls.querySelectorAll<HTMLButtonElement>('[data-artifact-mode]').forEach(button=>button.addEventListener('click',()=>{const next=button.dataset.artifactMode as ArtifactMode;if(next===mode)return;mode=next;syncChoice();reprint=true;scheduleRender();}));
 controls.querySelector<HTMLSelectElement>('[data-artifact-filter]')!.addEventListener('change',event=>{const next=(event.target as HTMLSelectElement).value;if(next===filter)return;filter=next;clearTimeout(renderTimer);reprint=true;render();});
 root.addEventListener('design:updated',event=>{config=(event as CustomEvent<DesignConfig>).detail;render();});
}
