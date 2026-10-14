import {researchGeometry} from './research-geometry.ts';
import {researchPlates,type PlateId} from './research-plates.ts';
import {directions,type DirectionId} from '../data/research-map.ts';
import {rng} from './vendor/print-lab-core.js';
import {getPalette,type Settings,type DesignConfig} from './settings.ts';
export type ResearchState='normal'|'active'|'quiet';
export type Point={x:number;y:number};
export type Dot={x:number;y:number;tone:number;radius:number;points:Point[]};
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(t:number)=>{const v=clamp(t);return v*v*(3-2*v);};
export function researchSeed(s:Settings,date=new Date()){
 return s.researchSeed||Number(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(date).replaceAll('-',''));
}
function salt(seed:number,key:string){for(const c of key)seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
/** Continuous seeded value noise; four octaves form an fBm field in CSS pixels.
 * Lattice randomness uses Print Lab's original mulberry32 PRNG. */
function valueNoise(seed:number,cell:number){
 const cache=new Map<string,number>();
 const value=(x:number,y:number)=>{const key=`${x}:${y}`;let v=cache.get(key);if(v===undefined){v=rng(salt(seed,key))();cache.set(key,v);}return v;};
 return (x:number,y:number)=>{x/=cell;y/=cell;const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy),a=value(ix,iy),b=value(ix+1,iy),c=value(ix,iy+1),d=value(ix+1,iy+1);return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;};
}
function fbm(seed:number,cell:number){const fields=Array.from({length:4},(_,i)=>valueNoise(salt(seed,String(i)),cell/2**i));return(x:number,y:number)=>fields.reduce((n,f,i)=>n+f(x,y)*2**-i,0)/1.875;}
export function shapeEnvelope(distance:number,radius:number){return 1-smooth((distance/radius-.85)/.15);}
export function dotRadius(tone:number,pitch:number,gain:number,variation=1){return tone>.88?pitch*.76*variation:pitch/2*Math.sqrt(tone)*gain*variation;}
export function researchRecipe(s:Settings,config:DesignConfig,width=640,seed=researchSeed(s)){
 const geometry=researchGeometry(s.researchRatio,s.researchStagger),scale=width/geometry.width,height=width*geometry.height/geometry.width;
 const plates=researchPlates(s,config),fiber=valueNoise(salt(seed,'shared-fiber'),1.4),paper=valueNoise(salt(seed,'paper'),1);
 const recipe={width,height,geometry,scale,seed,plates,paper:getPalette(config,s.palette).paper};
 const stateDots=(id:DirectionId,state:ResearchState):Dot[]=>{
  const direction=directions.find(d=>d.id===id)!,plate=plates[direction.plate],plateSeed=salt(seed,direction.plate),random=rng(plateSeed);
  const ink=fbm(salt(plateSeed,'ink'),250),feed=fbm(salt(plateSeed,'feed'),100);
  const c=geometry.circles[id],cx=c.x*scale,cy=c.y*scale,r=geometry.r*scale;
  const pitch=state==='quiet'?4:Math.round(s.researchPitch),density=state==='active'?1.3:state==='quiet'?.35:1;
  const angle=plate.angle*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle),extent=Math.ceil(Math.hypot(width,height)/pitch)+2,dots:Dot[]=[];
  for(let row=-extent;row<=extent;row++)for(let col=-extent;col<=extent;col++){
   const x=col*pitch*cos-row*pitch*sin+(random()-.5)*pitch*.2,y=col*pitch*sin+row*pitch*cos+(random()-.5)*pitch*.2;
   if(x<0||y<0||x>width||y>height)continue;
   const shape=shapeEnvelope(Math.hypot(x-cx,y-cy),r);if(!shape)continue;
   const focus=.15+.5*clamp(1-Math.hypot(x-geometry.center.x*scale,y-geometry.center.y*scale)/(r*1.65));
   const inkNoise=1+(ink(x,y)*2-1)*s.researchInkNoise;
   const feedLoss=1-feed(0,y)*s.researchFeedNoise;
   const fiberLoss=1-fiber(x,y*.35)*s.researchFiberNoise;
   const tone=clamp(shape*focus*inkNoise*feedLoss*fiberLoss*density*s.researchCoverage/.45);
   if(tone<s.researchDropout)continue;
   const dotRandom=rng(salt(plateSeed,`${row}:${col}`)),variation=.9+dotRandom()*.2,vertexNoise=Array.from({length:12},()=>.92+dotRandom()*.16);
   const radius=dotRadius(tone,pitch,s.researchDotGain,variation);
   const points=vertexNoise.map((n,i)=>({x:x+Math.cos(i*Math.PI/6)*radius*n,y:y+Math.sin(i*Math.PI/6)*radius*n}));
   dots.push({x,y,tone,radius,points});
  }
  return dots;
 };
 const transforms=Object.fromEntries(Object.entries(plates).map(([id,p])=>{const random=rng(salt(seed,`registration:${id}`)),j=()=>random()*2-1;return[id,id==='blue'?{x:0,y:0,rotation:0,scale:1}:{x:p.x+j()*.1,y:p.y+j()*.1,rotation:p.rotation+j()*.02,scale:p.scale+j()*.0002}];})) as Record<PlateId,{x:number;y:number;rotation:number;scale:number}>;
 return {...recipe,stateDots,transforms,paperNoise:(x:number,y:number)=>.98+paper(x,y)*.04};
}
export type ResearchRecipe=ReturnType<typeof researchRecipe>;
export function paperPixels(recipe:ResearchRecipe,dpr=1){
 const width=Math.round(recipe.width*dpr),height=Math.round(recipe.height*dpr),rgba=new Uint8ClampedArray(width*height*4),rgb=[1,3,5].map(i=>parseInt(recipe.paper.slice(i,i+2),16));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,n=recipe.paperNoise((x+.5)/dpr,(y+.5)/dpr);for(let k=0;k<3;k++)rgba[i+k]=Math.min(255,rgb[k]*n);rgba[i+3]=255;}
 return {rgba,width,height};
}
/** Only for the build-time PNG fallback; the live ink layer uses canvas. */
export function plateVector(recipe:ResearchRecipe,id:DirectionId){
 const plate=directions.find(d=>d.id===id)!.plate,p=recipe.plates[plate],t=recipe.transforms[plate],cx=recipe.width/2,cy=recipe.height/2;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${recipe.width}" height="${recipe.height}"><g fill="${p.color}" opacity=".9" transform="translate(${cx+t.x} ${cy+t.y}) rotate(${t.rotation}) scale(${t.scale}) translate(${-cx} ${-cy})">${recipe.stateDots(id,'normal').map(d=>`<polygon points="${d.points.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')}"/>`).join('')}</g></svg>`;
}
