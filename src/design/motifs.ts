import type {Settings} from './settings.ts';
import {earthLandPath} from './assets/earth-land.ts';
export type Motif = 'orbit'|'earth'|'windows'|'sequence'|'query'|'frontier'|'scope';
// Adaptation of the Element Lab studies, not a pixel-identical lab renderer.
// This SVG is the source/fallback. The live screen uses the shared medium tier
// at actual display size; legacy fieldPitch only describes this fallback.
// Same ink shares one plate; material is applied by the shared print pipeline.
// Composition overlap is distinct from plate registration; the latter uses
// reference SVG units and scales with the printed object, not the viewport.
function motifParts(s:Settings,id:string,kind:Motif){
 const p=s.fieldPitch,r=p*Math.sqrt(s.fieldCoverage/Math.PI),o=1-s.fieldOverlap;
 const pattern=['a','b'].map(plate=>`<pattern id="${id}-${plate}-dots" width="${p}" height="${p}" patternUnits="userSpaceOnUse" patternTransform="rotate(${plate==='a'?s.secondaryAngle:s.primaryAngle})"><circle cx="${p/2}" cy="${p/2}" r="${r}" fill="var(--${plate==='a'?'red':'blue'}-ink)"/></pattern>`).join('');
 const dotsA=`url(#${id}-a-dots)`,dotsB=`url(#${id}-b-dots)`;
 const a=kind==='windows'?`<path d="M22 36h114v140H22zM128 15h114v140H128zM234 52h104v140H234z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 176h114v8H22zM128 155h114v8H128zM234 192h104v8H234z"/>`:kind==='sequence'?`<path d="M15 48h92v142H15zM133 48h92v142h-92zM251 48h92v142h-92z" fill="${dotsA}"/><path d="M15 208h328" fill="none" stroke="currentColor" stroke-width="3"/>`:`<circle cx="${185+o*35}" cy="107" r="87" fill="${dotsA}"/>`;
 const b=kind==='windows'?`<circle cx="${174+o*30}" cy="115" r="94" fill="${dotsB}"/>`:kind==='sequence'?`<path d="M27 106h306v16H27z"/><circle cx="${132+o*30}" cy="110" r="70" fill="${dotsB}"/><path d="M46 35v18m118-18v18m118-18v18" stroke="currentColor" stroke-width="2"/>`:`<circle cx="${137-o*35}" cy="112" r="73" fill="none" stroke="currentColor" stroke-width="26"/><path d="M40 192h236" stroke="currentColor" stroke-width="3"/>`;
 // Project marks added 2026-10-23. Each takes a different reference while
 // keeping the two inks: Martens-style overprinted flats, grain-gradient rods,
 // and gradient solids. Ramp groups carry their tone as source opacity and are
 // screened as planes by the shared pipeline (data-print-tone="ramp").
 const ramp=(gid:string,x1:number,y1:number,x2:number,y2:number,stops:[number,number][])=>`<linearGradient id="${id}-${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([at,op])=>`<stop offset="${at}" stop-color="#000" stop-opacity="${op}"/>`).join('')}</linearGradient>`;
 const flat=(shape:string,op=1)=>`<g data-print-tone="ramp" opacity="${op}">${shape}</g>`;
 const rod=(gid:string,cx:number,cy:number,len:number,w:number,angle:number)=>{
  const L=len/2,h=w/2,rx=w*.24;
  return `<g data-print-tone="ramp" transform="translate(${cx} ${cy}) rotate(${angle})"><defs>${ramp(gid,0,-h,0,h,[[0,1],[.3,.1],[.5,.22],[1,1]])}</defs><path d="M${-L} ${-h}H${L}A${rx} ${h} 0 0 1 ${L} ${h}H${-L}A${rx} ${h} 0 0 1 ${-L} ${-h}z" fill="url(#${id}-${gid})"/><ellipse cx="${-L}" cy="0" rx="${rx}" ry="${h}" fill="#000" fill-opacity=".04"/></g>`;
 };
 const extra:Partial<Record<Motif,{a:string;b:string}>>={
  // ICQ (Karel Martens): a reference image (square) laid over the moment (disc) on ruled card, the refinement text.
  query:{a:`<path d="M15 34h330M15 58h330M15 82h330M15 106h330M15 130h330M15 154h330M15 178h330" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M15 14h14v14H15z" fill="none" stroke="currentColor" stroke-width="1.4"/>${flat(`<path d="M120 52l52-11 22 102-52 11z" fill="#000"/>`)}${flat(`<path d="M172 41l52-11 22 102-52 11z" fill="#000"/>`,.5)}`,
   b:`${flat(`<circle cx="${214+o*30}" cy="112" r="92" fill="#000"/>`,.9)}`},
  // ReEXplore (gradient solids): a room as a cube, and the exploration path as a bent tube passing it.
  frontier:{a:`<g data-print-tone="ramp"><defs>${ramp('top',96,58,206,96,[[0,.06],[1,.4]])}${ramp('left',96,96,150,200,[[0,.35],[1,1]])}</defs><path d="M151 34l62 34-62 34-62-34z" fill="url(#${id}-top)"/><path d="M89 68l62 34v94l-62-34z" fill="url(#${id}-left)"/></g><path d="M15 208h328" fill="none" stroke="currentColor" stroke-width="3"/>`,
   b:`<g data-print-tone="ramp"><defs>${ramp('right',151,102,213,196,[[0,1],[1,.25]])}${ramp('tube',190,200,330,20,[[0,1],[.45,.55],[1,.08]])}</defs><path d="M151 102l62-34v94l-62 34z" fill="url(#${id}-right)"/><path d="M196 196c40-6 52-58 92-66s48-60 36-104" fill="none" stroke="url(#${id}-tube)" stroke-width="22" stroke-linecap="butt"/><ellipse cx="324" cy="26" rx="11" ry="4" fill="#000" fill-opacity=".04" transform="rotate(-8 324 26)"/></g>`},
  // How to Train a Surgeon? (grain-gradient rods): two instruments cross the endoscopic field.
  scope:{a:`${rod('r1',118,84,220,32,34)}${rod('r2',250,92,200,30,-38)}`,
   b:`<g data-print-tone="ramp"><defs>${ramp('field',0,18,0,206,[[0,.03],[1,1]])}</defs><circle cx="${190+o*30}" cy="112" r="94" fill="url(#${id}-field)"/></g>`},
 };
 // Ocean and land are one source image before screening. The shared sphere
 // illumination is applied across both; coastlines change ink demand, not mesh.
 const earth=`<g data-print-tone="sphere" fill="${dotsA}" transform="translate(${185+o*35} 107)"><circle r="87" opacity=".32"/><path d="${earthLandPath}"/></g>`;
 const x=extra[kind];if(x)return {pattern,a:x.a,b:x.b};
 return {pattern,a:kind==='earth'?earth:a,b};
}

