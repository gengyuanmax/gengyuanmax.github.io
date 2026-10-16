import type {RuleTransfer} from './rule.ts';
import type {PolygonScreen} from './polygon.ts';
import type {Dot} from './types.ts';
import {sheetFields,sheetInk,sheetRoller,type Sheet} from './sheet-context.ts';
import {noiseBudget,within} from './budget.ts';
import {valueNoise,salt,rng,fbm,lowNoise} from './noise.ts';
import type {Press} from './material.ts';
import type {TextRecipe} from './text.ts';
/** Shared transfer policy. No element recipe may opt back into ink expansion.
 * Density curves and the chosen screen geometry are not physical ink spreading.
 * Re-enabling expansion requires a deliberate global policy change and new review. */
export const transferPolicy=Object.freeze({version:'transfer-no-spread-v1',spread:false});
/** Rectangular counterpart of native spread; binary expansion, no convolution. */
export function spreadRectangle(mask:Float32Array,w:number,h:number,r:number,field:(x:number,y:number)=>number,amount:number){
 const horizontal=new Uint8Array(w*h),vertical=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=-r;k<=r;k++){if(x+k>=0&&x+k<w&&mask[y*w+x+k]){horizontal[y*w+x]=1;break;}}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let k=-r;k<=r;k++){if(y+k>=0&&y+k<h&&horizontal[(y+k)*w+x]){vertical[y*w+x]=1;break;}}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!mask[y*w+x]&&vertical[y*w+x]&&field(x,y)<amount)mask[y*w+x]=1;
}

/** Physical spreading is disabled for vector paths as well as raster masks.
 * Negative offsets are ink loss; positive offsets would add ink outside the plate. */
export function transferEdgeOffset(outward:number){return Math.min(0,outward);}
export function transferDotRadius(radius:number,_gain:number){return radius;}

/** Prepare ink-transfer strength in sheet coordinates. No plate geometry, color or blending.
 * Keep the Float32 low-frequency grid and arithmetic order for pixel-identical output. */
export function prepareSheetTransfer<Id extends string>(w:number,h:number,p:Press<Id>,scale:number){
 const {seed,origin}=p.sheet!,f=sheetFields(seed),budget=noiseBudget.transfer;
 const fraction=within(p.holes,budget.grainArea),grainLoss=within(p.grain,budget.grainLoss),starve=within(p.starve,budget.starvation),roller=within((p.band||0)*.5,budget.roller);
 // Low-frequency transfer (starvation and roller, features ≥32 CSS px). The exact path
 // samples it per pixel; the fast path samples a 2 CSS px grid and interpolates.
 const G=p.fast?Math.max(1,Math.round(2*scale)):1,gw=Math.ceil(w/G)+2,gh=Math.ceil(h/G)+2,slow=new Float32Array(gw*gh);
 for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const xx=gx*G/scale+origin.x,yy=gy*G/scale+origin.y,m=Math.max(0,Math.min(1,(sheetInk(seed,xx,yy)-.42)/.38));slow[gy*gw+gx]=(1-starve*m*m)*(1-roller*sheetRoller(p.sheet!,yy));}
 return (x:number,y:number)=>{
  const fy=y/G,iy=Math.floor(fy),ty=fy-iy;
   const xx=x/scale+origin.x,yy=y/scale+origin.y;
   let lowStrength:number;
   if(G===1)lowStrength=slow[y*gw+x];
   else{const fx=x/G,ix=Math.floor(fx),tx=fx-ix,a=slow[iy*gw+ix],b=slow[iy*gw+ix+1],c2=slow[(iy+1)*gw+ix],d=slow[(iy+1)*gw+ix+1];lowStrength=(a+(b-a)*tx)*(1-ty)+(c2+(d-c2)*tx)*ty;}
   // Absolute threshold, not a per-element histogram: cropping cannot change ink.
   const grain=fraction?Math.max(0,(fraction-f.fine(xx,yy))/fraction):0;
   return .96*(1-grainLoss*grain)*lowStrength;
 };
}



