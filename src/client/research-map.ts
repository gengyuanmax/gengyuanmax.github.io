import {paperOrigin,drawAnchorProof,polygonSurface,pixelSurface,compositeCanvas,createPrintMount,type CanvasPlate} from '../design/print-pipeline/browser';
import {design} from '../config/design';
import {getPalette,resolve,type DesignConfig} from '../design/settings';
import {researchRecipe,paperPixels,type ResearchRecipe,type ResearchState} from '../design/research-render';
import {researchPrintOrder,researchTransfer,type PlateId} from '../design/research-plates';
import {directions,type DirectionId} from '../data/research-map';
import {researchLabelArc} from '../design/research-geometry';
const root=document.querySelector<HTMLElement>('#personal-site'),map=root?.querySelector<HTMLElement>('.research-map');
if(root&&map){
 const canvas=map.querySelector<HTMLCanvasElement>('.rm-inks')!,diagram=map.querySelector<HTMLElement>('.rm-diagram')!;
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),links=[...map.querySelectorAll<HTMLAnchorElement>('a[data-memberships]')],open=map.querySelector<HTMLAnchorElement>('.rm-open')!;
 let config:DesignConfig=design,recipe:ResearchRecipe,dpr=1,selected:HTMLAnchorElement|null=null,touch=false,entered=false,animation=0,resizeTimer=0,generation=0;
 let transitionFrom:ResearchRecipe['transforms']|null=null,transitionProgress=1;
 const targetTransforms=(active?:DirectionId)=>Object.fromEntries(directions.map(d=>[d.plate,active===d.id&&!motion.matches?{x:0,y:0,rotation:0,scale:1}:recipe.transforms[d.plate]])) as ResearchRecipe['transforms'];
 let states:Record<PlateId,Record<ResearchState,HTMLCanvasElement>>,paper:HTMLCanvasElement;
 const mount=createPrintMount();
 function placeLabels(){
  if(!recipe)return;
  links.forEach(link=>{
   const arc=researchLabelArc(recipe.geometry,link.dataset.memberships as DirectionId,recipe.scale);
   const path=link.querySelector<SVGPathElement>('.rm-label-hit')!,text=link.querySelector<SVGTextElement>('text')!;
   path.setAttribute('d',arc.path);path.setAttribute('stroke-width',String(28/recipe.scale));text.style.fontSize=`${arc.fontSize}px`;
  });
 }
 function composite(entryElapsed?:number){
  if(!recipe)return;
  const s=resolve(config,'home').values,active=selected?.dataset.memberships as DirectionId|undefined;
  const proof=root!.dataset.typeProof;
  const layers:CanvasPlate[]=[];
  for(const id of researchPrintOrder){
   if(proof==='blue'&&id!=='blue'||proof==='red'&&id!=='orange'||proof==='yellow'&&id!=='yellow')continue;
   const direction=directions.find(d=>d.plate===id)!,state:ResearchState=active===direction.id?'active':active?'quiet':'normal';
   const order=['blue','orange','yellow'].indexOf(id),progress=entryElapsed===undefined?1:Math.max(0,Math.min(1,(entryElapsed-order*250)/220));
   if(!progress)continue;
   const target=targetTransforms(active)[id],from=transitionFrom?.[id]??target,t={x:from.x+(target.x-from.x)*transitionProgress,y:from.y+(target.y-from.y)*transitionProgress,rotation:from.rotation+(target.rotation-from.rotation)*transitionProgress,scale:from.scale+(target.scale-from.scale)*transitionProgress};
   const ease=1-(1-progress)**3;
   layers.push({surface:states[id][state],transfer:researchTransfer,transform:{...t,x:t.x+(1-ease)*6,y:t.y+(1-ease)*6}});
  }
  compositeCanvas(canvas,paper,layers,recipe.width,recipe.height,dpr);
  if(s.researchAnchors==='on'){
   drawAnchorProof(canvas,Object.values(recipe.geometry.anchors).map(p=>({x:p.x*recipe.scale,y:p.y*recipe.scale})),getPalette(config,s.palette).primary,dpr);
  }
 }
 function rebuild(){
  const s=resolve(config,'home').values;map!.dataset.view=s.researchView;root!.dataset.researchView=s.researchView;
  const width=diagram.clientWidth;if(!width)return;
  dpr=Math.max(1,devicePixelRatio||1);
  const sheet={seed:resolve(config).values.seed,origin:paperOrigin(diagram,map!.closest<HTMLElement>('.he-page')!),height:map!.closest<HTMLElement>('.he-page')!.offsetHeight};
  const next=researchRecipe(s,config,width,undefined,sheet),key=JSON.stringify([s,sheet,next.plates,next.seed,width,dpr]);const ticket=mount.begin(key);if(!ticket){placeLabels();return;}
  cancelAnimationFrame(animation);transitionFrom=null;transitionProgress=1;map!.classList.remove('rm-entering');
  const pixels=paperPixels(next,dpr);const nextPaper=pixelSurface(pixels.rgba,pixels.width,pixels.height);
  const nextStates={} as typeof states;
  const counts:Record<string,number>={};
  for(const d of directions){
   nextStates[d.plate]={} as Record<ResearchState,HTMLCanvasElement>;
   for(const state of ['normal','active','quiet'] as const){
    const dots=next.stateDots(d.id,state),offscreen=polygonSurface(dots,next.plates[d.plate].color,width,next.height,dpr);
    nextStates[d.plate][state]=offscreen;counts[`${d.plate}:${state}`]=dots.length;
   }
  }
  map!.dataset.renderGeneration=String(++generation);map!.dataset.researchSeed=String(next.seed);canvas.dataset.plateDots=JSON.stringify(counts);canvas.dataset.pressRecipe=JSON.stringify({pitch:s.researchPitch,dpr,seed:next.seed,transforms:next.transforms,angles:Object.fromEntries(Object.entries(next.plates).map(([id,p])=>[id,p.angle])),noise:[s.researchInkNoise,s.researchFeedNoise,s.researchFiberNoise]});
  ticket.commit(()=>{recipe=next;paper=nextPaper;states=nextStates;composite();map!.dataset.canvasReady='true';});placeLabels();
 }
 function highlight(a:HTMLAnchorElement|null){
  if(!recipe)return;
  cancelAnimationFrame(animation);map!.classList.remove('rm-entering');transitionFrom=targetTransforms(selected?.dataset.memberships as DirectionId|undefined);selected=a;open.hidden=!a;if(a)open.href=a.href;links.forEach(link=>link.dataset.active=String(link===a));
  if(motion.matches){transitionProgress=1;composite();return;}
  const start=performance.now();const frame=(now:number)=>{const t=Math.min(1,(now-start)/220);transitionProgress=1-(1-t)**3;composite();if(t<1)animation=requestAnimationFrame(frame);else transitionFrom=null;};animation=requestAnimationFrame(frame);
 }
 links.forEach(a=>{
  a.addEventListener('pointerdown',e=>{touch=e.pointerType==='touch';});
  a.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){touch=false;highlight(a);}});
  a.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&document.activeElement!==a)highlight(null);});
  a.addEventListener('focus',()=>{if(!touch)highlight(a);});a.addEventListener('blur',()=>{if(!touch)highlight(null);});
  a.addEventListener('click',e=>{if(touch){e.preventDefault();highlight(selected===a?null:a);}});
 });
 map.addEventListener('keydown',e=>{if(e.key==='Escape')highlight(null);});
 function enter(){
  cancelAnimationFrame(animation);if(motion.matches||resolve(config,'home').values.researchView==='tree'){composite();return;}
  transitionFrom=null;transitionProgress=1;map!.classList.add('rm-entering');const start=performance.now();
  const frame=(now:number)=>{const elapsed=now-start;composite(elapsed);if(elapsed<720)animation=requestAnimationFrame(frame);else{map!.classList.remove('rm-entering');composite();}};animation=requestAnimationFrame(frame);
 }
 function schedule(){clearTimeout(resizeTimer);resizeTimer=window.setTimeout(rebuild,200);}
 motion.addEventListener('change',()=>{cancelAnimationFrame(animation);transitionFrom=null;transitionProgress=1;map!.classList.remove('rm-entering');composite();});
 rebuild();const layoutObserver=new ResizeObserver(schedule);layoutObserver.observe(diagram);layoutObserver.observe(map.closest('.he-page')!);window.addEventListener('resize',schedule);void document.fonts.ready.then(schedule);
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!entered){entered=true;enter();observer.disconnect();}},{threshold:.25});observer.observe(map);
 root.addEventListener('design:updated',e=>{config=(e as CustomEvent<DesignConfig>).detail;rebuild();});
 root.addEventListener('design:proof-updated',()=>composite());root.addEventListener('research:replay',enter);
}
