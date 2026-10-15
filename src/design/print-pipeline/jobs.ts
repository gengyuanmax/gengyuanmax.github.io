import {screenOriginal} from './index.ts';
import {paintMaterial,type Press} from './material.ts';
import {makeToneField,type ToneSettings} from './tone.ts';
import {renderFieldOriginals,type FieldOriginal} from './field.ts';
import {encodeAlphaPNG} from './png.ts';
import {routeCoverage,type RoutePath,type RouteStation} from './route.ts';
import {wearEdges} from './wear.ts';
import {noiseBudget} from './budget.ts';
import type {Settings} from '../settings.ts';
import type {RGB} from './types.ts';
/** Pure print jobs: everything after layout measurement. They run in a Web Worker when
 * the browser has one (src/client/print-worker.ts), else on the main thread; the
 * result is identical either way. */
export type MaskJob={kind:'mask';w:number;h:number;dpr:number;ground:boolean;groundOpacity:number;tone:ToneSettings;identity:string;ink:'a'|'b';press:Press;origin:{x:number;y:number};fontSize:number;radius:number;proof?:boolean;route?:RouteShape};
/** Metro lines printed as a ground: their geometry is the coverage the plane is screened in. */
export type RouteShape={paths:RoutePath[];radius:number;stations:RouteStation[]};
export type FieldJob={kind:'field';originals:FieldOriginal[];w:number;h:number;dpr:number;origin:{x:number;y:number};press:Press;settings:Settings;inks:{a:RGB;b:RGB;paper:RGB}};
export type MaskResult={png:Uint8Array;tone?:Float32Array;screened?:Float32Array};
export type FieldResult={pixels:Uint8ClampedArray;tones:Float32Array[];screens:Float32Array[]};
export function runMaskJob(j:MaskJob):MaskResult{
 const {w,h,dpr,press:p}=j;let flat:Float32Array=new Float32Array(w*h).fill(j.ground?j.groundOpacity:1),tone:Float32Array|undefined;
 if(j.route){
  const cover=routeCoverage(w/dpr,h/dpr,dpr,j.route.paths,j.route.radius,j.route.stations);
  for(let i=0;i<flat.length;i++)flat[i]=cover[i]*j.groundOpacity;
 }
 if(j.ground){
  const rim=j.route?0:Math.max(1,Math.round(p.edge*dpr));
  if(rim)for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x<rim||y<rim||x>=w-rim||y>=h-rim)flat[y*w+x]=0;
  // Worn plate edges (wear-v1) before screening. Metro lines are printed solid (no
  // screen) and wear harder, so their edges read as missing dots on a dense line.
  flat=wearEdges(flat,w,h,dpr,p.sheet?.seed??p.seed,j.origin,j.route?{depth:noiseBudget.wear.depth*.4,speckle:noiseBudget.wear.speckle*.8}:{depth:noiseBudget.wear.depth*.5,speckle:noiseBudget.wear.speckle*.6});
  // A solid line keeps its full ink demand; only the plane gets the light/tone field.
  tone=j.route?flat:makeToneField(flat,w,h,dpr,'plane',j.tone,p.seed);
  flat=screenOriginal(j.identity,{kind:'shape',mask:flat,tone},w,h,j.ink,p,dpr,j.origin,!!j.route);
 }else flat=screenOriginal(j.identity,{kind:'text',mask:flat,tone:flat},w,h,j.ink,p,dpr,j.origin,true,{size:j.fontSize,dotted:false,radius:j.radius});
 // Text already has its one bounded transfer stage; never apply image grain again.
 const data=j.ground?paintMaterial([{ink:j.ink,coverage:flat}],w,h,{a:[0,0,0],b:[0,0,0],paper:[255,255,255]},{...p,offset:{x:0,y:0}},dpr):null;
 const alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=data?255-data[i*4]:Math.round(255*flat[i]);
 return {png:encodeAlphaPNG(alpha,w,h),...(j.proof&&tone?{tone,screened:flat}:{})};
}
export function runFieldJob(j:FieldJob):FieldResult{
 const r=renderFieldOriginals(j.originals,j.w,j.h,j.dpr,j.origin,j.press,j.settings,j.inks);
 return {pixels:r.pixels,tones:r.tones,screens:r.screens};
}