function transferText(coverage:Float32Array,w:number,h:number,scale:number,seed:number,recipe:TextRecipe,sheet?:Sheet){
 const tier=recipe.size>=72?'display':recipe.size>=24?'heading':'body',out=coverage;
 if(recipe.dotted&&tier==='display')return out;
  // print-type-v4 (user, 2026-10-14): type is printed by the same press as the images, so
  // it carries the same transfer: low-frequency starvation, fine grain loss and roller
  // marks on the sheet. Outlines stay the DOM's own; no holes, erosion or blur.
  if(recipe.transfer&&sheet&&tier!=='body'){
   const t=recipe.transfer,b=noiseBudget.transfer,f=sheetFields(sheet.seed),cap=tier==='display'?noiseBudget.text.display:noiseBudget.text.heading;
   const fraction=Math.min(b.grainArea,Math.max(0,t.holes)),grain=Math.min(b.grainLoss,Math.max(0,t.grain)),starve=Math.min(b.starvation,Math.max(0,t.starve)),roller=Math.min(b.roller,Math.max(0,(t.band||0)*.5));
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const xx=x/scale+sheet.origin.x,yy=y/scale+sheet.origin.y,m=Math.max(0,Math.min(1,(sheetInk(sheet.seed,xx,yy)-.42)/.38)),fine=f.fine(xx,yy),g=fraction?Math.max(0,(fraction-fine)/fraction):0;
    out[y*w+x]=Math.max(1-cap,(1-grain*g)*(1-starve*m*m)*(1-roller*sheetRoller(sheet,yy)));}
   return out;
  }
  // sharp-type-v3 fallback without a press transfer (static/legacy callers): unchanged values.
  const loss=tier==='display'?.05:tier==='heading'?.04:0,noise=valueNoise(salt(seed,'type-ink'),32);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)out[y*w+x]=1-loss*(sheet?((1-(sheet.band||0))*sheetInk(sheet.seed,x/scale+sheet.origin.x,y/scale+sheet.origin.y)+(sheet.band||0)*sheetRoller(sheet,y/scale+sheet.origin.y)):noise(x/scale,y/scale));
  return out; // DOM alone supplies the sharp outline of solid letters.
}

const clampTransfer=(x:number)=>Math.max(0,Math.min(1,x));

export type PolygonMasterPoint={x:number;y:number;row:number;col:number;shape:number;focus:number};
function transferPolygons(master:PolygonMasterPoint[],seed:number,plateId:string,p:PolygonScreen):Dot[]{
 const plateSeed=salt(seed,plateId),fiber=valueNoise(salt(seed,'shared-fiber'),1.4),budget=noiseBudget.research;
 const inkAmount=within(p.inkNoise,budget.ink),feedAmount=within(p.feedNoise,budget.feed),fiberAmount=within(p.fiberNoise,budget.fiber),gain=Math.max(1,Math.min(budget.dotGain,p.dotGain)),dropout=within(p.dropout,budget.dropout);
 const ink=fbm(salt(plateSeed,'ink'),250),feed=fbm(salt(plateSeed,'feed'),100),pitch=p.pitch,density=p.density,dots:Dot[]=[];
 for(const {x,y,row,col,shape,focus} of master){
   const sx=x+(p.sheet?.origin.x||0),sy=y+(p.sheet?.origin.y||0),shared=p.sheet?sheetFields(p.sheet.seed):null;
   const inkNoise=1+((p.sheet?sheetInk(p.sheet.seed,sx,sy):ink(x,y))*2-1)*inkAmount;
   const feedLoss=1-(p.sheet?sheetRoller(p.sheet,sy):feed(0,y))*feedAmount;
   const fiberLoss=1-(shared?shared.fine(sx,sy):fiber(x,y*.35))*fiberAmount;
   const tone=clampTransfer(shape*focus*inkNoise*feedLoss*fiberLoss*density*p.coverage/.45);
   if(tone<dropout)continue;
   const dotRandom=rng(salt(plateSeed,`${row}:${col}`)),variation=.9+dotRandom()*.2,vertexNoise=Array.from({length:12},()=>.92+dotRandom()*.16);
   const radius=transferDotRadius(pitch/2*Math.sqrt(tone)*Math.min(1,variation),gain);
   const points=vertexNoise.map((n,i)=>({x:x+Math.cos(i*Math.PI/6)*radius*(1+transferEdgeOffset(n-1)),y:y+Math.sin(i*Math.PI/6)*radius*(1+transferEdgeOffset(n-1))}));
   dots.push({x,y,tone,radius,points});
 }return dots;
}

