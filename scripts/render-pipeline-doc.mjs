// Renders the stage images for docs/pipeline.html with the real print pipeline.
// Not part of the site build: run `node --experimental-strip-types scripts/render-pipeline-doc.mjs`.
import fs from 'node:fs';
import sharp from 'sharp';
import {aboutPhoto as photo} from '../src/config/about-photo.ts';
import {resolve,getPalette,validateConfig} from '../src/design/settings.ts';
import {rgb} from '../src/design/element-composition.ts';
import {separateSubject,screenOriginal,paintMaterial,pressSettings,elementPress,onSheet,makeToneField,toneSettings,printRule,sheetFields} from '../src/design/print-pipeline/index.ts';
import {printText} from '../src/design/print-pipeline/text.ts';
import {sheetInk,sheetRoller} from '../src/design/print-pipeline/sheet.ts';
import {researchRecipe,plateVector} from '../src/design/research-render.ts';
import {researchPrintOrder} from '../src/design/research-plates.ts';
import {directions} from '../src/data/research-map.ts';

const out=new URL('../docs/pipeline/',import.meta.url).pathname;fs.mkdirSync(out,{recursive:true});
const config=JSON.parse(fs.readFileSync(new URL('../src/config/design.json',import.meta.url),'utf8'));validateConfig(config);
const g=resolve(config).values,pal=getPalette(config,g.palette),paper=rgb(pal.paper),blue=rgb(pal.primary),red=rgb(pal.secondary),seed=g.seed;
async function saveGrey(a,w,h,file,invert=true){await sharp(Buffer.from(Uint8Array.from(a,v=>Math.round(255*Math.max(0,Math.min(1,invert?1-v:v))))),{raw:{width:w,height:h,channels:1}}).png().toFile(out+file);}
async function saveRGBA(rgba,w,h,file){for(let i=0;i<rgba.length;i+=4)if(rgba[i+3]===0){rgba[i]=paper[0];rgba[i+1]=paper[1];rgba[i+2]=paper[2];rgba[i+3]=255;}await sharp(Buffer.from(rgba),{raw:{width:w,height:h,channels:4}}).png().toFile(out+file);}
const stretch=a=>{let lo=Infinity,hi=-Infinity;for(const v of a){if(v<lo)lo=v;if(v>hi)hi=v;}return a.map(v=>(v-lo)/Math.max(1e-6,hi-lo));};
async function zoom(file,crop,size,into){await sharp(out+file).extract(crop).resize(size,null,{kernel:'nearest'}).png().toFile(out+into);}

