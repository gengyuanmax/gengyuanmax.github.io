export interface ResourceLinks { page?:string; arxiv?:string; github?:string; demo?:string; article?:string; dataset?:string; model?:string }
export interface CatalogRecord { id:string; publishedAt:string|null; categories:string[]; featured?:boolean }
export type ArtifactMode='date'|'category';
export function resourceEntries(links:ResourceLinks={}){
 return (['page','arxiv','github','demo','article','dataset','model'] as const).flatMap(kind=>{
  const href=links[kind];
  if(!href||/[\s\\]/.test(href))return [];
  if(/^\/(?!\/)/.test(href))return [{kind,href}];
  try { const url=new URL(href);return ['https:','http:'].includes(url.protocol)&&url.hostname?[{kind,href}]:[]; }catch{return [];}
 });
}
export function preferredResource(links:ResourceLinks={}){return resourceEntries(links)[0]||null;}
function dateValue(value:string|null){
 if(!value)return -Infinity;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error(`Date must be YYYY-MM-DD: ${value}`);
 const n=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==value)throw new Error(`Invalid date: ${value}`);
 return n;
}
export function chronological<T extends CatalogRecord>(entries:readonly T[]):T[]{
 const rows=entries.map((entry,index)=>({entry,index,date:dateValue(entry.publishedAt)}));
 return rows.sort((a,b)=>a.date===b.date?a.index-b.index:b.date-a.date).map(row=>row.entry);
}
export function artifactGroups<T extends CatalogRecord>(entries:readonly T[],mode:ArtifactMode,filter='all'){
 const ordered=chronological(entries).filter(item=>filter==='all'||item.categories.includes(filter));
 // Explicitly featured work is separate from dates; never invent a release date to promote it.
 if(mode==='date')return [{key:'date',entries:[...ordered.filter(item=>item.featured),...ordered.filter(item=>!item.featured)]}];
 const groups=new Map<string,T[]>();
 for(const item of ordered){const key=filter==='all'?(item.categories[0]||'pending'):filter;if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(item);}
 return [...groups].map(([key,entries])=>({key,entries}));
}
export function projectsForPillar<T extends {primaryTheme:string}>(entries:readonly T[],pillar:string){return entries.filter(item=>item.primaryTheme===pillar);}
