import {artifacts,artifactCategories} from '../data/content';
import {artifactGroups,type ArtifactMode} from '../data/catalog';
import {artifactComposition,placements} from '../config/compositions';
import {design} from '../config/design';
import {resolve,styleText,designAttributes,type DesignConfig} from '../design/settings';
const root=document.querySelector<HTMLElement>('#personal-site');
const host=root?.querySelector<HTMLElement>('.he-artifact-groups');
const controls=root?.querySelector<HTMLElement>('.he-artifact-controls');
if(root&&host&&controls){
 const cards=new Map([...host.querySelectorAll<HTMLElement>('[data-content-id]')].map(el=>[el.dataset.contentId!.replace(/^artifact-/,''),el]));
 let mode:ArtifactMode='date',filter='all',config:DesignConfig=design;
 function render(){
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
  host!.replaceChildren(sections);root!.dispatchEvent(new CustomEvent('reading:layout'));
  controls!.querySelectorAll<HTMLButtonElement>('[data-artifact-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.artifactMode===mode)));
  controls!.querySelector<HTMLElement>('[data-artifact-status]')!.textContent=`${count} ${count===1?'artifact':'artifacts'}`;
 }
 controls.hidden=false;
 controls.querySelectorAll<HTMLButtonElement>('[data-artifact-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.artifactMode as ArtifactMode;render();}));
 controls.querySelector<HTMLSelectElement>('[data-artifact-filter]')!.addEventListener('change',event=>{filter=(event.target as HTMLSelectElement).value;render();});
 root.addEventListener('design:updated',event=>{config=(event as CustomEvent<DesignConfig>).detail;render();});
}