export type PolygonTransferJob={kind:'polygon';master:PolygonMasterPoint[];seed:number;plateId:string;recipe:PolygonScreen};

export const lineFinishes={
 original:{edgeGain:1,widthVariation:.25,dryGain:1},
 rubbed:{edgeGain:2.4,widthVariation:.65,dryGain:2.4},
} as const;
export type LineFinish=keyof typeof lineFinishes;

export type LineMaster={period:number;tile:number;rows:number;knurl:boolean;wave:number[]};
function transferLines(master:LineMaster,coverage:number,seed:number,grain:number,starvation:number,finish:LineFinish){
 const {period,tile,rows,knurl,wave}=master,treatment=lineFinishes[finish];
 const random=rng(salt(seed,'navigation-line-v2')),pressure=valueNoise(salt(seed,'navigation-pressure'),12);
 const rough=(.15+Math.min(.2,grain)*2)*treatment.edgeGain,half=period*coverage/(knurl?3.2:2),paths:string[]=[];
 const fmt=(v:number)=>v.toFixed(2);
 for(let row=0;row<rows;row++){
  const top:string[]=[],bottom:string[]=[];
  const flush=()=>{if(top.length>1)paths.push(`M${top.join('L')}L${bottom.reverse().join('L')}Z`);top.length=0;bottom.length=0;};
  let dry=0;
  for(let x=0;x<=tile;x++){
   if(!dry&&x>2&&x<tile-3&&random()<Math.min(.04,starvation*.12*treatment.dryGain))dry=1+Math.floor(random()*3);
   if(dry){flush();dry--;continue;}
   // Periodic low-frequency field keeps the repeated tile join continuous.
   const taper=Math.sin(Math.PI*x/tile);
   const field=(y:number)=>pressure(x,y)*(1-x/tile)+pressure(x-tile,y)*(x/tile);
   const bend=(field(row*19)-.5)*1.2;
   const requestedWidth=finish==='original'?half*(.75+field(row*19+9)*.5):half*(1+(field(row*19+9)*2-1)*treatment.widthVariation);
   const width=half+transferEdgeOffset(requestedWidth-half);
   const center=row*period+period/2+bend+wave[x];
   const upper=(random()-.5)*rough*2*taper,lower=(random()-.5)*rough*2*taper;
   // Keep a narrow ink bridge at irregular edges; deliberate dry breaks above
   // are the only full interruptions. No outer silhouette or blurred edge.
   top.push(`${x},${fmt(center-width+-transferEdgeOffset(-(finish==='original'?upper:Math.min(width*.85,upper))))}`);
   bottom.push(`${x},${fmt(center+width+transferEdgeOffset(finish==='original'?lower:Math.max(-width*.85,lower)))}`);
  }
  flush();
 }
 return paths;
}

export type LineTransferJob={kind:'line';master:LineMaster;coverage:number;seed:number;grain:number;starvation:number;finish:LineFinish};
function transferRule(width:number,height:number,scale:number,sheet:Sheet,transfer:RuleTransfer,pad=1):{alpha:Float32Array;width:number;height:number;pad:number}{
 const vertical=height>=width,W=Math.round((width+(vertical?pad*2:0))*scale),H=Math.round((height+(vertical?0:pad*2))*scale),out=new Float32Array(W*H);
 const b=noiseBudget.transfer,e=noiseBudget.rule.edge,f=sheetFields(sheet.seed);
 const sideA=valueNoise(salt(sheet.seed,'rule-edge-a'),noiseBudget.rule.wave),sideB=valueNoise(salt(sheet.seed,'rule-edge-b'),noiseBudget.rule.wave);
 const fraction=within(transfer.holes,b.grainArea),grain=within(transfer.grain,b.grainLoss),starve=within(transfer.starve,b.starvation),roller=within((transfer.band||0)*.5,b.roller);
 const thick=vertical?width:height,alongN=vertical?H:W,acrossN=vertical?W:H,half=.5/scale;
 // Everything but the 1px grain varies slowly along the line: evaluate it once per
 // device pixel along the line at the line's centre, not for every pixel across it.
 for(let a=0;a<alongN;a++){
  const along=(a+.5)/scale+(vertical?sheet.origin.y:sheet.origin.x),centre=(vertical?sheet.origin.x:sheet.origin.y)+thick/2;
  const cx=vertical?centre:along,cy=vertical?along:centre,fixed=vertical?sheet.origin.x:sheet.origin.y;
  const lo=-transferEdgeOffset(-(sideA(along,fixed)-.5)*e),hi=thick+transferEdgeOffset((sideB(along,fixed)-.5)*e);
  const m=Math.max(0,Math.min(1,(sheetInk(sheet.seed,cx,cy)-.42)/.38)),strength=(1-starve*m*m)*(1-roller*sheetRoller(sheet,cy));
  for(let c=0;c<acrossN;c++){
   const across=(c+.5)/scale-pad,cover=Math.max(0,Math.min(1,(Math.min(across+half,hi)-Math.max(across-half,lo))/(2*half)));
   if(!cover)continue;
   const px=vertical?fixed+across:along,py=vertical?along:fixed+across,fine=f.fine(px,py),g=fraction?Math.max(0,(fraction-fine)/fraction):0;
   out[vertical?a*W+c:c*W+a]=cover*(1-grain*g)*strength;
  }
 }
 return {alpha:out,width:W,height:H,pad};
}

