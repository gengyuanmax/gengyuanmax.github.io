import {printMask} from './print-jobs';
import {onSheet,pressSettings,elementPress,routeVersion} from '../design/print-pipeline/index';
import {toneSettings} from '../design/tone-field';
import {resolve,type DesignConfig} from '../design/settings';
import type {MetroTile} from '../design/reading-route';
/** Metro-line guides printed like every other ground: their geometry (route-v2) is the
 * coverage of a plane that the shared material pipeline screens (fine tier) and
 * transfers on the page sheet, in a worker. Each tile is a box whose mask is the print. */
export const routeTone=.9;
const decode=(url:string)=>{const i=new Image();i.src=url;return i.decode().catch(()=>{});};
export function paintMetro(layer:HTMLElement,tiles:MetroTile[],origin:{x:number;y:number},pageHeight:number,config:DesignConfig,identity:string,radius=14){
 const dpr=Math.max(1,devicePixelRatio||1),s=resolve(config).values,existing=[...layer.querySelectorAll<HTMLElement>(':scope > .he-route')];
 tiles.forEach((t,i)=>{
  const xs=[...t.paths.flatMap(p=>p.points.flatMap(q=>[q.x-p.weight,q.x+p.weight])),...t.stations.flatMap(st=>[st.x-st.radius,st.x+st.radius])];
  const ys=[...t.paths.flatMap(p=>p.points.flatMap(q=>[q.y-p.weight,q.y+p.weight])),...t.stations.flatMap(st=>[st.y-st.radius,st.y+st.radius])];
  const x0=Math.floor(Math.min(...xs)-2),y0=Math.floor(Math.min(...ys)-2),x1=Math.ceil(Math.max(...xs)+2),y1=Math.ceil(Math.max(...ys)+2);
  const el=existing[i]||layer.appendChild(Object.assign(document.createElement('div'),{className:'he-route'}));
  el.setAttribute('aria-hidden','true');
  el.style.left=`${x0}px`;el.style.top=`${y0}px`;el.style.width=`${x1-x0}px`;el.style.height=`${y1-y0}px`;
  const key=JSON.stringify([routeVersion,x0,y0,x1,y1,t,origin,pageHeight,dpr,s.seed,routeTone]);
  if(el.dataset.key===key)return;el.dataset.key=key;
  const id=`${identity}-${i}`,o={x:origin.x+x0,y:origin.y+y0};
  let p=elementPress(pressSettings(s,'fine'),id,'field');p=onSheet({...p,fast:true},s.seed,o,pageHeight);
  const shift=(q:{x:number;y:number})=>({x:q.x-x0,y:q.y-y0});
  void printMask({kind:'mask',w:Math.round((x1-x0)*dpr),h:Math.round((y1-y0)*dpr),dpr,ground:true,groundOpacity:routeTone,tone:toneSettings(s),identity:id,ink:'b',press:p,origin:o,fontSize:16,radius:0,
   route:{paths:t.paths.map(path=>({weight:path.weight,points:path.points.map(shift)})),radius,stations:t.stations.map(st=>({...st,...shift(st)}))}}).then(async r=>{
   if(el.dataset.key!==key)return;
   const url=URL.createObjectURL(new Blob([r.png as BlobPart],{type:'image/png'}));await decode(url);
   if(el.dataset.key!==key){URL.revokeObjectURL(url);return;}
   const previous=el.dataset.maskUrl;el.style.setProperty('--route-mask',`url(${url})`);el.dataset.maskUrl=url;el.dataset.printed='';if(previous)URL.revokeObjectURL(previous);
  }).catch(error=>console.warn('Keeping the unprinted route.',error));
 });
 existing.slice(tiles.length).forEach(el=>{if(el.dataset.maskUrl)URL.revokeObjectURL(el.dataset.maskUrl);el.remove();});
}
