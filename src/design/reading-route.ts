// A reading index, not a graph of scientific dependencies. A trunk runs in the outer
// margin; each row gets a bus above its highest item and short stems to the markers.
// Line weight falls with depth (trunk > bus > stem); where the trunk crosses a chapter
// band the band is knocked out instead of being overprinted by the line.
export interface ReadingAnchor {x:number;y:number;row:string}
/** A chapter band; left/right (host px) limit where it can meet the trunk. */
export interface ReadingBand {top:number;bottom:number;left?:number;right?:number}
export type Rect={x:number;y:number;width:number;height:number;level:0|1|2};
export interface TreeOptions {rail?:number;gap?:number;weight?:number;dpr?:number;origin?:{x:number;y:number}}
/** A knockout closer than this to the band's own edge leaves a sliver of ink; move the trunk in. */
export const bandInset=16;
/** Weights per level as multiples of the reading weight: the trunk keeps it, buses and stems thin out. */
export const levelScale=[1,.67,.4] as const;
/** Whole device pixels per level, strictly decreasing even where rounding would tie. */
export function guideWeights(weight:number,dpr:number):[number,number,number]{
 const d2=Math.max(1,Math.round(weight*levelScale[2]*dpr)),d1=Math.max(d2+1,Math.round(weight*levelScale[1]*dpr)),d0=Math.max(d1+1,Math.round(weight*levelScale[0]*dpr));
 return [d0/dpr,d1/dpr,d2/dpr];
}
/** A timeline (About) in the same language as the reading tree: the spine is the trunk
 * (level 0) and each entry gets a short level-1 branch instead of a square marker. */
export function timelineGuides(spine:{x:number;top:number;bottom:number},entries:number[],{weight=1.5,dpr=1,origin={x:0,y:0},branch=8}:{weight?:number;dpr?:number;origin?:{x:number;y:number};branch?:number}={}):Rect[]{
 if(!entries.length)return [];
 const px=(v:number,o:number)=>Math.round((v+o)*dpr)/dpr-o,w=guideWeights(weight,dpr),x=px(spine.x-w[0]/2,origin.x);
 const top=px(Math.min(spine.top,...entries),origin.y),bottom=px(Math.max(spine.bottom,...entries.map(y=>y+w[1])),origin.y);
 return [{x,y:top,width:w[0],height:bottom-top,level:0},...entries.map(y=>({x,y:px(y-w[1]/2,origin.y),width:w[0]+branch,height:w[1],level:1 as const}))];
}
export function readingTree(anchors:ReadingAnchor[],bands:ReadingBand[]=[],{rail=-18,gap=24,weight=1.5,dpr=1,origin={x:0,y:0}}:TreeOptions={}):{ink:Rect[];knockouts:Rect[]}{
 if(!anchors.length)return {ink:[],knockouts:[]};
 // Snap edges to device pixels in page space, so every rule is crisp and joints meet exactly.
 const px=(v:number,o:number)=>Math.round((v+o)*dpr)/dpr-o,sx=(v:number)=>px(v,origin.x),sy=(v:number)=>px(v,origin.y);
 const w=guideWeights(weight,dpr);
 const rows=new Map<string,ReadingAnchor[]>();
 for(const a of anchors){const row=rows.get(a.row)||[];row.push(a);rows.set(a.row,row);}
 const buses=[...rows.values()].map(items=>({items,y:sy(Math.min(...items.map(a=>a.y))-gap)})).sort((a,b)=>a.y-b.y);
 // Staggered bands: only those spanning the trunk are cut. A band whose own left edge lies
 // just left of the trunk would keep a sliver of ink there, so the trunk moves inside it.
 let left=rail-w[0]/2;
 for(const b of bands)if(b.left!==undefined&&b.left<=left+w[0]&&(b.right??Infinity)>=left&&left-b.left<bandInset)left=b.left+bandInset;
 const trunkX=sx(left),ink:Rect[]=[],knockouts:Rect[]=[];
 const sorted=bands.filter(b=>(b.left??-Infinity)<=trunkX+w[0]&&(b.right??Infinity)>=trunkX).sort((a,b)=>a.top-b.top);
 const top=sy(Math.min(buses[0].y-12,...sorted.filter(b=>b.bottom<=buses[0].y).map(b=>b.top))),bottom=buses.at(-1)!.y+w[1];
 // Trunk minus bands is ink; trunk within bands is a knockout through the band.
 let y=top;
 for(const band of sorted){
  const b0=Math.max(top,sy(band.top)),b1=Math.min(bottom,sy(band.bottom));if(b1<=b0)continue;
  if(b0>y)ink.push({x:trunkX,y,width:w[0],height:b0-y,level:0});
  knockouts.push({x:trunkX,y:b0,width:w[0],height:b1-b0,level:0});y=Math.max(y,b1);
 }
 if(bottom>y)ink.push({x:trunkX,y,width:w[0],height:bottom-y,level:0});
 for(const bus of buses){
  const stems=bus.items.map(a=>({x:sx(a.x-w[2]/2),y:sy(a.y)}));
  const right=Math.max(...stems.map(s=>s.x+w[2]));
  ink.push({x:trunkX,y:bus.y,width:right-trunkX,height:w[1],level:1});
  for(const s of stems)if(s.y>bus.y+w[1])ink.push({x:s.x,y:bus.y,width:w[2],height:s.y-bus.y,level:2});
 }
 return {ink,knockouts};
}