export type RuleTransferJob={kind:'rule';width:number;height:number;scale:number;sheet:Sheet;recipe:RuleTransfer;pad:number};
const cache=new Map<string,{n:number;fine:Float32Array;low:Float32Array;edge:Float32Array}>();
export function materialFields(width:number,height:number,scale:number,p:Press<string>){
 const n=Math.max(width,height),diameter=Math.min(2,p.cluster,p.pitch*scale*.3),patch=p.patch||160;
 const key=JSON.stringify([n,scale,diameter,patch,p.seed]);
 const hit=cache.get(key);if(hit)return hit;
 // Native lowNoise smoothstep interpolation, generated at device resolution.
 // Fine grain is <= 2 device pixels AND <= .3 screen cells, never enlarged.
 const random=rng(p.seed),fine=lowNoise(n,Math.max(1,Math.ceil(n/Math.max(.5,diameter))),random);
 const lo=lowNoise(n,Math.max(1,Math.ceil(n/(patch*.5*scale))),random),hi=lowNoise(n,Math.max(1,Math.ceil(n/(patch*.2*scale))),random);
 const low=lo.map((v:number,i:number)=>v*.65+hi[i]*.35);
 const edge=lowNoise(n,Math.max(1,Math.round(n/(1.5*scale))),random);
 const result={n,fine,low,edge};if(cache.size>4)cache.clear();cache.set(key,result);return result;
}

function prepareLegacyTransfer<Id extends string>(width:number,height:number,p:Press<Id>,scale:number){
 const f=materialFields(width,height,scale,p);

 // This is an affected-area fraction, NOT a knockout fraction. At most 4% of
 // fine samples lose a small amount of ink. No sample is punched to zero.
 const fraction=Math.min(.04,Math.max(0,p.holes)),histogram=new Uint32Array(1024);
 for(const v of f.fine)histogram[Math.min(1023,Math.floor(v*1024))]++;
 let count=0,threshold=0;for(;threshold<1024;threshold++){count+=histogram[threshold];if(count>=f.fine.length*fraction)break;}
 const cut=threshold/1024;
 return (x:number,y:number,ink:Id)=>{
 const fi=y*f.n+x;
   const j=ink==='a'?fi:ink==='b'?f.n*f.n-1-fi:(fi+salt(p.seed,ink))%(f.n*f.n),l=f.low[j],m=l<.42?0:l>.8?1:(l-.42)/.38;
   // Print Lab ink multiplication, with explicit limits on each loss process.
   // Starvation only thins ink; fine grain is a tiny, smooth concentration dip.
   const grain=fraction&&cut?Math.max(0,(cut-f.fine[j])/cut):0;
   const grainLoss=Math.min(p.role==='title'?.08:.2,Math.max(0,p.grain))*grain;
   const starvationLoss=Math.min(p.role==='title'?.08:.25,Math.max(0,p.starve))*m*m;
   const strength=.96*(1-grainLoss)*(1-starvationLoss);
 return strength;
 };
}

