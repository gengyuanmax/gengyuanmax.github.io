/** Connected same-colour output boxes. Only touching boxes are grouped, avoiding
 * a page-sized bitmap for unrelated rules. No screening or transfer lives here. */
export type ColourBox={x:number;y:number;width:number;height:number;color:string};
export function groupInkRects<T extends ColourBox>(rects:T[]){
 const groups:T[][]=[];
 const touches=(a:T,b:T)=>a.color===b.color&&a.x<=b.x+b.width&&b.x<=a.x+a.width&&a.y<=b.y+b.height&&b.y<=a.y+a.height;
 for(const r of rects){
  const joined:T[]=[r];
  for(let i=groups.length-1;i>=0;i--)if(groups[i].some(x=>touches(x,r)))joined.push(...groups.splice(i,1)[0]);
  groups.push(joined);
 }
 return groups;
}
