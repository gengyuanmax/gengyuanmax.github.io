import type {DirectionId} from '../data/research-memberships.ts';
export const regionOrder=[['benchmarking'],['domain'],['machines'],['benchmarking','domain'],['benchmarking','machines'],['domain','machines'],['benchmarking','domain','machines']] as DirectionId[][];
export const regionKey=(ids:readonly DirectionId[])=>['benchmarking','domain','machines'].filter(id=>ids.includes(id as DirectionId)).join('-');
export function researchGeometry(ratio=1.33,stagger=18){
 // Leave room at the sheet edge as the circles move apart.
 const r=Math.min(165,368/(1+ratio)),d=r*ratio,center={x:400,y:240};
 const circles={machines:{x:400-d,y:240},benchmarking:{x:400,y:240+stagger},domain:{x:400+d,y:240}};
 // Debug anchors only represent regions actually present in this geometry.
 const samples:Record<string,{x:number;y:number;n:number;points:{x:number;y:number}[]}>={};
 for(let y=70;y<440;y+=6)for(let x=90;x<710;x+=6){const ids=Object.entries(circles).filter(([,c])=>Math.hypot(x-c.x,y-c.y)<r).map(([id])=>id as DirectionId);if(!ids.length)continue;const key=regionKey(ids),p=samples[key]??={x:0,y:0,n:0,points:[]};p.x+=x;p.y+=y;p.n++;p.points.push({x,y});}
 const anchors=Object.fromEntries(Object.entries(samples).map(([key,p])=>[key,p.points.reduce((a,b)=>Math.hypot(a.x-p.x/p.n,a.y-p.y/p.n)<Math.hypot(b.x-p.x/p.n,b.y-p.y/p.n)?a:b)]));
 return{r,circles,anchors,center,width:800,height:500};
}

/** Letter baselines share the ink circle's center. The lower arc needs an
 * extra cap height because upright letters extend inward from its baseline. */
export function researchLabelArc(g:ReturnType<typeof researchGeometry>,id:DirectionId,scale=.8){
 const c=g.circles[id],bottom=id==='benchmarking';
 // Match the ink circle at every responsive size, rather than fixed-size labels
 // around progressively smaller circles. Bottom baselines include the cap height.
 const fontSize=Math.max(14,Math.min(18,g.r*scale*.17))/scale;
 const gap=Math.max(7,Math.min(12,g.r*scale*.10))/scale;
 const radius=g.r+gap+(bottom?fontSize*.8:0);
 // Turn the outside labels away from the neighbouring circles, keeping both
 // ink copies on exactly the same concentric path.
 const rotation=id==='machines'?-12:id==='domain'?12:0,angle=rotation*Math.PI/180;
 const dx=radius*Math.cos(angle),dy=radius*Math.sin(angle);
 return {radius,cx:c.x,cy:c.y,fontSize,
  path:`M ${c.x-dx} ${c.y-dy} A ${radius} ${radius} 0 0 ${bottom?0:1} ${c.x+dx} ${c.y+dy}`};
}
