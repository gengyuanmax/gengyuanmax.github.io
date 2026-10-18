// Keep native touch, wheel and keyboard scrolling; add mouse grab-to-scroll.
for(const region of document.querySelectorAll<HTMLElement>('.he-news-scroll')){
 let drag:{id:number;y:number;top:number;active:boolean}|null=null, suppressClick=false;
 region.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.button!==0)return;
  suppressClick=false;drag={id:e.pointerId,y:e.clientY,top:region.scrollTop,active:false};
 });
 region.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.active&&Math.abs(e.clientY-drag.y)<6)return;
  if(!drag.active){drag.active=true;region.setPointerCapture(e.pointerId);region.dataset.dragging='';}
  e.preventDefault();region.scrollTop=drag.top+drag.y-e.clientY;
 });
 const finish=(e:PointerEvent)=>{
  if(!drag||e.pointerId!==drag.id)return;
  suppressClick=drag.active;drag=null;delete region.dataset.dragging;
  if(region.hasPointerCapture(e.pointerId))region.releasePointerCapture(e.pointerId);
 };
 window.addEventListener('pointerup',finish);
 region.addEventListener('pointercancel',finish);
 region.addEventListener('lostpointercapture',()=>{drag=null;delete region.dataset.dragging;});
 region.addEventListener('dragstart',e=>e.preventDefault());
 region.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);
}
