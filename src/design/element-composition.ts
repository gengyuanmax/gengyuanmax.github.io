/**
 * Adapted from Gengyuan Zhang's Print Lab, src/element.html, e1c9d82.
 * mxLayer → mxPrint → mxCompose → mxPaint. See licenses/print-lab.txt.
 * Geometry coverage (mask) stays separate from screened ink (print).
 */
export const operations = {
 over:'叠印', opaque:'不透明遮盖', knock:'挖空', trap:'挖空 + 陷印',
 keyline:'留白描边', shadow:'硬边投影', reverse:'反白', weave:'交织',
 union:'并集', inter:'交集', xor:'排除重叠', fill:'同版填充', clip:'剪切蒙版 + 描边',
} as const;
export type Operation = keyof typeof operations;
export type Field = {mask:Float32Array; print:Float32Array};
export type Plate = {ink:'a'|'b'; coverage:Float32Array; opaque?:boolean};
export type RGB = readonly [number,number,number];
export const rgb = (hex:string):RGB => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)) as unknown as RGB;
import {legacyXorshift as noise} from './print-pipeline/noise.ts';
export {noise};

export {darkness} from './print-pipeline/sources.ts';
export function screen(tone:Float32Array,width:number,height:number,pitch:number,angle:number){
 const out=new Float32Array(tone.length),a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),tau=Math.PI*2;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,v=tone[i];if(!v)continue;
  const u=(x*c+y*s)/pitch,w=(-x*s+y*c)/pitch;
  out[i]=(Math.cos(tau*u)+Math.cos(tau*w)+2)/4>1-v?1:0;
 }
 return out;
}
export {morph,compose} from './print-pipeline/composition.ts';
export function paint(plates:Plate[],width:number,height:number,inks:{a:RGB;b:RGB;paper:RGB},offset:{x:number;y:number},seed=5){
 const data=new Uint8ClampedArray(width*height*4),rn=noise(seed),dx=Math.round(offset.x),dy=Math.round(offset.y);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,strength=.95-.22*rn(),color=[...inks.paper];
  for(const p of plates){
   const xx=x-(p.ink==='b'?dx:0),yy=y-(p.ink==='b'?dy:0);
   if(xx<0||xx>=width||yy<0||yy>=height)continue;
   const v=p.coverage[yy*width+xx];if(!v)continue;
   const ink=inks[p.ink],t=p.opaque?v*(.97-.05*rn()):v*strength;
   for(let k=0;k<3;k++)color[k]=p.opaque?color[k]+(ink[k]-color[k])*t:color[k]*(1-t*(1-ink[k]/255));
  }
  data.set([...color,255],i*4);
 }
 return data;
}
