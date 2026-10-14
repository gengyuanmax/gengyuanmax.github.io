// A reading index, not a graph of scientific dependencies. Rails run in the
// outer margin; each row gets a bus above its highest item and short stems.
export interface ReadingAnchor {x:number;y:number;row:string}
export function readingRoute(anchors:ReadingAnchor[],rail=-18,gap=24):string {
 if(!anchors.length)return '';
 const rows=new Map<string,ReadingAnchor[]>();
 for(const a of anchors){const row=rows.get(a.row)||[];row.push(a);rows.set(a.row,row);}
 const bands=[...rows.values()].map(items=>({items,y:Math.min(...items.map(a=>a.y))-gap})).sort((a,b)=>a.y-b.y);
 const n=(v:number)=>Math.round(v*100)/100;
 const commands=[`M ${rail} ${n(bands[0].y-12)} V ${n(bands.at(-1)!.y)}`];
 for(const band of bands){
  commands.push(`M ${rail} ${n(band.y)} H ${n(Math.max(...band.items.map(a=>a.x)))}`);
  for(const a of band.items)commands.push(`M ${n(a.x)} ${n(band.y)} V ${n(a.y)}`);
 }
 return commands.join(' ');
}
