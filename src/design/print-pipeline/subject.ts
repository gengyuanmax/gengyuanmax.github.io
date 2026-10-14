import {salt,valueNoise} from './noise.ts';
/** `photo-subject-v1`: a single-ink separation that keeps a warm subject's silhouette.
 * Plain luminance puts a sunlit red-rock subject at the same density as the dark land
 * behind it, so one blue ink loses its outline. This recipe adds a warm-colour key
 * (how far red leads green and blue) to the luminance darkness, then restores local
 * detail, so the subject prints dense, the land mid-tone and the sky light. */
export type SubjectRecipe={key:number;dark:number;detail:number;detailRadius:number;lift:number;floor:number;ceiling:number;gamma:number};
export const subjectSeparation:SubjectRecipe={key:.95,dark:.28,detail:1,detailRadius:6,lift:-.05,floor:.03,ceiling:.95,gamma:1.25};
function blur(src:Float32Array,w:number,h:number,r:number){
 const tmp=new Float32Array(w*h),out=new Float32Array(w*h),n=2*r+1;
 for(let y=0;y<h;y++){let s=0;for(let k=-r;k<=r;k++)s+=src[y*w+Math.min(w-1,Math.max(0,k))];for(let x=0;x<w;x++){tmp[y*w+x]=s/n;s+=src[y*w+Math.min(w-1,x+r+1)]-src[y*w+Math.max(0,x-r)];}}
 for(let x=0;x<w;x++){let s=0;for(let k=-r;k<=r;k++)s+=tmp[Math.min(h-1,Math.max(0,k))*w+x];for(let y=0;y<h;y++){out[y*w+x]=s/n;s+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.max(0,y-r)*w+x];}}
 return out;
}
export function separateSubject(data:Uint8Array|Uint8ClampedArray,w:number,h:number,scale=1,recipe:SubjectRecipe=subjectSeparation){
 const n=w*h,dark=new Float32Array(n),key=new Float32Array(n),mask=new Float32Array(n);
 for(let i=0;i<n;i++){const r=data[i*4]/255,g=data[i*4+1]/255,b=data[i*4+2]/255;mask[i]=data[i*4+3]/255;
  dark[i]=1-(.299*r+.587*g+.114*b);key[i]=Math.max(0,Math.min(1,(r-Math.max(g,b))/Math.max(.08,r)*1.6));}
 const local=blur(dark,w,h,Math.max(1,Math.round(recipe.detailRadius*scale))),tone=new Float32Array(n);
 for(let i=0;i<n;i++){let t=recipe.key*key[i]+recipe.dark*dark[i]+recipe.detail*(dark[i]-local[i])+recipe.lift;
  t=Math.pow(Math.max(0,Math.min(1,t)),recipe.gamma);tone[i]=mask[i]*(recipe.floor+(recipe.ceiling-recipe.floor)*t);}
 return {mask,tone};
}
/** A hand-inked block: the image area ends in a ragged edge whose displacement follows
 * low-frequency noise (no straight crop line), and dots thin out over the last few px
 * as ink does at the end of a roller pass. Distances in CSS px; seeded, repeatable. */
export type FrameRecipe={inset:number;depth:number;wave:number;feather:number};
export const raggedFrameRecipe:FrameRecipe={inset:10,depth:7,wave:34,feather:10};
export function raggedFrame(w:number,h:number,scale:number,seed:number,f:FrameRecipe=raggedFrameRecipe){
 const edges=[0,1,2,3].map(k=>valueNoise(salt(seed,`ragged-frame:${k}`),f.wave)),fine=[0,1,2,3].map(k=>valueNoise(salt(seed,`ragged-fine:${k}`),f.wave/5));
 const cw=w/scale,ch=h/scale,out=new Float32Array(w*h);
 const inset=(k:number,t:number)=>f.inset+f.depth*(edges[k](t,k*97)*.8+fine[k](t,k*31)*.2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const cx=(x+.5)/scale,cy=(y+.5)/scale;
  const d=Math.min(cx-inset(0,cy),cw-cx-inset(1,cy),cy-inset(2,cx),ch-cy-inset(3,cx));
  out[y*w+x]=d<=0?0:d>=f.feather?1:Math.pow(d/f.feather,.7);}
 return out;
}
