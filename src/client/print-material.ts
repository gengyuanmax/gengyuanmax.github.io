import {paperOrigin,textCoverage,pixelSurface,publishCanvas,svgCoverage,createPrintMount} from '../design/print-pipeline/browser';
import {typeScreenLevel} from '../design/screen';
import {recordScreen,clearScreen} from './screen-data';
import {design} from '../config/design';
import {resolve,getPalette,type DesignConfig,type Area} from '../design/settings';
import {renderFieldOriginals,type FieldOriginal,onSheet,screenOriginal,paintMaterial,pressSettings,elementPress,materialVersion,textTextureVersion,textTier} from '../design/print-pipeline/index';
import {rgb} from '../design/element-composition';
import {makeToneField,toneSettings} from '../design/tone-field';
import {rememberTone} from './tone-proof';

const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 let config:DesignConfig=design,frame=0,generation=0;
 const mounts=new WeakMap<SVGSVGElement,ReturnType<typeof createPrintMount>>();
 const inkMounts=new WeakMap<HTMLElement,ReturnType<typeof createPrintMount>>();
 const observer=new ResizeObserver(schedule);
 root.querySelectorAll<HTMLElement>('.he-page').forEach(el=>observer.observe(el));
 root.querySelectorAll<SVGSVGElement>('[data-print-field]').forEach(el=>observer.observe(el));
 root.querySelectorAll<HTMLElement>('.he-type-line').forEach(el=>observer.observe(el));
 root.querySelectorAll<HTMLElement>('.he-project-ground,.he-divider-band').forEach(el=>observer.observe(el));
 function textureMask(el:HTMLElement,ink:'a'|'b',s:ReturnType<typeof resolve>['values'],letterScreen=false){
  const dpr=Math.max(1,devicePixelRatio||1),w=Math.round((el.clientWidth||el.offsetWidth)*dpr),h=Math.round((el.clientHeight||el.offsetHeight)*dpr);if(!w||!h)return;
  const ground=el.matches('.he-project-ground,.he-divider-band'),owner=el.closest<HTMLElement>('[data-style-element]')!;
  const identity=(owner?.dataset.styleElement||'shared-type')+(ground?'':':'+(el.dataset.inkCopy||el.textContent));
  const fontSize=parseFloat(getComputedStyle(el).fontSize);
  const level=ground?'fine':letterScreen?(typeScreenLevel(fontSize)??'fine'):'coarse';
  let p=elementPress(pressSettings(s,level,fontSize),identity,ground?'field':'title',fontSize);
  const origin=paperOrigin(el,(el.closest('.he-page')||root!) as HTMLElement);
  p=onSheet(p,resolve(config).values.seed,origin,(el.closest<HTMLElement>('.he-page')||root!).offsetHeight);
  const style=getComputedStyle(el);
  const key=JSON.stringify([textTextureVersion,style.fontFamily,style.fontSize,style.fontWeight,style.fontVariationSettings,style.letterSpacing,el.textContent,document.fonts.status,w,h,p,ink,ground||letterScreen?origin:null,ground?s.groundOpacity:null,letterScreen,s.titleDotRadius]);let mount=inkMounts.get(el);if(!mount){mount=createPrintMount();inkMounts.set(el,mount);}const ticket=mount.begin(key);if(!ticket)return;
  let flat:Float32Array=new Float32Array(w*h).fill(ground?s.groundOpacity:1);
  if(ground){
   const rim=Math.max(1,Math.round(p.edge*dpr));
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x<rim||y<rim||x>=w-rim||y>=h-rim)flat[y*w+x]=0;
   const tone=makeToneField(flat,w,h,dpr,'plane',toneSettings(s),p.seed);
   flat=screenOriginal(identity,{kind:'shape',mask:flat,tone},w,h,ink,p,dpr,origin);
   if(import.meta.env.DEV)rememberTone(identity,tone,flat,w,h,dpr);
   el.dataset.toneSource='plane';
  }
  if(!ground){
   const glyph=letterScreen?textCoverage(el,w,h,dpr):flat;
   flat=screenOriginal(identity,{kind:'text',mask:glyph,tone:glyph},w,h,ink,p,dpr,origin,!letterScreen,{size:fontSize,dotted:letterScreen,radius:s.titleDotRadius});
  }
  if(ground||letterScreen)recordScreen(el,p,ink,letterScreen?fontSize:undefined);else clearScreen(el);
  // Text already has its one bounded transfer stage; never apply image grain again.
  const data=ground?paintMaterial([{ink,coverage:flat}],w,h,{a:[0,0,0],b:[0,0,0],paper:[255,255,255]},{...p,offset:{x:0,y:0}},dpr):new Uint8ClampedArray(w*h*4);
  for(let i=0;i<data.length;i+=4){const alpha=ground?255-data[i]:255*flat[i/4];data[i]=data[i+1]=data[i+2]=0;data[i+3]=alpha;}
  const canvas=pixelSurface(data,w,h);
  const url=canvas.toDataURL();ticket.commit(()=>{el.style.maskImage=`url(${url})`;el.style.maskSize='100% 100%';el.dataset.materialMask='true';});
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>void render());}
 async function render(){
  const run=++generation;
  await document.fonts.ready;if(run!==generation)return;
  root!.querySelectorAll<HTMLElement>('.he-type-line').forEach(el=>{
   const size=parseFloat(getComputedStyle(el).fontSize),large=size>=24;el.dataset.pressLarge=String(large);el.dataset.pressFine=String(size<24);el.dataset.textTier=textTier(size);
   if(el.closest('.he-page')?.getAttribute('aria-hidden')==='true')return;
   const owner=el.closest<HTMLElement>('[data-style-element]'),area=owner?.dataset.styleAreaOwner||el.closest<HTMLElement>('[data-style-area]')?.dataset.styleArea;
   const s=resolve(config,area as Area|undefined,owner?.dataset.styleElement).values;
   for(const ink of ['a','b'] as const){const layer=el.querySelector<HTMLElement>(`.he-type-${ink}`);if(!layer)continue;
    const dotted=size>=72&&s.titleTreatment==='dotted'&&ink==='b'&&typeScreenLevel(size)!==null;
    if(size>=24)textureMask(layer,ink,s,dotted);else{layer.style.removeProperty('mask-image');delete layer.dataset.materialMask;inkMounts.get(layer)?.invalidate();clearScreen(layer);}
   }
  });
  root!.querySelectorAll<HTMLElement>('.he-project-ground').forEach(el=>{
   if(el.closest('.he-page')?.getAttribute('aria-hidden')==='true')return;
   const s=resolve(config,el.dataset.styleAreaOwner as Area,el.dataset.styleElement).values;if(s.groundOpacity===0){clearScreen(el);return;}
   textureMask(el,s.groundInk==='primary'?'b':'a',s);
  });
  root!.querySelectorAll<HTMLElement>('.he-divider-band').forEach(el=>{
   const s=resolve(config,'home').values;
   if(s.homeDividerStyle!=='print'){clearScreen(el);inkMounts.get(el)?.invalidate();return;}
   textureMask(el,'b',{...s,groundOpacity:s.homeDividerCoverage});
  });
  for(const svg of root!.querySelectorAll<SVGSVGElement>('[data-print-field]')){
   const bounds=svg.getBoundingClientRect();if(!bounds.width||!bounds.height)continue;
   if(svg.closest('.he-page')?.getAttribute('aria-hidden')==='true')continue;
   const el=svg.parentElement!,page=svg.closest<HTMLElement>('.he-page')!;
   const s=resolve(config,svg.dataset.printArea as Area,svg.dataset.printField).values,global=resolve(config).values;
   let p=elementPress(pressSettings({...s,registration:global.registration,registrationY:global.registrationY}),svg.dataset.printField!,'field');
   const dpr=Math.max(1,devicePixelRatio||1),w=Math.round(svg.clientWidth*dpr),h=Math.round(svg.clientHeight*dpr),origin=paperOrigin(svg,page);
   const palette=getPalette(config,s.palette),proof=root!.dataset.typeProof,key=JSON.stringify([w,h,s.fieldCoverage,s.fieldOverlap,page.offsetHeight,p,global.seed,palette,origin,proof]);p=onSheet(p,global.seed,origin,page.offsetHeight);let mount=mounts.get(svg);if(!mount){mount=createPrintMount();mounts.set(svg,mount);}const ticket=mount.begin(key);if(!ticket)continue;
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
    const {pixels,tones,screens}=renderFieldOriginals(originals,w,h,dpr,origin,p,s,{a:proof==='blue'?[255,255,255]:rgb(palette.secondary),b:proof==='red'?[255,255,255]:rgb(palette.primary),paper:[255,255,255]});
    if(import.meta.env.DEV)originals.forEach((item,i)=>{if(item.screened)rememberTone(`${svg.dataset.printField}:${item.ink}:${item.index}`,tones[i],screens[i],w,h,dpr);});
    let canvas=el.querySelector<HTMLCanvasElement>('.he-material-field');
    if(!canvas){canvas=document.createElement('canvas');canvas.className='he-material-field';canvas.setAttribute('aria-hidden','true');el.append(canvas);}
    const prepared=pixelSurface(pixels,w,h);
    ticket.commit(()=>{publishCanvas(canvas!,prepared);el.dataset.materialReady='true';});
    recordScreen(canvas,p,[...screenedInks].join('') as 'a'|'b'|'ab');
    canvas.dataset.pressRecipe=JSON.stringify({level:p.level,shapes:p.shapes,pitch:p.pitch,angles:p.angles,offset:p.offset,origin,tone:p.tone,units:'CSS px',materialVersion});

   }catch(error){console.warn('Keeping pre-rendered print fallback.',error);}
  }
  root!.dispatchEvent(new CustomEvent('design:screen-rendered'));
 }
 root.addEventListener('design:updated',e=>{config=(e as CustomEvent<DesignConfig>).detail;schedule();});
 root.addEventListener('design:type-updated',()=>{root!.querySelectorAll<HTMLElement>('.he-type-line').forEach(el=>observer.observe(el));schedule();});
 root.addEventListener('design:proof-updated',schedule);
 root.addEventListener('transitionend',schedule);window.addEventListener('resize',schedule);void document.fonts.ready.then(schedule);schedule();
 const pageObserver=new MutationObserver(schedule);root.querySelectorAll('.he-page').forEach(page=>pageObserver.observe(page,{attributes:true,attributeFilter:['aria-hidden']}));
}