// A. Photograph (About arch): source → separation → knockout tone → screen → transfer → print.
{
 const W=480,H=Math.round(W*photo.crop.height/photo.crop.width),sc=1;
 const src=await sharp(new URL('../'+photo.source,import.meta.url).pathname).extract(photo.crop).resize(W,H).ensureAlpha().raw().toBuffer();
 await sharp(src,{raw:{width:W,height:H,channels:4}}).png().toFile(out+'a1-source.png');
 const sep=separateSubject(src,W,H,sc);await saveGrey(sep.tone,W,H,'a2-separation.png');
 const tone=sep.tone.map(t=>Math.max(0,Math.min(.97,1.02-1.1*t)));await saveGrey(tone,W,H,'a3-knockout.png');
 const p=onSheet(elementPress(pressSettings(resolve(config,'about').values,'coarse',photo.displaySize),'about-photo','image'),seed,photo.origin,1440);
 const mask=new Float32Array(W*H).fill(1),cov=screenOriginal('about-photo',{kind:'photo',mask,tone},W,H,'b',p,sc,photo.origin);await saveGrey(cov,W,H,'a4-screen.png');
 const loss=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const xx=x+photo.origin.x,yy=y+photo.origin.y,m=Math.max(0,Math.min(1,(sheetInk(seed,xx,yy)-.42)/.38));loss[y*W+x]=1-(1-.15*m*m)*(1-.05*sheetRoller(p.sheet,yy));}
 await saveGrey(stretch(loss),W,H,'a5-transfer.png');
 const rgba=paintMaterial([{ink:'b',coverage:cov}],W,H,{a:red,b:blue,paper},p,sc);await saveRGBA(rgba,W,H,'a6-print.png');
 await zoom('a6-print.png',{left:200,top:60,width:120,height:90},480,'a6-print-zoom.png');
}
// B. Ground (chapter band): flat demand → tone field → fine AM screen → transfer.
{
 const W=420,H=140,sc=2,w=W*sc,h=H*sc,origin={x:80,y:330};
 const s=resolve(config,'research','plate-benchmarking').values,p={...onSheet(elementPress(pressSettings(s,'fine'),'plate-benchmarking','field'),seed,origin,1440),fast:true};
 const flat=new Float32Array(w*h).fill(s.groundOpacity);await saveGrey(flat,w,h,'b1-flat.png');
 const tone=makeToneField(flat,w,h,sc,'plane',toneSettings(s),p.seed);await saveGrey(stretch(tone),w,h,'b2-tone.png');
 const cov=screenOriginal('plate-benchmarking',{kind:'shape',mask:flat,tone},w,h,'b',p,sc,origin);await saveGrey(cov,w,h,'b3-screen.png');
 const rgba=paintMaterial([{ink:'b',coverage:cov}],w,h,{a:red,b:blue,paper},{...p,offset:{x:0,y:0}},sc);await saveRGBA(rgba,w,h,'b4-print.png');
 for(const f of ['b2-tone','b3-screen','b4-print'])await zoom(f+'.png',{left:300,top:80,width:80,height:60},320,f+'-zoom.png');
}
// C. Type: real DOM glyphs stay sharp; the pipeline only prints an ink-transfer mask.
{
 const W=560,H=150,sc=1,origin={x:130,y:200};
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="6" y="118" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="120" letter-spacing="-6">Visual</text></svg>`;
 const glyph=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();const a=Float32Array.from({length:W*H},(_,i)=>glyph[i*4+3]/255);
 await saveGrey(a,W,H,'c1-glyph.png');
 const p=onSheet(elementPress(pressSettings(g,'coarse',120),'research-title','title',120),seed,origin,1440);
 const mask=printText(new Float32Array(W*H).fill(1),W,H,sc,p.seed,p.pitch,p.angles.b,{size:120,dotted:false,radius:.37,transfer:{grain:p.grain,starve:p.starve,holes:p.holes,band:p.band}},p.sheet);
 await saveGrey(stretch(mask),W,H,'c2-transfer.png',false);
 const rgba=new Uint8ClampedArray(W*H*4),reg={x:.75,y:.5};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let c=[...paper];
  const ta=a[i]*mask[i];for(let k=0;k<3;k++)c[k]*=1-ta*(1-red[k]/255);
  const bx=Math.round(x-reg.x),by=Math.round(y-reg.y),tb=bx>=0&&by>=0?a[by*W+bx]*mask[i]:0;for(let k=0;k<3;k++)c[k]*=1-tb*(1-blue[k]/255);
  rgba.set([c[0],c[1],c[2],255],i*4);}
 await saveRGBA(rgba,W,H,'c3-print.png');await zoom('c3-print.png',{left:0,top:20,width:140,height:100},420,'c3-print-zoom.png');
}
// D. Research circles: polygon-v1 dots per plate, overprinted in plate order.
{
 const recipe=researchRecipe(resolve(config,'home').values,config,480);
 const layers=[];for(const id of researchPrintOrder){const d=directions.find(x=>x.plate===id);const svg=plateVector(recipe,d.id);layers.push(svg);await sharp(Buffer.from(svg)).flatten({background:pal.paper}).png().toFile(out+`d-${id}.png`);}
 const base=await sharp({create:{width:recipe.width,height:Math.round(recipe.height),channels:3,background:pal.paper}}).png().toBuffer();
 await sharp(base).composite(layers.map(s=>({input:Buffer.from(s),blend:'multiply'}))).png().toFile(out+'d-composite.png');
}
// E. A printed rule (rule-v1): horizontal, 3 CSS px thick, enlarged ×6 with hard pixels.
{
 const r=printRule(90,3,4,{seed,origin:{x:113,y:400}},{grain:.08,starve:.08,holes:.04,band:.1});
 const rgba=new Uint8ClampedArray(r.width*r.height*4);for(let i=0;i<r.alpha.length;i++){const t=r.alpha[i];rgba.set([paper[0]*(1-t*(1-blue[0]/255)),paper[1]*(1-t*(1-blue[1]/255)),paper[2]*(1-t*(1-blue[2]/255)),255],i*4);}
 await sharp(Buffer.from(rgba),{raw:{width:r.width,height:r.height,channels:4}}).resize(r.width*3,r.height*3,{kernel:'nearest'}).png().toFile(out+'e-rule.png');
}
console.log('Rendered pipeline stage images to docs/pipeline/');
