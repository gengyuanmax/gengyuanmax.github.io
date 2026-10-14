import {paperOrigin,pixelSurface,cropSurface,publishCanvas,createPrintMount} from '../design/print-pipeline/browser';
import {recordScreen} from './screen-data';
import {design} from '../config/design';
import {selectedComposition as recipe,portraitViewport as view,portraitScreenLevel} from '../config/portrait-composition';
import {canvasLayers,paintComposition,type CompositionChoice} from '../design/composition-canvas';
import {getPalette,resolve,type DesignConfig} from '../design/settings';
import type {Operation} from '../design/element-composition';
import {onSheet,pressSettings,elementPress,materialVersion} from '../design/print-pipeline/index';
import {rememberTone} from './tone-proof';
const root=document.querySelector<HTMLElement>('#personal-site');
const figure=root?.querySelector<HTMLElement>('.he-portrait');
const canvas=figure?.querySelector<HTMLCanvasElement>('.he-portrait-composition');
const fallback=figure?.querySelector<HTMLImageElement>('img');
if(root&&figure&&canvas&&fallback){
 let config:DesignConfig=design,frame=0,loaded=false;const mount=createPrintMount();
 const input=new Image();input.onload=()=>{loaded=true;schedule();};input.src=recipe.photoSource.cutout;
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(render);}
 function render(){
  if(!figure||!canvas||!fallback)return;
  const s=resolve(config,'home','home-portrait').values;
  const home=figure.closest<HTMLElement>('.he-home');if(home)home.dataset.portraitComposition=String(s.portraitMaterial==='composition');
  if(s.portraitMaterial!=='composition'){delete figure.dataset.compositionReady;mount.invalidate();return;}
  if(!loaded||!fallback.clientWidth)return;
  try{
   const palette=getPalette(config,s.palette),dpr=Math.max(window.devicePixelRatio||1,1);
   const choice:CompositionChoice={op:s.compositionOperation as Operation,shape:s.compositionShape,pitch:s.compositionPitch,mis:s.compositionMis};
   const width=Math.round(fallback.clientWidth*dpr),fullWidth=Math.round(width*recipe.sheet.width/view.width);
   let press=elementPress(pressSettings({...s,registration:resolve(config).values.registration,registrationY:resolve(config).values.registrationY},portraitScreenLevel),'home-portrait','image');
   const position=paperOrigin(fallback,home!),unit=fallback.clientWidth/view.width;
   const origin={x:position.x-view.x*unit,y:position.y-view.y*unit};
   press=onSheet(press,resolve(config).values.seed,origin,home!.offsetHeight);
   const proof=root!.dataset.typeProof,signature=JSON.stringify([fullWidth,choice,palette,press,origin,proof]);const ticket=mount.begin(signature);if(!ticket)return;
   const layers=canvasLayers(input,recipe,choice,fullWidth,{settings:press,scale:dpr,origin});
   if(import.meta.env.DEV)rememberTone('home-portrait:geometry',layers.geometryTone,layers.a.print,layers.width,layers.height,dpr);
   // White is the neutral carrier: CSS multiply prints directly into the site's
   // paper and paper texture instead of baking a second paper rectangle.
   const data=paintComposition(layers,recipe,choice,{a:proof==='blue'?'#ffffff':palette.secondary,b:proof==='red'?'#ffffff':palette.primary,paper:'#ffffff'});
   const sheet=pixelSurface(data,layers.width,layers.height);
   const prepared=cropSurface(sheet,{x:view.x*layers.r,y:view.y*layers.r,width:view.width*layers.r,height:view.height*layers.r},width,Math.round(width*view.height/view.width));
   ticket.commit(()=>{publishCanvas(canvas,prepared);figure.dataset.compositionReady='true';});
   recordScreen(canvas,press,'ab');
   canvas.dataset.compositionRecipe=JSON.stringify({op:choice.op,shape:choice.shape,screenLevel:press.level,dotShapes:press.shapes,pitch:press.pitch,angles:press.angles,offset:press.offset,tone:press.tone,grain:press.grain,grainDeviceSize:Math.min(2,press.cluster,press.pitch*dpr*.3),grainAffectedArea:press.holes,starvation:press.starve,gain:press.gain,units:'CSS px except grainDeviceSize',dpr,seed:press.seed,sourceVersion:recipe.sourceVersion,materialVersion});
   root!.dispatchEvent(new CustomEvent('design:screen-rendered'));
  }catch(error){console.warn('Keeping the static composition proof.',error);}
 }
 const observer=new ResizeObserver(schedule);observer.observe(fallback);observer.observe(figure.closest('.he-page')!);
 root.addEventListener('design:updated',e=>{config=(e as CustomEvent<DesignConfig>).detail;schedule();});
 root.addEventListener('design:proof-updated',schedule);
 window.addEventListener('resize',schedule);fallback.addEventListener('load',schedule);schedule();
}
