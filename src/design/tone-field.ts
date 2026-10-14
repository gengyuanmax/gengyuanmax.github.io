import {lowNoise,rng} from './vendor/print-lab-core.js';
import type {Settings} from './settings.ts';

/** Source-image construction, before the existing Print Lab AM screen.
 * Values are ink demand: 0 is white paper, 1 is black in the exported source.
 * This does not alter the screen lattice, ink transfer or title rendering. */
export type ToneKind='plane'|'sphere';
export type ToneSettings={light:number;noise:number;noiseScale:number;planeMin:number;planeMax:number;sphereMin:number;sphereMax:number;direction:number;exposure:number};
export const toneSettings=(s:Settings,exposure=1):ToneSettings=>({light:s.toneLight,noise:s.toneNoise,noiseScale:s.toneNoiseScale,planeMin:s.tonePlaneMin,planeMax:s.tonePlaneMax,sphereMin:s.toneSphereMin,sphereMax:s.toneSphereMax,direction:s.toneDirection,exposure});
export type ToneBounds={x:number;y:number;width:number;height:number};
export function maskBounds(mask:Float32Array,width:number,height:number):ToneBounds{
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(mask[y*width+x]>.01){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return right<0?{x:0,y:0,width,height}:{x:left,y:top,width:right-left+1,height:bottom-top+1};
}
export function makeToneField(mask:Float32Array,width:number,height:number,scale:number,kind:ToneKind,s:ToneSettings,seed:number,bounds=maskBounds(mask,width,height)){
 if(s.exposure===0)return new Float32Array(width*height);
 const n=Math.max(width,height),random=rng(seed),noise=lowNoise(n,Math.max(1,Math.ceil(n/(s.noiseScale*.5*scale))),random);
 const second=lowNoise(n,Math.max(1,Math.ceil(n/(s.noiseScale*.23*scale))),random);
 const out=new Float32Array(width*height),angle=s.light*Math.PI/180,lx=Math.cos(angle)*.66,ly=Math.sin(angle)*.66,lz=Math.sqrt(1-.66*.66);
 const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(!mask[i])continue;
  const u=((x-bounds.x+.5)/bounds.width-.5)*2,v=((y-bounds.y+.5)/bounds.height-.5)*2;
  let value:number;
  if(kind==='sphere'){
   const z=Math.sqrt(Math.max(0,1-u*u-v*v)),dot=u*lx+v*ly+z*lz;
   const diffuse=Math.pow(Math.max(0,dot),.85),terminator=.055*Math.exp(-Math.pow((dot-.06)/.16,2));
   const bounce=.12*Math.pow(1-z,2)*Math.max(0,-(u*lx+v*ly));
   value=s.sphereMax-(s.sphereMax-s.sphereMin)*diffuse+terminator-bounce;
  }else{
   // A weak directional bias, deliberately smaller than the full tonal range.
   // Upper-left illumination means lower ink demand at the upper-left corner.
   const direction=-(u*lx+v*ly)/(Math.abs(lx)+Math.abs(ly));
   value=(s.planeMin+s.planeMax)/2+(s.planeMax-s.planeMin)/2*direction*s.direction;
  }
  const variation=((noise[y*n+x]*.7+second[y*n+x]*.3)-.5)*2*s.noise;
  const lo=kind==='sphere'?s.sphereMin:s.planeMin,hi=kind==='sphere'?s.sphereMax:s.planeMax;
  out[i]=mask[i]*clamp(clamp(value+variation,lo,hi)*s.exposure,.005,.97);
 }
 return out;
}
export function grayscaleTone(tone:Float32Array){
 const pixels=new Uint8ClampedArray(tone.length*4);
 for(let i=0;i<tone.length;i++){pixels[i*4]=pixels[i*4+1]=pixels[i*4+2]=Math.round(255*(1-tone[i]));pixels[i*4+3]=255;}
 return pixels;
}
