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
export function noise(seed:number){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}

export function darkness(data:Uint8ClampedArray,photo:boolean){
 const n=data.length/4,mask=new Float32Array(n),tone=new Float32Array(n);
 let lo=0,hi=1;
 if(photo){
  const values:number[]=[];
  for(let i=0;i<n;i+=3)if(data[i*4+3]>128)values.push((.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2])/255);
  values.sort((a,b)=>a-b);
  if(values.length>20){lo=values[Math.floor(values.length*.02)];hi=values[Math.floor(values.length*.98)];}
 }
 for(let i=0;i<n;i++){
  const a=data[i*4+3]/255;mask[i]=a;if(!a)continue;
  let light=(.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2])/255;
  if(photo)light=Math.pow(Math.max(0,Math.min(1,(light-lo)/Math.max(.05,hi-lo))),1.1);
  tone[i]=a*(1-light);
 }
 return{mask,tone};
}
export function screen(tone:Float32Array,width:number,height:number,pitch:number,angle:number){
 const out=new Float32Array(tone.length),a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),tau=Math.PI*2;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,v=tone[i];if(!v)continue;
  const u=(x*c+y*s)/pitch,w=(-x*s+y*c)/pitch;
  out[i]=(Math.cos(tau*u)+Math.cos(tau*w)+2)/4>1-v?1:0;
 }
 return out;
}
export function morph(mask:Float32Array,width:number,height:number,radius:number,grow:boolean){
 const r=Math.max(1,Math.round(radius)),tmp=new Float32Array(mask.length),out=new Float32Array(mask.length),pick=grow?Math.max:Math.min;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let v=grow?0:1;
  for(let k=-r;k<=r;k++)v=pick(v,x+k<0||x+k>=width?0:mask[y*width+x+k]);tmp[y*width+x]=v;
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  let v=grow?0:1;
  for(let k=-r;k<=r;k++)v=pick(v,y+k<0||y+k>=height?0:tmp[(y+k)*width+x]);out[y*width+x]=v;
 }
 return out;
}
function shift(mask:Float32Array,width:number,height:number,dx:number,dy:number){
 const out=new Float32Array(mask.length),ix=Math.round(dx),iy=Math.round(dy);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const xx=x-ix,yy=y-iy;if(xx>=0&&xx<width&&yy>=0&&yy<height)out[y*width+x]=mask[yy*width+xx];
 }
 return out;
}
export function compose(a:Field,b:Field,width:number,height:number,scale:number,op:Operation):Plate[]{
 const A=a.print,B=b.print,MA=a.mask,MB=b.mask,plates:Plate[]=[];
 const add=(ink:Plate['ink'],coverage:Float32Array,opaque=false)=>{
  const existing=plates.find(p=>p.ink===ink&&!!p.opaque===opaque);
  if(existing)existing.coverage=existing.coverage.map((v,i)=>Math.min(1,Math.max(v,coverage[i])));
  else plates.push({ink,coverage,opaque});
 };
 const minus=(p:Float32Array,m:Float32Array)=>p.map((v,i)=>v*(1-m[i]));
 switch(op){
  case 'over':add('a',A);add('b',B);break;
  case 'opaque':add('a',A);add('b',B,true);break;
  case 'knock':add('a',minus(A,MB));add('b',B);break;
  case 'trap':add('a',minus(A,morph(MB,width,height,3*scale,false)));add('b',B);break;
  case 'keyline':add('a',minus(A,morph(MB,width,height,9*scale,true)));add('b',B);break;
  case 'shadow':add('a',A);add('a',shift(MB,width,height,11*scale,8*scale));add('b',B);break;
  case 'reverse':add('a',minus(A,MB));break;
  case 'weave':{
   const stripes=MA.map((_,i)=>Math.floor((i%width+Math.floor(i/width)*.6)/(70*scale))%2);
   add('a',A.map((v,i)=>v*(1-(stripes[i]?MB[i]:0))));add('b',B.map((v,i)=>v*(1-(stripes[i]?0:MA[i]))));break;
  }
  case 'union':add('a',A.map((v,i)=>Math.max(v,B[i])));break;
  case 'inter':add('a',A.map((v,i)=>Math.max(v,B[i])*MA[i]*MB[i]));break;
  case 'xor':add('a',A.map((v,i)=>v*(1-MB[i])+B[i]*(1-MA[i])));break;
  case 'fill':add('a',B.map((v,i)=>v*MA[i]));break;
  case 'clip':add('a',morph(MA,width,height,2*scale,true).map((v,i)=>v*(1-MA[i])));add('b',B.map((v,i)=>v*MA[i]));break;
 }
 return plates;
}
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
