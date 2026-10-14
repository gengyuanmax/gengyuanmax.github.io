import {design} from '../config/design';
import {resolve,getPalette,type DesignConfig} from '../design/settings';
import {buildPortraitFlow,rasterizeDots,type PortraitGeometry} from '../design/portrait-flow';
import {preparePortrait,hexRGB} from '../design/portrait-plates';
import {portraitSource} from '../design/portrait-source';
import type {Pixels} from '../design/print';
const root=document.querySelector<HTMLElement>('#personal-site');
const home=root?.querySelector<HTMLElement>('.he-home');
const img=home?.querySelector<HTMLImageElement>('.he-portrait img');
const canvas=home?.querySelector<HTMLCanvasElement>('.he-portrait-flow');
const plate=home?.querySelector<HTMLElement>('[data-style-element="plate-home"]');
const news=home?.querySelector<SVGSVGElement>('[data-print-field="mark-news"]');
if(root&&home&&img&&canvas&&news){
 let config:DesignConfig=design,frame=0,sampled:Pixels|undefined;
 const raw=new Image();raw.onload=()=>{
  const input=document.createElement('canvas');input.width=raw.naturalWidth;input.height=raw.naturalHeight;
  const ctx=input.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(raw,0,0);
  sampled={width:input.width,height:input.height,data:ctx.getImageData(0,0,input.width,input.height).data};schedule();
 };raw.src=portraitSource.cutout;
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(render);}
 function render(){
  if(!root||!home||!img||!canvas||!news)return;
  const cue=resolve(config,'home','home-bridge').values,s=resolve(config,'home','home-portrait').values,mark=resolve(config,'home','mark-news').values;
  if(cue.cueStyle!=='portrait'||s.portraitMaterial!=='press'||!sampled||!img.complete||!img.clientWidth||!home.getBoundingClientRect().height){delete home.dataset.portraitFlow;return;}
  try {
   const page=home.getBoundingClientRect(),image=img.getBoundingClientRect(),matrix=news.getScreenCTM();if(!matrix)return;
   const width=img.clientWidth,height=img.clientHeight,tilt=s.portraitTilt;
   const a=tilt*Math.PI/180,c=Math.cos(a),sin=Math.sin(a),ox=width*.5,oy=height*.8;
   const corners=[[0,0],[width,0],[0,height],[width,height]].map(([x,y])=>({x:ox+(x-ox)*c-(y-oy)*sin,y:oy+(x-ox)*sin+(y-oy)*c}));
   const point=(x:number,y:number)=>({x:matrix.a*x+matrix.c*y+matrix.e-page.left,y:matrix.b*x+matrix.d*y+matrix.f-page.top});
   const scale=Math.hypot(matrix.a,matrix.b),center=point(185+(1-mark.fieldOverlap)*35,107),radius=87*scale;
   const g:PortraitGeometry={origin:{x:image.left-page.left-Math.min(...corners.map(p=>p.x)),y:image.top-page.top-Math.min(...corners.map(p=>p.y))},width,height,tilt,target:{x:center.x-radius*.85,y:center.y},news:{center,radius,coverage:mark.fieldCoverage,ring:point(137-(1-mark.fieldOverlap)*35,112),ringRadius:73*scale,ringWidth:26*scale}};
   const plateRect=plate?.getBoundingClientRect();
   const ground=resolve(config,'home','plate-home').values;
   if(plateRect&&ground.groundOpacity>0)g.plate={left:plateRect.left-page.left,top:plateRect.top-page.top,right:plateRect.right-page.left};
   const recipe={black:s.pressBlack,white:s.pressWhite,contrast:s.contrast,levels:s.pressLevels,gain:s.dotGain,starvation:s.starvation,grain:s.pressGrain,seed:s.seed};
   const prepared=preparePortrait(sampled,recipe),palette=getPalette(config,s.palette),inks:[ReturnType<typeof hexRGB>,ReturnType<typeof hexRGB>]=[hexRGB(palette.secondary),hexRGB(palette.primary)];
   const result=buildPortraitFlow(prepared,g,{start:cue.cuePhotoStart,pitch:s.printPitch,angle:s.printAngle,blueAngle:s.pressBlueAngle,bend:cue.cueCurveDepth,width:cue.cueTailWidth,density:cue.cueEdgeDensity,growth:cue.cueGrowth,offset:{x:s.registration,y:s.registrationY},recipe});
   if(!result.dots.length){delete home.dataset.portraitFlow;return;}
   const top=Math.floor(result.bounds.top-10),bottom=Math.ceil(result.bounds.bottom+10);
   const dpr=window.devicePixelRatio||1,cw=home.clientWidth,ch=Math.max(1,bottom-top);
   canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);canvas.style.cssText=`left:0;top:${top}px;width:${cw}px;height:${ch}px`;
   const rendered=rasterizeDots(result.dots,inks,canvas.width,canvas.height,top,dpr,s.pressGrain,s.seed);
   canvas.getContext('2d')!.putImageData(new ImageData(rendered.data,canvas.width,canvas.height),0,0);
   home.dataset.portraitFlow='ready';canvas.dataset.flowVersion=result.version;
   canvas.dataset.printRecipe=JSON.stringify({pitch:s.printPitch,angles:[s.printAngle,s.pressBlueAngle],inks,offset:[s.registration,s.registrationY],grain:s.pressGrain,levels:s.pressLevels,source:portraitSource.version,tailLength:result.path.at(-1)!.d,tailEndWidth:width*.68*cue.cueTailWidth,newsRadius:radius});
  } catch(error){delete home.dataset.portraitFlow;console.warn('Portrait print unavailable; keeping static proof.',error);}
 }
 const observer=new ResizeObserver(schedule);[home,img,news].forEach(el=>observer.observe(el));
 img.addEventListener('load',schedule);img.addEventListener('error',()=>{delete home.dataset.portraitFlow;});
 window.addEventListener('resize',schedule);
 root.addEventListener('design:updated',event=>{config=(event as CustomEvent<DesignConfig>).detail;schedule();});
 void document.fonts.ready.then(schedule);schedule();
}
