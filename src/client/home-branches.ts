/** Enhance the shared Home markup with decorative branch paths. The semantic
 * heading/list relationship and all project links are already in the HTML. */
const root=document.querySelector<HTMLElement>('#personal-site');
const home=root?.querySelector<HTMLElement>('.he-home');
const research=home?.querySelector<HTMLElement>('.he-home-research');
const svg=research?.querySelector<SVGSVGElement>('.he-home-branches');
if(root&&home&&research&&svg){
 const brand=research.querySelector<HTMLElement>('.he-brand')!;
 const overview=research.querySelector<HTMLElement>('.he-research-overview')!;
 const nodes=[...overview.querySelectorAll<HTMLElement>('.he-pillars>li')];
 const ns='http://www.w3.org/2000/svg';let raf=0;
 function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}
 function draw(){
  if(!root||!home||!research||!svg||home.getAttribute('aria-hidden')==='true')return;
  const box=research.getBoundingClientRect(),heading=brand.querySelector('h2')!.getBoundingClientRect(),items=nodes.map(el=>el.getBoundingClientRect());
  if(!box.width||!box.height||items.length!==3)return;
  const side=getComputedStyle(research).getPropertyValue('--home-branch-layout').trim()==='side';
  svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.replaceChildren();
  const xy=(x:number,y:number)=>`${(x-box.left).toFixed(1)} ${(y-box.top).toFixed(1)}`;
  let start:{x:number;y:number},paths:string[];
  if(side){
   start={x:heading.right+12,y:heading.top+heading.height*.5};
   const endX=items[0].left-12,trunk=start.x+Math.max(12,(endX-start.x)*.3);
   paths=items.map(r=>`M ${xy(start.x,start.y)} H ${(trunk-box.left).toFixed(1)} V ${(r.top+16-box.top).toFixed(1)} H ${(endX-box.left).toFixed(1)}`);
  }else{
   start={x:items[0].left-18,y:heading.bottom+14};
   paths=items.map(r=>`M ${xy(start.x,start.y)} V ${(r.top+13-box.top).toFixed(1)} H ${(r.left-5-box.left).toFixed(1)}`);
  }
  for(const ink of ['a','b']){const path=document.createElementNS(ns,'path');path.setAttribute('d',paths.join(' '));path.classList.add(`he-branch-${ink}`);svg.append(path);}
  const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',String(start.x-box.left));dot.setAttribute('cy',String(start.y-box.top));dot.setAttribute('r','4');svg.append(dot);
 }
 const observer=new ResizeObserver(schedule);[home,research,brand,overview,...nodes].forEach(el=>observer.observe(el));
 new MutationObserver(schedule).observe(home,{attributes:true,attributeFilter:['aria-hidden']});
 document.fonts.ready.then(schedule);window.addEventListener('resize',schedule);root.addEventListener('design:updated',schedule);schedule();
}
