import type {DirectionId} from '../data/research-memberships.ts';
export const regionOrder=[['benchmarking'],['domain'],['machines'],['benchmarking','domain'],['benchmarking','machines'],['domain','machines'],['benchmarking','domain','machines']] as DirectionId[][];
export const regionKey=(ids:readonly DirectionId[])=>['benchmarking','domain','machines'].filter(id=>ids.includes(id as DirectionId)).join('-');
export function researchGeometry(ratio=1.33,stagger=18){
 // Leave room at the sheet edge as the circles move apart.
 const r=Math.min(165,368/(1+ratio)),d=r*ratio,center={x:400,y:240};
 const circles={benchmarking:{x:400-d,y:240},domain:{x:400,y:240+stagger},machines:{x:400+d,y:240}};
 // Debug anchors only represent regions actually present in this geometry.
 const samples:Record<string,{x:number;y:number;n:number;points:{x:number;y:number}[]}>={};
 for(let y=70;y<440;y+=6)for(let x=90;x<710;x+=6){const ids=Object.entries(circles).filter(([,c])=>Math.hypot(x-c.x,y-c.y)<r).map(([id])=>id as DirectionId);if(!ids.length)continue;const key=regionKey(ids),p=samples[key]??={x:0,y:0,n:0,points:[]};p.x+=x;p.y+=y;p.n++;p.points.push({x,y});}
 const anchors=Object.fromEntries(Object.entries(samples).map(([key,p])=>[key,p.points.reduce((a,b)=>Math.hypot(a.x-p.x/p.n,a.y-p.y/p.n)<Math.hypot(b.x-p.x/p.n,b.y-p.y/p.n)?a:b)]));
 return{r,circles,anchors,center,width:800,height:500};
}

/** Letter baselines share the ink circle's center. The lower arc needs an
 * extra cap height because upright letters extend inward from its baseline. */
export function researchLabelArc(g:ReturnType<typeof researchGeometry>,id:DirectionId,scale=.8){
 const c=g.circles[id],bottom=id==='domain',radius=g.r+(bottom?32:14)/scale;
 return {radius,cx:c.x,cy:c.y,fontSize:18/scale,
  path:`M ${c.x-radius} ${c.y} A ${radius} ${radius} 0 0 ${bottom?0:1} ${c.x+radius} ${c.y}`};
}