export type LegacyTransferJob={kind:'legacy-raster';w:number;h:number;scale:number;press:Press<string>};
const tile=16,period=24;
/** Periodic value noise over dot indices (wraps every `period` dots), so the mask tile
 * repeats without a seam. Seeded with the page seed through the shared PRNG. */
function periodicNoise(seed:number,grid:number){
 const n=period/grid,lattice=Array.from({length:n*n},(_,i)=>rng(salt(seed,`name-dots:${grid}:${i}`))());
 const at=(i:number,j:number)=>lattice[((j%n)+n)%n*n+((i%n)+n)%n];
 return (i:number,j:number)=>{const x=i/grid,y=j/grid,ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,su=u*u*(3-2*u),sv=v*v*(3-2*v);
  return (at(ix,iy)*(1-su)+at(ix+1,iy)*su)*(1-sv)+(at(ix,iy+1)*(1-su)+at(ix+1,iy+1)*su)*sv;};
}
/** The display name's blue plate dots in tile units (one dot per `tile`), period × period.
 * A Riso master is never perfectly even: dot size follows a low-frequency ink field
 * (features of 3–6 dots) plus a small per-dot term, and each dot sits slightly off its
 * lattice point. Both stay inside noiseBudget.text.dots, so the screen reads as print,
 * not as glitch: no dot is removed, merged or broken. */
function transferNameDots(master:{i:number;j:number}[],radius:number,seed=0){
 const b=noiseBudget.text.dots,base=tile*Math.min(.38,radius),low=periodicNoise(seed,6),mid=periodicNoise(salt(seed,'mid'),3),out:{x:number;y:number;r:number}[]=[];
 for(const {i,j} of master){
  const r=rng(salt(seed,`name-dot:${i}:${j}`)),field=(low(i,j)*.7+mid(i,j)*.3)*2-1,own=r()*2-1;
  const scale=1+Math.max(-b.radius,Math.min(b.radius,field*b.radius*.75+own*b.radius*.25));
  out.push({x:(i+.5)*tile+(r()*2-1)*b.shift*tile,y:(j+.5)*tile+(r()*2-1)*b.shift*tile,r:Math.min(tile*.48,base*(1+transferEdgeOffset(scale-1)))});
 }
 return out;
}

export type NameTransferJob={kind:'name-dots';master:{i:number;j:number}[];radius:number;seed:number};
export type InsertTransferJob={kind:'insert';source:string};
export type TextTransferJob={kind:'text';coverage:Float32Array;w:number;h:number;scale:number;seed:number;recipe:TextRecipe;sheet?:Sheet};
export type RasterTransferJob={kind:'raster';w:number;h:number;scale:number;press:Press<string>};
export function transferPlate(job:InsertTransferJob):string;
export function transferPlate(job:NameTransferJob):{x:number;y:number;r:number}[];
export function transferPlate(job:LegacyTransferJob):(x:number,y:number,ink:string)=>number;
export function transferPlate(job:RuleTransferJob):{alpha:Float32Array;width:number;height:number;pad:number};
export function transferPlate(job:LineTransferJob):string[];
export function transferPlate(job:PolygonTransferJob):Dot[];
export function transferPlate(job:TextTransferJob):Float32Array;
export function transferPlate(job:RasterTransferJob):(x:number,y:number)=>number;
export function transferPlate(job:TextTransferJob|RasterTransferJob|PolygonTransferJob|LineTransferJob|RuleTransferJob|LegacyTransferJob|NameTransferJob|InsertTransferJob){
 switch(job.kind){
 case 'insert':return job.source; // Existing printed originals are not printed twice.
 case 'name-dots':return transferNameDots(job.master,job.radius,job.seed);
 case 'legacy-raster':return prepareLegacyTransfer(job.w,job.h,job.press,job.scale);
 case 'rule':return transferRule(job.width,job.height,job.scale,job.sheet,job.recipe,job.pad);
 case 'line':return transferLines(job.master,job.coverage,job.seed,job.grain,job.starvation,job.finish);
 case 'polygon':return transferPolygons(job.master,job.seed,job.plateId,job.recipe);
 case 'text':return transferText(job.coverage,job.w,job.h,job.scale,job.seed,job.recipe,job.sheet);
 case 'raster':return prepareSheetTransfer(job.w,job.h,job.press,job.scale);
 }
}
