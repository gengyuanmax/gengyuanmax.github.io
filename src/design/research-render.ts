import {sheetFields,type Sheet} from './print-pipeline/index.ts';
import {researchGeometry} from './research-geometry.ts';
import {researchPlates} from './research-plates.ts';
import {directions,type DirectionId} from '../data/research-map.ts';
import {paperField,registeredPlates} from './print-pipeline/index.ts';
import {definePrintElement,screenPrintElement,polygonVector} from './print-pipeline/index.ts';
export {dotRadius} from './print-pipeline/polygon.ts';
export type {Point,Dot} from './print-pipeline/types.ts';
import {getPalette,type Settings,type DesignConfig} from './settings.ts';
export type ResearchState='normal'|'active'|'quiet';
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(t:number)=>{const v=clamp(t);return v*v*(3-2*v);};
export function researchSeed(s:Settings,date=new Date()){
 return s.researchSeed||Number(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(date).replaceAll('-',''));
}
export function shapeEnvelope(distance:number,radius:number){return 1-smooth((distance/radius-.85)/.15);}
export function researchRecipe(s:Settings,config:DesignConfig,width=640,seed=researchSeed(s),sheet?:Sheet){
 const geometry=researchGeometry(s.researchRatio,s.researchStagger),scale=width/geometry.width,height=width*geometry.height/geometry.width;
 const plates=researchPlates(s,config),paperNoise=sheet?((x:number,y:number)=>.98+sheetFields(sheet.seed).fine(x+sheet.origin.x,y+sheet.origin.y)*.04):paperField(seed);
 const recipe={width,height,geometry,scale,seed,plates,paper:getPalette(config,s.palette).paper};
 const stateDots=(id:DirectionId,state:ResearchState)=>{
  const direction=directions.find(d=>d.id===id)!,plate=plates[direction.plate];
  const c=geometry.circles[id],cx=c.x*scale,cy=c.y*scale,r=geometry.r*scale;
  return screenPrintElement(definePrintElement({id:`research:${id}:${state}`,profile:'polygon-v1',width,height,seed,plate:direction.plate,
   source:{kind:'procedural',sample:(x:number,y:number)=>({shape:shapeEnvelope(Math.hypot(x-cx,y-cy),r),focus:.15+.5*clamp(1-Math.hypot(x-geometry.center.x*scale,y-geometry.center.y*scale)/(r*1.65))})},
   screen:{sheet,angle:plate.angle,pitch:state==='quiet'?4:Math.round(s.researchPitch),density:state==='active'?1.3:state==='quiet'?.35:1,
    coverage:s.researchCoverage,dropout:s.researchDropout,dotGain:s.researchDotGain,inkNoise:s.researchInkNoise,feedNoise:s.researchFeedNoise,fiberNoise:s.researchFiberNoise}
  }));
 };
 const transforms=registeredPlates(plates,seed,'blue');
 return {...recipe,stateDots,transforms,paperNoise};
}
export type ResearchRecipe=ReturnType<typeof researchRecipe>;
export {paperPixels} from './print-pipeline/paper.ts';
/** Only for the build-time PNG fallback; the live ink layer uses canvas. */
export function plateVector(recipe:ResearchRecipe,id:DirectionId){
 const plate=directions.find(d=>d.id===id)!.plate;
 return polygonVector(recipe.width,recipe.height,recipe.plates[plate].color,recipe.transforms[plate],recipe.stateDots(id,'normal'),.9);
}
