import { palettes, type Settings, type InkPalette } from './settings.ts';
// Adapted from the user's Print Lab: channel separation, spot thresholds and ink transfer.
// https://gengyuanmax.github.io/print-lab/index.html
// Rectangular, alpha-preserving implementation shared by the editor and build.
export const rendererVersion = 'print-lab-rgba-v2';
export interface Pixels { width:number; height:number; data:Uint8Array | Uint8ClampedArray }
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const TAU=Math.PI*2;
export function cropRect(width:number,height:number,s:Settings){
 const w=width/s.imageZoom,h=height/s.imageZoom;
 return {x:(width-w)*s.imageX,y:(height-h)*s.imageY,width:w,height:h};
}
export function makeRandom(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
function hash(x:number,y:number,seed:number){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function field(x:number,y:number,seed:number){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);return (hash(ix,iy,seed)*(1-a)+hash(ix+1,iy,seed)*a)*(1-b)+(hash(ix,iy+1,seed)*(1-a)+hash(ix+1,iy+1,seed)*a)*b;}
function spot(shape:string,u:number,w:number){
 const fu=u-Math.floor(u)-.5,fw=w-Math.floor(w)-.5;
 if(shape==='ellipse')return 1-(Math.cos(TAU*u)+.55*Math.cos(TAU*w)+1.55)/3.1;
 if(shape==='diamond'){const d=Math.abs(fu)+Math.abs(fw);return d<=.5?2*d*d:1-2*(1-d)*(1-d);}
 if(shape==='square')return 4*Math.max(Math.abs(fu),Math.abs(fw))**2;
 return 1-(Math.cos(TAU*u)+Math.cos(TAU*w)+2)/4;
}
function fixedDot(shape:string,u:number,w:number){
 const x=u-Math.floor(u)-.5,y=w-Math.floor(w)-.5;
 if(shape==='ellipse')return x*x+y*y*2.4<.13;
 if(shape==='diamond')return Math.abs(x)+Math.abs(y)<.42;
 if(shape==='square')return Math.max(Math.abs(x),Math.abs(y))<.29;
 return x*x+y*y<.105;
}
export function separatePlates(p:Pixels,s:Settings){
 const a=new Float32Array(p.width*p.height),b=s.inkMode==='one'?null:new Float32Array(a.length);
 const f=(v:number)=>{v=clamp((v-.5)*s.contrast+.5);return clamp(v+s.dotGain*.32*4*v*(1-v));};
 for(let i=0;i<a.length;i++){
  const r=p.data[i*4]/255,g=p.data[i*4+1]/255,bl=p.data[i*4+2]/255;
  const d=1-(.299*r+.587*g+.114*bl);
  if(!b)a[i]=f(d);
  else if(s.inkMode==='separated'){const cyan=1-r;a[i]=f(cyan);b[i]=f(Math.max(0,1-g-cyan*.6));}
  else {const v=f(d);a[i]=v**1.9;b[i]=v**.75;}
 }
 return b?[a,b]:[a];
}
const bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function screen(plate:Float32Array,width:number,height:number,s:Settings,layer:number){
 const out=new Uint8Array(plate.length),angle=(s.printAngle+layer*(s.printMethod==='lines'||s.printMethod==='hatch'?45:30))*Math.PI/180;
 const cos=Math.cos(angle),sin=Math.sin(angle),pitch=s.printPitch;
 const at=(x:number,y:number)=>plate[Math.max(0,Math.min(height-1,Math.floor(y)))*width+Math.max(0,Math.min(width-1,Math.floor(x)))];
 if(['bayer','fs','fm'].includes(s.printMethod)){
  const block=Math.max(1,Math.round(pitch/(s.printMethod==='fm'?4.5:3.5))),bw=Math.ceil(width/block),bh=Math.ceil(height/block);
  const v=new Float32Array(bw*bh),bits=new Uint8Array(v.length);
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++)v[y*bw+x]=at(x*block+block/2,y*block+block/2);
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){
   const i=y*bw+x,t=s.printMethod==='bayer'?(bayer[(y+layer)%4][(x+layer*2)%4]+.5)/16:s.printMethod==='fm'?hash(x,y,s.seed+layer):.5;
   bits[i]=v[i]>t?1:0;
   if(s.printMethod==='fs'){const e=v[i]-bits[i];if(x+1<bw)v[i+1]+=e*7/16;if(y+1<bh){if(x>0)v[i+bw-1]+=e*3/16;v[i+bw]+=e*5/16;if(x+1<bw)v[i+bw+1]+=e/16;}}
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)out[y*width+x]=bits[Math.floor(y/block)*bw+Math.floor(x/block)];
  return out;
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,v=plate[i],u=(x*cos+y*sin)/pitch,w=(-x*sin+y*cos)/pitch;
  if(v<=0)continue;
  let on=false;
  if(s.printMethod==='am')on=v>spot(s.dotShape,u,w);
  else if(s.printMethod==='lines')on=v>(1-Math.cos(TAU*w))/2;
  else if(s.printMethod==='hatch'){const t1=(1-Math.cos(TAU*w))/2,t2=(1-Math.cos(TAU*u))/2;on=Math.min(1,v*1.7)>t1*.95+.03||(v>.42&&(v-.42)/.58*1.1>t2);}
  else if(s.printMethod==='benday'){const cu=Math.floor(u)+.5,cw=Math.floor(w)+.5,center=at((cu*cos-cw*sin)*pitch,(cu*sin+cw*cos)*pitch);on=center>.78||(center>.2&&fixedDot(s.dotShape,u,w));}
  else on=v>.5;
  out[i]=on?1:0;
 }
 return out;
}
export function renderPrint(p:Pixels,s:Settings,customPalette?:InkPalette):Pixels{
 const {width,height,data}=p;
 if(width<=0||height<=0||data.length!==width*height*4)throw new Error('Invalid RGBA image');
 const palette=customPalette||palettes[s.palette as keyof typeof palettes];
 const plates=separatePlates(p,s),output=new Float32Array(data.length),alpha=new Float32Array(width*height);
 const colors=[palette.primary,palette.secondary].map(color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255));
 for(let layer=0;layer<plates.length;layer++){
  const mask=screen(plates[layer],width,height,s,layer),dx=layer?Math.round(s.registration):0,dy=layer?Math.round(s.registrationY):0;
  const color=colors[layer],seed=s.seed+layer*97;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const sx=x-dx,sy=y-dy;if(sx<0||sy<0||sx>=width||sy>=height)continue;
   const source=sy*width+sx;if(!mask[source]||!data[source*4+3])continue;
   const i=y*width+x,edge=Math.min(sx/width,(width-sx)/width,sy/height,(height-sy)/height),fade=s.edgeFade?clamp(edge/s.edgeFade):1;
   const coarse=field(sx/44,sy/44,seed),starve=clamp((coarse-.42)/.38)**2;
   const strength=(1-s.grain*.85*hash(sx,sy,seed)**1.6)*(1-s.starvation*.92*starve)*(1-s.banding*.5*field(0,sy/24,seed+71));
   const a=strength*data[source*4+3]/255*fade*fade*(3-2*fade),ab=alpha[i],ao=a+ab*(1-a);
   for(let k=0;k<3;k++){
    const old=output[i*4+k],c=color[k],mixed=s.blend==='normal'?c:old*c;
    output[i*4+k]=ao?(a*(1-ab)*c+a*ab*mixed+(1-a)*ab*old)/ao:0;
   }
   alpha[i]=ao;
  }
 }
 const bytes=new Uint8ClampedArray(data.length);
 for(let i=0;i<alpha.length;i++){for(let c=0;c<3;c++)bytes[i*4+c]=Math.round(output[i*4+c]*255);bytes[i*4+3]=Math.round(alpha[i]*255);}
 return {width,height,data:bytes};
}
