/** Metro-line geometry (a source adapter, no print effects): constant-width strokes along
 * octilinear paths whose bends are fixed-radius arcs, and stations as rings with a paper
 * centre. The coverage it returns is screened and transferred by the shared material
 * pipeline like any ground (jobs.ts), so the lines carry the same dots and noise. */
export const routeVersion='route-v2';
export type Point={x:number;y:number};
type Seg={kind:'line';a:Point;b:Point;s:number;len:number}|{kind:'arc';c:Point;r:number;a0:number;sweep:number;s:number;len:number};
export type RouteStation={x:number;y:number;radius:number;ring:number};

/** A polyline with each interior vertex replaced by an arc of `radius` (smaller where the
 * neighbouring segments are short). Returns the segments with their arc-length offsets. */
export function roundedPath(points:Point[],radius:number):Seg[]{
 const pts=points.filter((p,i)=>i===0||Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)>1e-6);
 const out:Seg[]=[];let s=0,start=pts[0];
 if(radius<=0){for(let i=1;i<pts.length;i++){const len=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);out.push({kind:'line',a:pts[i-1],b:pts[i],s,len});s+=len;}return out;}
 const push=(seg:Seg)=>{out.push(seg);s+=seg.len;};
 for(let i=1;i<pts.length;i++){
  const p=pts[i],next=pts[i+1];
  if(!next){push({kind:'line',a:start,b:p,s,len:Math.hypot(p.x-start.x,p.y-start.y)});break;}
  const ux=(p.x-pts[i-1].x),uy=(p.y-pts[i-1].y),ul=Math.hypot(ux,uy),vx=(next.x-p.x),vy=(next.y-p.y),vl=Math.hypot(vx,vy);
  const d1={x:ux/ul,y:uy/ul},d2={x:vx/vl,y:vy/vl},turn=Math.atan2(d1.x*d2.y-d1.y*d2.x,d1.x*d2.x+d1.y*d2.y);
  if(Math.abs(turn)<1e-4){continue;}
  const t=Math.tan(Math.abs(turn)/2),r=Math.min(radius,(Math.min(ul,vl)/2)/t),cut=r*t;
  const enter={x:p.x-d1.x*cut,y:p.y-d1.y*cut},exit={x:p.x+d2.x*cut,y:p.y+d2.y*cut};
  push({kind:'line',a:start,b:enter,s,len:Math.hypot(enter.x-start.x,enter.y-start.y)});
  const side=Math.sign(turn),c={x:enter.x-d1.y*r*side,y:enter.y+d1.x*r*side};
  push({kind:'arc',c,r,a0:Math.atan2(enter.y-c.y,enter.x-c.x),sweep:turn,s,len:Math.abs(turn)*r});
  start=exit;
 }
 return out;
}
/** Distance from q to the path and the arc length at the nearest point. */
function nearest(segs:Seg[],q:Point){
 let best=Infinity,at=0;
 for(const g of segs){
  if(g.kind==='line'){
   const dx=g.b.x-g.a.x,dy=g.b.y-g.a.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((q.x-g.a.x)*dx+(q.y-g.a.y)*dy)/l2));
   const d=Math.hypot(q.x-g.a.x-t*dx,q.y-g.a.y-t*dy);if(d<best){best=d;at=g.s+t*g.len;}
  }else{
   let a=Math.atan2(q.y-g.c.y,q.x-g.c.x)-g.a0;
   // Angle along the sweep direction, in [0, |sweep|] when the point projects onto the arc.
   a=g.sweep>0?((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI):((-a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
   const span=Math.abs(g.sweep);
   if(a<=span){const d=Math.abs(Math.hypot(q.x-g.c.x,q.y-g.c.y)-g.r);if(d<best){best=d;at=g.s+a*g.r;}}
   else for(const e of [g.a0,g.a0+g.sweep]){const d=Math.hypot(q.x-g.c.x-g.r*Math.cos(e),q.y-g.c.y-g.r*Math.sin(e));if(d<best){best=d;at=e===g.a0?g.s:g.s+g.len;}}
  }
 }
 return {d:best,s:at};
}
export interface RoutePath {points:Point[];weight:number}
/** Anti-aliased coverage of `paths` and `stations` over a `width`×`height` CSS px box at
 * `scale` device px per CSS px. Station centres are paper and knock every line out. */
export function routeCoverage(width:number,height:number,scale:number,paths:RoutePath[],radius:number,stations:RouteStation[]=[]):Float32Array{
 const W=Math.max(1,Math.round(width*scale)),H=Math.max(1,Math.round(height*scale)),out=new Float32Array(W*H);
 const strokes=paths.map(p=>({segs:roundedPath(p.points,radius),half:p.weight/2}));
 const visit=(x0:number,y0:number,x1:number,y1:number,fn:(i:number,x:number,y:number)=>void)=>{
  const c0=Math.max(0,Math.floor(x0*scale)),c1=Math.min(W-1,Math.ceil(x1*scale)),r0=Math.max(0,Math.floor(y0*scale)),r1=Math.min(H-1,Math.ceil(y1*scale));
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)fn(r*W+c,(c+.5)/scale,(r+.5)/scale);
 };
 for(const {segs,half} of strokes){
  const reach=half+2/scale;
  const ink=(i:number,x:number,y:number)=>{const {d}=nearest(segs,{x,y});out[i]=Math.max(out[i],Math.max(0,Math.min(1,(half-d)*scale+.5)));};
  for(const g of segs){
   if(g.kind==='line')visit(Math.min(g.a.x,g.b.x)-reach,Math.min(g.a.y,g.b.y)-reach,Math.max(g.a.x,g.b.x)+reach,Math.max(g.a.y,g.b.y)+reach,ink);
   else visit(g.c.x-g.r-reach,g.c.y-g.r-reach,g.c.x+g.r+reach,g.c.y+g.r+reach,ink);
  }
 }
 for(const st of stations){
  const inner=st.radius-st.ring;
  visit(st.x-st.radius-2/scale,st.y-st.radius-2/scale,st.x+st.radius+2/scale,st.y+st.radius+2/scale,(i,x,y)=>{
   const dist=Math.hypot(x-st.x,y-st.y);
   const ring=Math.max(0,Math.min(1,(st.radius-dist)*scale+.5))*Math.max(0,Math.min(1,(dist-inner)*scale+.5));
   const hole=Math.max(0,Math.min(1,(inner-dist)*scale+.5));
   out[i]=Math.max(out[i]*(1-hole),ring);
  });
 }
 return out;
}

