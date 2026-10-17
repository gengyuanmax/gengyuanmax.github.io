import {registrationFrame} from './registration.ts';
import type {Dot,Transform} from './types.ts';
import {encodeAlphaPNG} from './png.ts';
export {createPrintMount} from './mount.ts';
export function surface(width:number,height:number){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
export function pixelSurface(data:Uint8ClampedArray,width:number,height:number){
 const c=surface(width,height);c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data),width,height),0,0);return c;
}
export function polygonSurface(dots:Dot[],color:string,width:number,height:number,dpr:number){
 const c=surface(Math.round(width*dpr),Math.round(height*dpr)),ctx=c.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=color;
 for(const dot of dots){ctx.beginPath();dot.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}
 return c;
}
/** Publish only completed pixels. Never clear the displayed canvas while preparing. */
export function publishCanvas(target:HTMLCanvasElement,prepared:HTMLCanvasElement){
 if(target.width!==prepared.width)target.width=prepared.width;if(target.height!==prepared.height)target.height=prepared.height;
 const ctx=target.getContext('2d')!;ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='copy';ctx.globalAlpha=1;ctx.drawImage(prepared,0,0);ctx.globalCompositeOperation='source-over';
}
export function cropSurface(input:HTMLCanvasElement,crop:{x:number;y:number;width:number;height:number},width:number,height:number){
 const c=surface(width,height);c.getContext('2d')!.drawImage(input,crop.x,crop.y,crop.width,crop.height,0,0,c.width,c.height);return c;
}
/** Ink strength is a uniform multiplier, not a noise/transfer stage. */
export type CanvasPlate={surface:HTMLCanvasElement;transform:Transform}&({inkStrength:number;transfer?:never}|{/** @deprecated Use inkStrength. */transfer:number;inkStrength?:never});
const buffers=new WeakMap<HTMLCanvasElement,HTMLCanvasElement>();
export function compositeCanvas(target:HTMLCanvasElement,paper:HTMLCanvasElement,layers:CanvasPlate[],width:number,height:number,dpr:number){
 let c=buffers.get(target);if(!c||c.width!==paper.width||c.height!==paper.height){c=surface(paper.width,paper.height);buffers.set(target,c);}
 const ctx=c.getContext('2d')!;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(paper,0,0);
 for(const layer of layers){const {cx,cy,x,y,rotation,scale}=registrationFrame(layer.transform,width,height);ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=layer.inkStrength??layer.transfer;ctx.globalCompositeOperation='multiply';ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);ctx.scale(scale,scale);ctx.translate(-cx,-cy);ctx.drawImage(layer.surface,0,0,width,height);ctx.restore();}
 publishCanvas(target,c);
}
export async function svgCoverage(markup:string,w:number,h:number){
 const c=surface(w,h),ctx=c.getContext('2d',{willReadFrequently:true})!;
 const image=new Image(),url=URL.createObjectURL(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 360 220"><g fill="black" color="black">${markup}</g></svg>`],{type:'image/svg+xml'}));
 try{await new Promise<void>((ok,bad)=>{image.onload=()=>ok();image.onerror=bad;image.src=url;});ctx.drawImage(image,0,0);}finally{URL.revokeObjectURL(url);}
 const rgba=ctx.getImageData(0,0,w,h).data;return Float32Array.from({length:w*h},(_,i)=>rgba[i*4+3]/255);
}
/** Development-only geometry markers; never part of an ink plate. */
export function drawAnchorProof(canvas:HTMLCanvasElement,points:{x:number;y:number}[],color:string,dpr:number){
 const context=canvas.getContext('2d')!;context.save();context.setTransform(dpr,0,0,dpr,0,0);context.strokeStyle=color;context.lineWidth=1;
 for(const {x,y} of points){context.beginPath();context.moveTo(x-4,y);context.lineTo(x+4,y);context.moveTo(x,y-4);context.lineTo(x,y+4);context.stroke();}context.restore();
}

/** Rasterize the actual loaded typeface and DOM line breaks; DOM retains semantics. */
export function textCoverage(el:HTMLElement,width:number,height:number,dpr:number){
 const source=el.classList.contains('he-type-a')?el.parentElement?.querySelector<HTMLElement>('.he-type-b')||el:el;
 const style=getComputedStyle(source),bounds=source.getBoundingClientRect(),c=surface(width,height),ctx=c.getContext('2d',{willReadFrequently:true})!;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='black';
 ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
 ctx.letterSpacing=style.letterSpacing==='normal'?'0px':style.letterSpacing;
 ctx.fontKerning='normal';ctx.textBaseline='alphabetic';
 const zoom=bounds.width/(source.offsetWidth||bounds.width);
 const metrics=ctx.measureText('Hg'),ascent=metrics.fontBoundingBoxAscent,descent=metrics.fontBoundingBoxDescent;
 const walker=document.createTreeWalker(source,NodeFilter.SHOW_TEXT);
 // Position each grapheme from DOM ranges, preserving variable-font advances,
 // wrapping and collapsed whitespace rather than rescaling a whole line.
 for(let node=walker.nextNode();node;node=walker.nextNode()){
  const text=node.textContent||'',range=document.createRange();
  for(const part of new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)){
   if(!part.segment.trim())continue;
   range.setStart(node,part.index);range.setEnd(node,part.index+part.segment.length);
   const r=range.getBoundingClientRect();if(!r.width)continue;
   ctx.save();ctx.translate((r.left-bounds.left)/zoom,(r.top-bounds.top)/zoom+(r.height/zoom-ascent-descent)/2+ascent);
   ctx.fillText(part.segment,0,0);ctx.restore();
  }
 }
 const rgba=ctx.getImageData(0,0,width,height).data;
 return Float32Array.from({length:width*height},(_,i)=>rgba[4*i+3]/255);
}

