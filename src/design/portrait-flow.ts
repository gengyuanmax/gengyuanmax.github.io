import {clamp,smooth,samplePlate,shadowWear,noise,type PortraitPlates,type PlateRecipe,type RGB} from './portrait-plates.ts';
export type Point={x:number;y:number};
export type {RGB};
export interface FlowOptions {start:number;pitch:number;angle:number;blueAngle:number;bend:number;width:number;density:number;growth:number;offset:Point;recipe:PlateRecipe;}
export interface PortraitGeometry {origin:Point;width:number;height:number;tilt:number;target:Point;plate?:{left:number;top:number;right:number};news?:{center:Point;radius:number;coverage:number;ring:Point;ringRadius:number;ringWidth:number};}
export interface FlowDot extends Point {r:number;ink:0|1;}
export const flowVersion='source-separated-fixed-am-v5';
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function portraitPoint(g:PortraitGeometry,x:number,y:number):Point {
 const a=g.tilt*Math.PI/180,c=Math.cos(a),s=Math.sin(a),ox=g.width*.5,oy=g.height*.8;
 return {x:g.origin.x+ox+(x-ox)*c-(y-oy)*s,y:g.origin.y+oy+(x-ox)*s+(y-oy)*c};
}
export function sourcePoint(g:PortraitGeometry,p:Point):Point{
 const a=g.tilt*Math.PI/180,c=Math.cos(a),s=Math.sin(a),ox=g.width*.5,oy=g.height*.8,x=p.x-g.origin.x-ox,y=p.y-g.origin.y-oy;
 return {x:ox+x*c+y*s,y:oy-x*s+y*c};
}
function cubic(a:Point,b:Point,c:Point,d:Point,t:number){const q=1-t;return {x:q*q*q*a.x+3*q*q*t*b.x+3*q*t*t*c.x+t*t*t*d.x,y:q*q*q*a.y+3*q*q*t*b.y+3*q*t*t*c.y+t*t*t*d.y};}
export function flowPath(g:PortraitGeometry,o:FlowOptions){
 const start=portraitPoint(g,g.width*.5,g.height),reach=Math.min(o.bend,Math.max(12,(g.target.y-start.y)*.5));
 const b={x:start.x-g.width*.16,y:start.y+reach*.45},c={x:g.target.x+(start.x-g.target.x)*.3,y:g.target.y-reach};
 const points=[{...start,d:0,t:0}];
 for(let i=1;i<=100;i++){const t=i/100,p=cubic(start,b,c,g.target,t),last=points[i-1];points.push({...p,d:last.d+Math.hypot(p.x-last.x,p.y-last.y),t});}
 return points;
}
// Globally anchored square lattices. Never warp, translate individual dots,
// change pitch along the curve, or rotate a row to follow the path.
export function fixedGrid(bounds:{left:number;top:number;right:number;bottom:number},pitch:number,angle:number,origin:Point={x:0,y:0}){
 const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const corners=[[bounds.left,bounds.top],[bounds.right,bounds.top],[bounds.left,bounds.bottom],[bounds.right,bounds.bottom]].map(([x,y])=>({u:(x-origin.x)*c+(y-origin.y)*s,v:-(x-origin.x)*s+(y-origin.y)*c}));
 const out:Point[]=[];
 for(let row=Math.floor(Math.min(...corners.map(p=>p.v))/pitch);row<=Math.ceil(Math.max(...corners.map(p=>p.v))/pitch);row++)
 for(let col=Math.floor(Math.min(...corners.map(p=>p.u))/pitch);col<=Math.ceil(Math.max(...corners.map(p=>p.u))/pitch);col++){
  const u=(col+.5)*pitch,v=(row+.5)*pitch,x=origin.x+u*c-v*s,y=origin.y+u*s+v*c;
  if(x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom)out.push({x,y});
 }
 return out;
}
export function radiusEnvelope(t:number,growth:number){return t<=.2?mix(1,growth,smooth(t/.2)):growth*(1-smooth((t-.2)/.8));}
function bandCoverage(p:PortraitPlates,u:number){
 const total=[0,0];let n=0;
 for(let j=0;j<5;j++)for(let i=-4;i<=4;i++){
  const c=samplePlate(p,clamp(u+i*.035),.82+j*.038);total[0]+=c.ink[0];total[1]+=c.ink[1];n++;
 }
 return total.map(x=>x/n);
}
export function buildPortraitFlow(p:PortraitPlates,g:PortraitGeometry,o:FlowOptions){
 const path=flowPath(g,o),dots:FlowDot[]=[],start=portraitPoint(g,g.width*.5,g.height*o.start),edge=path[0],length=path.at(-1)!.d;
 const band=Array.from({length:65},(_,i)=>bandCoverage(p,i/64));
 const origin=g.news?.center??{x:0,y:0},pitch=o.pitch;
 const bounds={left:Math.min(g.target.x-(g.news?.radius??50)-35,g.origin.x),right:Math.max(g.origin.x+g.width+24,g.plate?.right??0),top:Math.min(g.origin.y-20,g.plate?.top??g.origin.y),bottom:Math.max(g.target.y+(g.news?.radius??50)+20,edge.y+g.width*.22)};
 for(let ink=0;ink<2;ink++)for(const point of fixedGrid(bounds,pitch,ink?o.blueAngle:o.angle,origin)){
  const local=sourcePoint(g,point),u=local.x/g.width,v=local.y/g.height;
  const source=samplePlate(p,u,v);let amount=source.ink[ink];
  // Ink area changes, never alpha. The complete portrait uses these plates.
  if(point.y>start.y&&source.alpha){
   const t=clamp((point.y-start.y)/(edge.y-start.y));amount*=mix(1,o.density,smooth(t));
  }
  if(ink===1&&source.alpha)amount*=shadowWear(u,v,o.recipe.starvation);
  if(point.y>start.y){
   let best=Infinity,nearest=path[0];
   for(const q of path){const d=(point.x-q.x)**2+(point.y-q.y)**2;if(d<best){best=d;nearest=q;}}
   const t=nearest.d/length,width=g.width*.68*mix(1,Math.max(.25,o.width),smooth(t)),distance=Math.sqrt(best);
   if(distance<width*.5){
    const across=clamp(.5+(point.y-nearest.y)/width),value=band[Math.round(across*64)][ink];
    const plateSource=ink===1&&g.plate?Math.max(0,Math.min(g.origin.x+g.width,g.plate.right)-Math.max(g.origin.x,g.plate.left))/g.width:0;
    const tail=(value+plateSource*.12)*o.density*radiusEnvelope(t,o.growth)**2*(1-smooth(distance/(width*.5)));
    amount=Math.max(amount,tail*smooth((point.y-start.y)/(edge.y-start.y)));
   }
  }
  if(ink===1&&g.plate&&point.x>=g.plate.left&&point.x<=g.plate.right&&point.y>=g.plate.top){
   amount=Math.max(amount,(1-smooth((point.y-start.y)/50))*(1-source.alpha)*Math.PI*.51);
  }
  // News is a small vector composition, not another photo plate. Its original
  // SVG clips the fine screen to the circle and keeps the ring continuous.
  // Keep its center as the tail anchor, but do not redraw its shapes here.
  const gain=1+o.recipe.gain*4*clamp(amount)*(1-clamp(amount)),r=pitch*Math.sqrt(amount/Math.PI)*gain;
  if(r>.04)dots.push({x:point.x+(ink?o.offset.x:0),y:point.y+(ink?o.offset.y:0),r,ink:ink as 0|1});
 }
 return {dots,path,bounds,origin,version:flowVersion};
}
// Binary masks retain round geometry at device resolution. Ink grain removes
// pixels instead of turning them translucent. Layer intersections multiply.
export function rasterizeDots(dots:FlowDot[],inks:[RGB,RGB],width:number,height:number,top:number,dpr:number,grain=0,seed=23){
 const masks=[new Uint8Array(width*height),new Uint8Array(width*height)];
 for(const dot of dots){
  const x=dot.x*dpr,y=(dot.y-top)*dpr,r=dot.r*dpr;
  for(let py=Math.max(0,Math.floor(y-r));py<=Math.min(height-1,Math.ceil(y+r));py++)
  for(let px=Math.max(0,Math.floor(x-r));px<=Math.min(width-1,Math.ceil(x+r));px++)
   if((px+.5-x)**2+(py+.5-y)**2<=r*r)masks[dot.ink][py*width+px]=1;
 }
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;
  for(let k=0;k<2;k++)if(masks[k][i]&&noise(x,y+Math.round(top*dpr),seed+k*97)<grain)masks[k][i]=0;
  const a=masks[0][i],b=masks[1][i];if(!a&&!b)continue;
  for(let k=0;k<3;k++)data[i*4+k]=Math.round((a?inks[0][k]:255)*(b?inks[1][k]:255)/255);
  data[i*4+3]=255;
 }
 return {data,masks};
}