/** Non-overlapping publication bands of one blue route plate. Source geometry in
 * each band includes its neighbours, so joints are unioned before wear/transfer.
 * Padding is discarded after printing, never blended with an adjacent band. */
export function routeBands(tiles:{paths:RoutePath[];stations:RouteStation[]}[],bandHeight=256,padding=8){
 const boxes=tiles.filter(t=>t.paths.length||t.stations.length).map(t=>{
  const xs=[...t.paths.flatMap(p=>p.points.flatMap(q=>[q.x-p.weight,q.x+p.weight])),...t.stations.flatMap(s=>[s.x-s.radius,s.x+s.radius])];
  const ys=[...t.paths.flatMap(p=>p.points.flatMap(q=>[q.y-p.weight,q.y+p.weight])),...t.stations.flatMap(s=>[s.y-s.radius,s.y+s.radius])];
  return {...t,left:Math.floor(Math.min(...xs)-2),right:Math.ceil(Math.max(...xs)+2),top:Math.floor(Math.min(...ys)-2),bottom:Math.ceil(Math.max(...ys)+2)};
 });
 if(!boxes.length)return [];
 const top=Math.min(...boxes.map(t=>t.top)),bottom=Math.max(...boxes.map(t=>t.bottom)),out=[];
 for(let y=top;y<bottom;y+=bandHeight){
  const end=Math.min(bottom,y+bandHeight),active=boxes.filter(t=>t.top<end+padding&&t.bottom>y-padding);
  if(!active.length)continue;
  const x=Math.min(...active.map(t=>t.left)),right=Math.max(...active.map(t=>t.right));
  out.push({x,y,width:right-x,height:end-y,padding,paths:active.flatMap(t=>t.paths),stations:active.flatMap(t=>t.stations)});
 }
 return out;
}
