import type {Settings} from './settings.ts';
import {earthLandPath} from './assets/earth-land.ts';
export type Motif = 'orbit'|'earth'|'windows'|'sequence';
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
 // Ocean and land are one source image before screening. The shared sphere
 // illumination is applied across both; coastlines change ink demand, not mesh.
 const earth=`<g data-print-tone="sphere" fill="${dotsA}" transform="translate(${185+o*35} 107)"><circle r="87" opacity=".32"/><path d="${earthLandPath}"/></g>`;
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
   result.push({ink,markup,screened:patterned||ring,ring,kind:markup.includes('data-print-tone="sphere"')||circle&&!ring?'sphere':'plane',index:index++});
  }
 }return result;
}
