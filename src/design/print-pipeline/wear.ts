import {salt,valueNoise} from './noise.ts';
import {sheetFields} from './sheet.ts';
import {noiseBudget,within} from './budget.ts';
/** `wear-v1`: worn plate edges (user, 2026-10-16). Before screening, a shape loses ink
 * along its boundary the way a hand-inked Riso plate does: a slow, seeded inset of up to
 * `depth` CSS px (the edge is never a ruler line) and, just inside it, scattered missing
 * dots that thin out towards the interior. Everything is in page-sheet coordinates, so
 * neighbouring prints wear consistently. Applied to grounds and metro lines alike. */
export const wearVersion='wear-v1';
export type Wear={depth:number;speckle:number};
export function wearEdges(mask:Float32Array,w:number,h:number,scale:number,seed:number,origin:{x:number;y:number},wear:Wear){
 const depth=within(wear.depth,noiseBudget.wear.depth),speckle=within(wear.speckle,noiseBudget.wear.speckle);
 if(!depth&&!speckle)return mask;
 // Chamfer distance (device px) from every inked pixel to the nearest unprinted one.
 const big=1e9,d=new Float32Array(w*h);
 for(let i=0;i<d.length;i++)d[i]=mask[i]>.02?big:0;
 // Pixels on the box border count as next to paper only if the shape is cut there.
 const D=1,E=Math.SQRT2;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!d[i])continue;let v=d[i];
  if(x>0)v=Math.min(v,d[i-1]+D);if(y>0){v=Math.min(v,d[i-w]+D);if(x>0)v=Math.min(v,d[i-w-1]+E);if(x<w-1)v=Math.min(v,d[i-w+1]+E);}d[i]=v;}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!d[i])continue;let v=d[i];
  if(x<w-1)v=Math.min(v,d[i+1]+D);if(y<h-1){v=Math.min(v,d[i+w]+D);if(x<w-1)v=Math.min(v,d[i+w+1]+E);if(x>0)v=Math.min(v,d[i+w-1]+E);}d[i]=v;}
 const low=valueNoise(salt(seed,'wear-inset'),noiseBudget.wear.wave),fine=sheetFields(seed).edge,out=new Float32Array(mask);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(!out[i]||d[i]>=big)continue;
  const dist=d[i]/scale;if(dist>depth*2+1)continue;
  const sx=origin.x+(x+.5)/scale,sy=origin.y+(y+.5)/scale,inset=depth*low(sx,sy);
  if(dist<inset){out[i]=0;continue;}
  const t=(dist-inset)/Math.max(.5,depth);
  if(t<1&&fine(sx,sy)<speckle*(1-t)*(1-t))out[i]=0;
 }
 return out;
}
