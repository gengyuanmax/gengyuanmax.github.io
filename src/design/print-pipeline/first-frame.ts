import {screenScale} from '../screen.ts';
import {spotT} from './noise.ts';
import {noiseBudget,within} from './budget.ts';

/** What the page shows before any canvas or mask exists must already be the final
 * print, not a different stand-in. These helpers derive that first frame from the
 * same parameters the pipeline uses, so CSS can paint it without JavaScript. */

/** Same rule as typeScreenLevel/screen(): integer CSS px; below 1.5 × medium the
 * display name reuses the fine tier instead of inventing another frequency. */
export function dotPitch(fontSize:number){
 const coarse=Math.max(2,Math.round(fontSize*screenScale.coarseEm));
 return coarse>=screenScale.medium*1.5?coarse:screenScale.fine;
}
const tile=16,columns=400,rows=100;
/** The display name's blue plate as a vector mask: one uniform AM lattice of hard
 * round dots at the plate angle, radius = pitch × min(.38, recipe radius) exactly as
 * printText. CSS scales it with mask-size = pitch × (columns, rows) and the glyphs clip it. */
export function dotPlateImage(angle:number,radius:number){
 const r=(tile*Math.min(.38,radius)).toFixed(3),w=tile*columns,h=tile*rows;
 const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><pattern id='d' width='${tile}' height='${tile}' patternUnits='userSpaceOnUse' patternTransform='rotate(${angle})'><circle cx='${tile/2}' cy='${tile/2}' r='${r}'/></pattern><rect width='${w}' height='${h}' fill='url(#d)'/></svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g,' ').replace(/%3D/g,'=').replace(/%3A/g,':').replace(/%2F/g,'/').replace(/%2C/g,',').replace(/%27/g,"'")}")`;
}
export const dotPlateGrid={columns,rows};

/** Mean ink of a screened plane ground, used as its flat first frame so the screen
 * arriving later only adds texture, never a jump in density. Mirrors makeToneField
 * (plane mean), the midtone gain curve, the AM spot area and the transfer's base .96. */
export function groundFirstCoverage(s:{groundOpacity:number;tonePlaneMin:number;tonePlaneMax:number;dotGain:number;primaryDotShape?:string}){
 const tone=Math.max(.005,Math.min(.97,(s.tonePlaneMin+s.tonePlaneMax)/2))*s.groundOpacity;
 if(tone<=0)return 0;
 const gain=within(s.dotGain,noiseBudget.dotGain),v=Math.min(1,tone+gain*.32*4*tone*(1-tone)),shape=(s.primaryDotShape||'round') as Parameters<typeof spotT>[0];
 let inked=0;const n=64;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(v>spotT(shape,(x+.5)/n,(y+.5)/n))inked++;
 return .96*inked/(n*n);
}
