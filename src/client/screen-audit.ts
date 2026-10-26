import '../styles/screen-audit.css';
import {design} from '../config/design';
import {resolve,type DesignConfig} from '../design/settings';
import {screen,type ScreenLevel} from '../design/screen';
const labels={coarse:'字级',medium:'图像',fine:'平网'};
export function initScreenAudit(root:HTMLElement){
 let config:DesignConfig=design,raf=0,last='';
 const overlay=document.createElement('div');overlay.className='he-screen-audit-layer';overlay.setAttribute('aria-hidden','true');root.append(overlay);
 function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}
 function draw(){
  overlay.replaceChildren();if(root.dataset.screenAudit!=='true')return;
  const page=root.getBoundingClientRect(),s=resolve(config).values,levels=new Map<string,Set<number>>(),issues:string[]=[];
  for(const el of root.querySelectorAll<HTMLElement>('[data-screen-level]')){
   const box=el.getBoundingClientRect();
   if(!box.width||!box.height||el.closest('[aria-hidden="true"].he-page'))continue;
   let hidden=false;
   for(let n:Element|null=el;n&&n!==root;n=n.parentElement){const style=getComputedStyle(n);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0){hidden=true;break;}}
   if(hidden||box.right<=page.left||box.left>=page.right)continue;
   const level=el.dataset.screenLevel!,pitch=Number(el.dataset.screenPitch),font=Number(el.dataset.screenFontSize)||128;
   const valid=Object.hasOwn(labels,level),angles=JSON.parse(el.dataset.screenAngles||'{}'),shapes=JSON.parse(el.dataset.screenShapes||'{}');
   const expected=valid?screen(level as ScreenLevel,'b',s,font):null;
   let problem=!expected||pitch!==expected.pitch||!Number.isInteger(pitch);
   for(const ink of ['a','b'] as const)if(el.dataset.screenInks?.includes(ink)){
    const spec=screen(valid?level as ScreenLevel:'medium',ink,s,font);
    if(angles[ink]!==spec.angle||shapes[ink]!==spec.shape)problem=true;
   }
   if(!levels.has(level))levels.set(level,new Set());levels.get(level)!.add(pitch);
   if(problem)issues.push(level);
   const mark=document.createElement('div');mark.className='he-screen-audit-mark';mark.dataset.level=level;
   mark.dataset.issue=String(problem);mark.style.cssText=`left:${box.left-page.left}px;top:${box.top-page.top}px;width:${box.width}px;height:${box.height}px`;
   const tag=document.createElement('span');tag.textContent=`${valid?labels[level as ScreenLevel]:'未知档'} · ${pitch}px${problem?' · 检查参数':''}`;mark.append(tag);overlay.append(mark);
  }
  const summary=[...levels].map(([level,pitches])=>`${labels[level as ScreenLevel]||level} ${[...pitches].sort((a,b)=>a-b).join('/')}px`).join('；');
  const message=`当前页面：${levels.size} 档${summary?'（'+summary+'）':''}。${issues.length?`${issues.length} 处参数偏离规则。`:'网距、每墨网角与点形一致。'} 蓝 ${s.primaryAngle}° / 红 ${s.secondaryAngle}°；小字与实色不计入。`;
  if(message!==last){parent.postMessage({type:'design:screen-report',message},location.origin);last=message;}
 }
 root.addEventListener('design:updated',e=>{config=(e as CustomEvent<DesignConfig>).detail;schedule();});
 for(const event of ['design:screen-rendered','design:proof-updated','transitionend'])root.addEventListener(event,schedule);
 new ResizeObserver(schedule).observe(root);window.addEventListener('resize',schedule);
}
