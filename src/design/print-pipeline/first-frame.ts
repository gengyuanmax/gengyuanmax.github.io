import {transferPlate} from './transfer.ts';
import {screenScale} from '../screen.ts';
import {spotT} from './noise.ts';

/** What the page shows before any canvas or mask exists must already be the final
 * print, not a different stand-in. These helpers derive that first frame from the
 * same parameters the pipeline uses, so CSS can paint it without JavaScript. */

/** Same rule as typeScreenLevel/screen(): integer CSS px; below 1.5 × medium the
 * display name reuses the fine tier instead of inventing another frequency. */
export function dotPitch(fontSize:number,display=false){
 const coarse=Math.max(2,Math.round(fontSize*screenScale.coarseEm));
 // The display name keeps its coarse-dot identity at every size (user, 2026-10-21: the
 // poster name is the template): never below the medium tier, never fine.
 if(display)return Math.max(screenScale.medium,coarse);
 return coarse>=screenScale.medium*1.5?coarse:screenScale.fine;
}
const tile=16,columns=400,rows=100,period=24;
const nameMaster=Array.from({length:period*period},(_,k)=>({i:k%period,j:Math.floor(k/period)}));
/** Shared master/transfer recipe also used by the static CSS plate. */
export function nameDots(radius:number,seed=0){return transferPlate({kind:'name-dots',master:nameMaster,radius,seed});}
/** The display name's blue plate as a vector mask: the AM lattice at the plate angle with
 * the bounded dot noise above, tiled every `period` dots. CSS scales it with
 * mask-size = pitch × (columns, rows) and the glyphs clip it. */
export function dotPlateImage(angle:number,radius:number,seed=0){
 const w=tile*columns,h=tile*rows,size=tile*period;
 // Dots near the tile edge are drawn once more on the opposite side so none is cut by the seam.
 const dots=nameDots(radius,seed).flatMap(d=>[[0,0],[size,0],[-size,0],[0,size],[0,-size]].map(([dx,dy])=>({...d,x:d.x+dx,y:d.y+dy})).filter(e=>e.x+e.r>0&&e.x-e.r<size&&e.y+e.r>0&&e.y-e.r<size));
 const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><pattern id='d' width='${size}' height='${size}' patternUnits='userSpaceOnUse' patternTransform='rotate(${angle})'>${dots.map(d=>`<circle cx='${d.x.toFixed(1)}' cy='${d.y.toFixed(1)}' r='${d.r.toFixed(2)}'/>`).join('')}</pattern><rect width='${w}' height='${h}' fill='url(#d)'/></svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g,' ').replace(/%3D/g,'=').replace(/%3A/g,':').replace(/%2F/g,'/').replace(/%2C/g,',').replace(/%27/g,"'")}")`;
}
export const dotPlateGrid={columns,rows};

/** Mean ink of a screened plane ground, used as its flat first frame so the screen
 * arriving later only adds texture, never a jump in density. Mirrors makeToneField
 * (plane mean), the AM spot area and the transfer's base .96; expansion is disabled. */
export function groundFirstCoverage(s:{groundOpacity:number;tonePlaneMin:number;tonePlaneMax:number;dotGain:number;primaryDotShape?:string}){
 const tone=Math.max(.005,Math.min(.97,(s.tonePlaneMin+s.tonePlaneMax)/2))*s.groundOpacity;
 if(tone<=0)return 0;
 const gain=0,v=Math.min(1,tone+gain*.32*4*tone*(1-tone)),shape=(s.primaryDotShape||'round') as Parameters<typeof spotT>[0];
 let inked=0;const n=64;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(v>spotT(shape,(x+.5)/n,(y+.5)/n))inked++;
 return .96*inked/(n*n);
}
