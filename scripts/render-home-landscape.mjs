import sharp from 'sharp';
import {homeLandscape as L} from '../src/config/home-landscape.ts';
import {resolve,getPalette} from '../src/design/settings.ts';
import {rgb} from '../src/design/element-composition.ts';
import {screenOriginal,paintMaterial,pressSettings,elementPress,onSheet} from '../src/design/print-pipeline/index.ts';

/** Separation (source adapter only; screening, transfer and inks are the shared
 * pipeline's): forest and dark rock to the blue plate, lit rock to vermilion midtones,
 * cloud to paper, blue sky to a light blue screen fading to paper towards the top. The
 * person stands in front: the mountain is knocked out under him, his darks print blue
 * and his midtones vermilion. */
const sm=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
function boxBlur(a,W,H,r){const t=new Float32Array(W*H),o=new Float32Array(W*H);
 for(let y=0;y<H;y++){let acc=0;for(let x=-r;x<W;x++){if(x+r<W)acc+=a[y*W+x+r];if(x-r-1>=0)acc-=a[y*W+x-r-1];if(x>=0)t[y*W+x]=acc/(2*r+1);}}
 for(let x=0;x<W;x++){let acc=0;for(let y=-r;y<H;y++){if(y+r<H)acc+=t[(y+r)*W+x];if(y-r-1>=0)acc-=t[(y-r-1)*W+x];if(y>=0)o[y*W+x]=acc/(2*r+1);}}return o;}
export async function renderHomeLandscape(config){
 const s=resolve(config,'home').values,p=getPalette(config,s.palette),seed=resolve(config).values.seed,k=L.scale;
 const W=L.width*k,H=L.height*k,BH=L.band.height*k,top=H-BH,n=W*H;
 const band=await sharp(new URL('../'+L.mountain,import.meta.url).pathname).extract(L.band.source).resize(W,BH,{fit:'cover'}).ensureAlpha().raw().toBuffer();
 const lum=new Float32Array(W*BH);for(let i=0;i<W*BH;i++)lum[i]=(.299*band[i*4]+.587*band[i*4+1]+.114*band[i*4+2])/255;
 const m1=boxBlur(lum,W,BH,4),m2=boxBlur(lum.map(v=>v*v),W,BH,4),tex=boxBlur(m1.map((m,i)=>Math.sqrt(Math.max(0,m2[i]-m*m))),W,BH,6);
 const ta=new Float32Array(n),tb=new Float32Array(n);
 for(let y=0;y<BH;y++)for(let x=0;x<W;x++){const j=y*W+x,i=(y+top)*W+x,r=band[j*4]/255,g=band[j*4+1]/255,b=band[j*4+2]/255,l=lum[j];
  const sky=sm(.06,.2,b-r)*sm(.3,.55,l),forest=sm(.4,.22,l)*sm(-.03,.05,g-b)*(1-sky),rock=sm(.025,.06,tex[j])*(1-sky)*(1-forest);
  const fade=sm(BH*.02,BH*.55,y)**1.4,rockFade=sm(BH*.08,BH*.3,y);
  tb[i]=forest*.88+sky*.24*fade+rock*rockFade*sm(.55,.3,l)*.3;
  ta[i]=rock*rockFade*sm(.97,.45,l)*.58;
 }
 // Person, bottom-aligned, in front of the mountain.
 const ph=Math.round(H*L.placement.height),meta=await sharp(new URL('../'+L.personSource,import.meta.url).pathname).metadata(),pw=Math.round(ph*meta.width/meta.height);
 const px=Math.round(W*L.placement.x-pw/2),py=H-ph;
 const person=await sharp(new URL('../'+L.personSource,import.meta.url).pathname).resize(pw,ph,{kernel:'lanczos3'}).ensureAlpha().raw().toBuffer();
 for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const X=px+x,Y=py+y;if(X<0||X>=W||Y<0||Y>=H)continue;const j=y*pw+x,a=person[j*4+3]/255;if(a<.02)continue;
  const l=(.299*person[j*4]+.587*person[j*4+1]+.114*person[j*4+2])/255,i=Y*W+X;
  const dark=sm(.62,.12,l)*.92,mid=sm(.96,.5,l)*.5*(1-dark*.8);
  tb[i]=tb[i]*(1-a)+dark*a;ta[i]=ta[i]*(1-a)+mid*a;}
 const mask=new Float32Array(n).fill(1);
 const press=onSheet(elementPress(pressSettings(s,L.screen,L.displaySize),'home-landscape','image'),seed,L.origin,1440);
 const a=screenOriginal('home-landscape-a',{kind:'photo',mask,tone:ta},W,H,'a',press,k,L.origin);
 const b=screenOriginal('home-landscape-b',{kind:'photo',mask,tone:tb},W,H,'b',press,k,L.origin);
 const rgba=paintMaterial([{ink:'a',coverage:a},{ink:'b',coverage:b}],W,H,{a:rgb(p.secondary),b:rgb(p.primary),paper:[255,255,255]},press,k);
 await sharp(Buffer.from(rgba),{raw:{width:W,height:H,channels:4}}).removeAlpha().png({compressionLevel:9,palette:true,colors:64,dither:0}).toFile(new URL('../public'+L.output,import.meta.url).pathname);
 console.log(`Rendered home landscape ${L.output} (${W}×${H}, ${press.pitch}px ${L.screen} screen)`);
}
