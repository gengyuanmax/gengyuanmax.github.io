import {sheetFields,sheetInk,sheetRoller,type Sheet} from './sheet.ts';
import {rng,salt,fbm,valueNoise} from './noise.ts';
import type {Dot,ProceduralSource} from './types.ts';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export type PolygonScreen={sheet?:Sheet;angle:number;pitch:number;density:number;coverage:number;dropout:number;dotGain:number;inkNoise:number;feedNoise:number;fiberNoise:number};
export function dotRadius(tone:number,pitch:number,gain:number,variation=1){return tone>.88?pitch*.76*variation:pitch/2*Math.sqrt(tone)*gain*variation;}
export function screenPolygons(source:ProceduralSource,width:number,height:number,seed:number,plateId:string,p:PolygonScreen):Dot[]{
 const plateSeed=salt(seed,plateId),random=rng(plateSeed),fiber=valueNoise(salt(seed,'shared-fiber'),1.4);
 const ink=fbm(salt(plateSeed,'ink'),250),feed=fbm(salt(plateSeed,'feed'),100),pitch=p.pitch,density=p.density;
  const angle=p.angle*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle),extent=Math.ceil(Math.hypot(width,height)/pitch)+2,dots:Dot[]=[];
  for(let row=-extent;row<=extent;row++)for(let col=-extent;col<=extent;col++){
   const x=col*pitch*cos-row*pitch*sin+(random()-.5)*pitch*.2,y=col*pitch*sin+row*pitch*cos+(random()-.5)*pitch*.2;
   if(x<0||y<0||x>width||y>height)continue;
   const {shape,focus}=source.sample(x,y);if(!shape)continue;
   const sx=x+(p.sheet?.origin.x||0),sy=y+(p.sheet?.origin.y||0),shared=p.sheet?sheetFields(p.sheet.seed):null;
   const inkNoise=1+((p.sheet?sheetInk(p.sheet.seed,sx,sy):ink(x,y))*2-1)*p.inkNoise;
   const feedLoss=1-(p.sheet?sheetRoller(p.sheet,sy):feed(0,y))*p.feedNoise;
   const fiberLoss=1-(shared?shared.fine(sx,sy):fiber(x,y*.35))*p.fiberNoise;
   const tone=clamp(shape*focus*inkNoise*feedLoss*fiberLoss*density*p.coverage/.45);
   if(tone<p.dropout)continue;
   const dotRandom=rng(salt(plateSeed,`${row}:${col}`)),variation=.9+dotRandom()*.2,vertexNoise=Array.from({length:12},()=>.92+dotRandom()*.16);
   const radius=dotRadius(tone,pitch,p.dotGain,variation);
   const points=vertexNoise.map((n,i)=>({x:x+Math.cos(i*Math.PI/6)*radius*n,y:y+Math.sin(i*Math.PI/6)*radius*n}));
   dots.push({x,y,tone,radius,points});
  }
  return dots;
}
