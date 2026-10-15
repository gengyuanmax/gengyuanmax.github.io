import type {Field,Plate,Operation} from '../element-composition.ts';
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
/** Combine source coverage (knockout, trapping, etc.); no ink transfer or RGB mixing. */
export function composePlateCoverage(a:Field,b:Field,width:number,height:number,scale:number,op:Operation):Plate[]{
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

/** Compatibility alias for existing Element Lab callers. */
export {composePlateCoverage as compose};