export function motifMarkup(s:Settings,id:string,kind:Motif){
 const {pattern,a,b}=motifParts(s,id,kind);
 return `<defs>${pattern}</defs><g><g class="he-field-a">${a}</g><g class="he-field-b" style="transform:translate(${s.registration}px,${s.registrationY}px)">${b}</g></g>`;
}
/** Split only our generated XML siblings, retaining nested groups unchanged. */
export function motifOriginals(s:Settings,id:string,kind:Motif){
 const parts=motifParts(s,id,kind),result:{ink:'a'|'b';markup:string;screened:boolean;ring:boolean;kind:'sphere'|'plane';index:number}[]=[];
 for(const ink of ['a','b'] as const){let depth=0,start=0,index=0;
  for(const match of parts[ink].matchAll(/<[^>]+>/g)){
   const tag=match[0];if(!depth)start=match.index!;
   if(tag.startsWith('</'))depth--;else if(!tag.endsWith('/>'))depth++;
   if(depth)continue;
   let markup=parts[ink].slice(start,match.index!+tag.length);const circle=markup.startsWith('<circle'),patterned=/^<[^>]*fill="url\(/.test(markup),ring=circle&&/^<[^>]*fill="none"/.test(markup)&&Number(markup.match(/stroke-width="([^"]+)"/)?.[1])>=6;
   if(patterned)markup=markup.replace(/fill="url\([^)]*\)"/,'fill="black"');
   const ramped=/^<g[^>]*data-print-tone="ramp"/.test(markup);
   result.push({ink,markup,screened:patterned||ring||ramped,ring,kind:markup.includes('data-print-tone="sphere"')||circle&&!ring?'sphere':'plane',index:index++});
  }
 }return result;
}
