import type {Pixels} from './print.ts';
export type RGB=[number,number,number];
export type PlateRecipe={black:number;white:number;contrast:number;levels:number;gain:number;starvation:number;grain:number;seed:number};
export type PortraitPlates={width:number;height:number;alpha:Float32Array;tone:Float32Array;plates:[Float32Array,Float32Array]};
export function clamp(n:number){return Math.max(0,Math.min(1,n));}
export function smooth(n:number){const t=clamp(n);return t*t*(3-2*t);}
export function hexRGB(hex:string):RGB{return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)) as RGB;}
export function noise(x:number,y:number,seed:number){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export function preparePortrait(p:Pixels,s:PlateRecipe):PortraitPlates{
 const n=p.width*p.height,tone=new Float32Array(n),alpha=new Float32Array(n),a=new Float32Array(n),b=new Float32Array(n);
 for(let i=0;i<n;i++){
  alpha[i]=p.data[i*4+3]>=128?1:0;
  const lum=(.299*p.data[i*4]+.587*p.data[i*4+1]+.114*p.data[i*4+2])/255;
  const normalized=clamp((lum-s.black)/(s.white-s.black));
  const l=Math.round(clamp((normalized-.5)*s.contrast+.5)*(s.levels-1))/(s.levels-1);tone[i]=l;
  // A carries highlights/midtones below 70%; B only the darkest 35%.
  a[i]=l<.7?(.24+.58*(.7-l)/.7)*alpha[i]:0;
  b[i]=l<.35?(.94*((.35-l)/.35)**.7)*alpha[i]:0;
 }
 return {width:p.width,height:p.height,alpha,tone,plates:[a,b]};
}
export function samplePlate(p:PortraitPlates,u:number,v:number){
 const x=Math.floor(u*p.width),y=Math.floor(v*p.height);
 if(x<0||y<0||x>=p.width||y>=p.height)return {alpha:0,ink:[0,0]};
 const i=y*p.width+x;return {alpha:p.alpha[i],ink:[p.plates[0][i],p.plates[1][i]]};
}
export function shadowWear(u:number,v:number,strength:number){
 const patch=(x:number,y:number,rx:number,ry:number)=>Math.exp(-(((u-x)/rx)**2+((v-y)/ry)**2));
 return 1-strength*Math.max(patch(.46,.57,.09,.095),patch(.55,.77,.12,.06));
}
