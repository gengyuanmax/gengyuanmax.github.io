import {screen,type ScreenLevel,type ScreenShape} from './screen.ts';
import {rng,lowNoise,spread,spotT,boxBlur} from './vendor/print-lab-core.js';
import type {Plate,RGB} from './element-composition.ts';
import type {Settings} from './settings.ts';
import {toneSettings,type ToneSettings} from './tone-field.ts';

/** Print Lab's mask spreading and ink-transfer stages, adapted to rectangular
 * web elements. All distances below are CSS pixels, independent of object size.
 * The native square noise functions are reused; only their sampling scale changes. */
export const materialVersion='print-lab-e1c9d82-web-material-4-screen-scale';
export type Press = {level:ScreenLevel;shapes:{a:ScreenShape;b:ScreenShape};pitch:number;angles:{a:number;b:number};gain:number;grain:number;starve:number;cluster:number;edge:number;holes:number;seed:number;offset:{x:number;y:number};patch?:number;role?:'title'|'field'|'image';tone?:ToneSettings};
export function pressSettings(s:Settings,level:ScreenLevel='medium',fontSize=128):Press{
 const a=screen(level,'a',s,fontSize),b=screen(level,'b',s,fontSize);
 return {level,pitch:a.pitch,shapes:{a:a.shape,b:b.shape},angles:{a:a.angle,b:b.angle},gain:s.dotGain,grain:s.grain,starve:s.starvation,cluster:s.grainSize,edge:s.inkEdge,holes:s.pressGrain,seed:s.seed,offset:{x:s.registration,y:s.registrationY},tone:toneSettings(s)};
}
/** Each element has a stable independent field, rather than restarting the same
 * noise tile. Ink plates then use independent samples from that field. */
export function elementPress(p:Press,key:string,role:NonNullable<Press['role']>,fontSize=180):Press{
 let seed=p.seed;for(const c of key)seed=(Math.imul(seed,31)+c.charCodeAt(0))|0;
 return {...p,seed,role,patch:role==='title'?Math.max(4,fontSize/3):160,
  grain:Math.min(role==='title'?.08:.2,p.grain),starve:Math.min(role==='title'?.08:.25,p.starve)};
}
const cache=new Map<string,{n:number;fine:Float32Array;low:Float32Array;edge:Float32Array}>();
export function materialFields(width:number,height:number,scale:number,p:Press){
 const n=Math.max(width,height),diameter=Math.min(2,p.cluster,p.pitch*scale*.3),patch=p.patch||160;
 const key=JSON.stringify([n,scale,diameter,patch,p.seed]);
 const hit=cache.get(key);if(hit)return hit;
 // Native lowNoise smoothstep interpolation, generated at device resolution.
 // Fine grain is <= 2 device pixels AND <= .3 screen cells, never enlarged.
 const random=rng(p.seed),fine=lowNoise(n,Math.max(1,Math.ceil(n/Math.max(.5,diameter))),random);
 const lo=lowNoise(n,Math.max(1,Math.ceil(n/(patch*.5*scale))),random),hi=lowNoise(n,Math.max(1,Math.ceil(n/(patch*.2*scale))),random);
 const low=lo.map((v:number,i:number)=>v*.65+hi[i]*.35);
 const edge=lowNoise(n,Math.max(1,Math.round(n/(1.5*scale))),random);
 const result={n,fine,low,edge};if(cache.size>4)cache.clear();cache.set(key,result);return result;
}
export function screenPlate(tone:Float32Array,width:number,height:number,ink:'a'|'b',p:Press,scale=1,origin={x:0,y:0},solid=false){
 const {n,edge}=materialFields(width,height,scale,p),mask=new Float32Array(n*n),a=p.angles[ink]*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const value=tone[y*width+x];if(!value)continue;
  // Print Lab plates(): gain peaks in midtones; screen(): fixed AM lattice.
  const v=Math.min(1,value+p.gain*.32*4*value*(1-value));
  const xx=x/scale+origin.x,yy=y/scale+origin.y;
  mask[y*n+x]=solid?value:Number(v>spotT(p.shapes[ink],(xx*c+yy*s)/p.pitch,(-xx*s+yy*c)/p.pitch));
 }
 if(p.edge>0){
  const worn=mask.slice();spread(worn,n,1,edge,.3+.6*p.gain,ink==='a'?0:7919);
  const softened=boxBlur(worn,n,1),amount=Math.min(.5,p.edge*scale);
  // Native square dilation is softened before transfer; it must not stamp
  // full-strength square blocks into the edge of a letter or halftone dot.
  for(let i=0;i<mask.length;i++)mask[i]+=Math.max(0,softened[i]-mask[i])*amount;
 }
 const out=new Float32Array(width*height);
 for(let y=0;y<height;y++)out.set(mask.subarray(y*n,y*n+width),y*width);
 return out;
}
export function paintMaterial(plates:Plate[],width:number,height:number,inks:{a:RGB;b:RGB;paper:RGB},p:Press,scale=1){
 const f=materialFields(width,height,scale,p),data=new Uint8ClampedArray(width*height*4);
 const twoInks=plates.some(v=>v.ink==='a'&&v.coverage.some(x=>x>0))&&plates.some(v=>v.ink==='b'&&v.coverage.some(x=>x>0));
 // This is an affected-area fraction, NOT a knockout fraction. At most 4% of
 // fine samples lose a small amount of ink. No sample is punched to zero.
 const fraction=Math.min(.04,Math.max(0,p.holes)),histogram=new Uint32Array(1024);
 for(const v of f.fine)histogram[Math.min(1023,Math.floor(v*1024))]++;
 let count=0,threshold=0;for(;threshold<1024;threshold++){count+=histogram[threshold];if(count>=f.fine.length*fraction)break;}
 const cut=threshold/1024;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,fi=y*f.n+x,col=[...inks.paper];
  for(const plate of plates){
   const dx=twoInks&&plate.ink==='b'?Math.round(p.offset.x*scale):0,dy=twoInks&&plate.ink==='b'?Math.round(p.offset.y*scale):0;
   const xx=x-dx,yy=y-dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;
   const cover=plate.coverage[yy*width+xx];if(!cover)continue;
   const j=plate.ink==='a'?fi:f.n*f.n-1-fi,l=f.low[j],m=l<.42?0:l>.8?1:(l-.42)/.38;
   // Print Lab ink multiplication, with explicit limits on each loss process.
   // Starvation only thins ink; fine grain is a tiny, smooth concentration dip.
   const grain=fraction&&cut?Math.max(0,(cut-f.fine[j])/cut):0;
   const grainLoss=Math.min(p.role==='title'?.08:.2,Math.max(0,p.grain))*grain;
   const starvationLoss=Math.min(p.role==='title'?.08:.25,Math.max(0,p.starve))*m*m;
   const strength=.96*(1-grainLoss)*(1-starvationLoss);
   const t=cover*strength,K=inks[plate.ink];
   for(let k=0;k<3;k++)col[k]=plate.opaque?col[k]+(K[k]-col[k])*t:col[k]*(1-t*(1-K[k]/255));
  }
  for(let k=0;k<3;k++)data[i*4+k]=col[k];data[i*4+3]=col.every(v=>v===255)?0:255;
 }
 return data;
}