/** Paper coordinates before the design desk's preview zoom; scrolling cancels out. */
export function paperOrigin(el:Element,page:HTMLElement){
 const bounds=el.getBoundingClientRect(),paper=page.getBoundingClientRect(),zoom=paper.width/(page.offsetWidth||paper.width)||1;
 return {x:(bounds.left-paper.left)/zoom,y:(bounds.top-paper.top)/zoom};
}
/** Paint an alpha mask (0..1) in one ink colour straight into a canvas: no image
 * encoding, so many small printed marks stay cheap. */
export function paintAlpha(target:HTMLCanvasElement,alpha:Float32Array,width:number,height:number,color:[number,number,number]){
 if(target.width!==width)target.width=width;if(target.height!==height)target.height=height;
 const ctx=target.getContext('2d')!,img=ctx.createImageData(width,height);
 for(let i=0;i<alpha.length;i++){const j=i*4;img.data[j]=color[0];img.data[j+1]=color[1];img.data[j+2]=color[2];img.data[j+3]=Math.round(Math.max(0,Math.min(1,alpha[i]))*255);}
 ctx.putImageData(img,0,0);
}
/** Encode an alpha mask (0..1) as a PNG blob URL for CSS mask-image, in JS: no canvas
 * readback on the main thread. */
export function alphaMaskBlob(alpha:Float32Array,width:number,height:number){
 const bytes=new Uint8Array(alpha.length);for(let i=0;i<alpha.length;i++)bytes[i]=Math.round(Math.max(0,Math.min(1,alpha[i]))*255);
 return Promise.resolve(alphaMaskURL(bytes,width,height));
}
export function alphaMaskURL(alpha:Uint8Array,width:number,height:number){return URL.createObjectURL(new Blob([encodeAlphaPNG(alpha,width,height)],{type:'image/png'}));}

/** Shared DOM output backend: decode before publication and release superseded resources. */
export async function publishMask(target:HTMLElement,png:Uint8Array,ticket:{commit:(publish:()=>void)=>boolean}){
 const url=URL.createObjectURL(new Blob([png as BlobPart],{type:'image/png'}));
 try{
  const image=new Image();image.src=url;await image.decode();
  if(!ticket.commit(()=>{
   const previous=target.dataset.maskUrl;
   target.style.maskImage=`url(${url})`;target.style.maskSize='100% 100%';
   target.dataset.materialMask='true';target.dataset.maskUrl=url;
   if(previous)URL.revokeObjectURL(previous);
  }))URL.revokeObjectURL(url);
 }catch(error){URL.revokeObjectURL(url);throw error;}
}
export function clearMask(target:HTMLElement){
 const previous=target.dataset.maskUrl;
 target.style.removeProperty('mask-image');target.style.removeProperty('mask-size');
 delete target.dataset.materialMask;delete target.dataset.maskUrl;
 if(previous)URL.revokeObjectURL(previous);
}
