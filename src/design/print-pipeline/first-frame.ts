import {screenScale} from '../screen.ts';
import {spotT,rng,salt} from './noise.ts';
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
const tile=16,columns=400,rows=100,period=24;
/** Periodic value noise over dot indices (wraps every `period` dots), so the mask tile
 * repeats without a seam. Seeded with the page seed through the shared PRNG. */
function periodicNoise(seed:number,grid:number){
 const n=period/grid,lattice=Array.from({length:n*n},(_,i)=>rng(salt(seed,`name-dots:${grid}:${i}`))());
 const at=(i:number,j:number)=>lattice[((j%n)+n)%n*n+((i%n)+n)%n];
 return (i:number,j:number)=>{const x=i/grid,y=j/grid,ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,su=u*u*(3-2*u),sv=v*v*(3-2*v);
  return (at(ix,iy)*(1-su)+at(ix+1,iy)*su)*(1-sv)+(at(ix,iy+1)*(1-su)+at(ix+1,iy+1)*su)*sv;};
}
/** The display name's blue plate dots in tile units (one dot per `tile`), period × period.
 * A Riso master is never perfectly even: dot size follows a low-frequency ink field
 * (features of 3–6 dots) plus a small per-dot term, and each dot sits slightly off its
 * lattice point. Both stay inside noiseBudget.text.dots, so the screen reads as print,
 * not as glitch: no dot is removed, merged or broken. */
export function nameDots(radius:number,seed=0){
 const b=noiseBudget.text.dots,base=tile*Math.min(.38,radius),low=periodicNoise(seed,6),mid=periodicNoise(salt(seed,'mid'),3),out:{x:number;y:number;r:number}[]=[];
 for(let j=0;j<period;j++)for(let i=0;i<period;i++){
  const r=rng(salt(seed,`name-dot:${i}:${j}`)),field=(low(i,j)*.7+mid(i,j)*.3)*2-1,own=r()*2-1;
  const scale=1+Math.max(-b.radius,Math.min(b.radius,field*b.radius*.75+own*b.radius*.25));
  out.push({x:(i+.5)*tile+(r()*2-1)*b.shift*tile,y:(j+.5)*tile+(r()*2-1)*b.shift*tile,r:Math.min(tile*.48,base*scale)});
 }
 return out;
}
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
 * (plane mean), the midtone gain curve, the AM spot area and the transfer's base .96. */
export function groundFirstCoverage(s:{groundOpacity:number;tonePlaneMin:number;tonePlaneMax:number;dotGain:number;primaryDotShape?:string}){
 const tone=Math.max(.005,Math.min(.97,(s.tonePlaneMin+s.tonePlaneMax)/2))*s.groundOpacity;
 if(tone<=0)return 0;
 const gain=within(s.dotGain,noiseBudget.dotGain),v=Math.min(1,tone+gain*.32*4*tone*(1-tone)),shape=(s.primaryDotShape||'round') as Parameters<typeof spotT>[0];
 let inked=0;const n=64;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(v>spotT(shape,(x+.5)/n,(y+.5)/n))inked++;
 return .96*inked/(n*n);
}
