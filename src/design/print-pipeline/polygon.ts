import {rng,salt} from './noise.ts';
import {transferPlate,type PolygonMasterPoint} from './transfer.ts';
import type {Sheet} from './sheet-context.ts';
import type {Dot,ProceduralSource} from './types.ts';
export type PolygonScreen={sheet?:Sheet;angle:number;pitch:number;density:number;coverage:number;dropout:number;dotGain:number;inkNoise:number;feedNoise:number;fiberNoise:number};
/** Legacy geometric utility; physical expansion is disabled by the transfer policy. */
export function dotRadius(tone:number,pitch:number,gain:number,variation=1){return tone>.88?pitch*.76*variation:pitch/2*Math.sqrt(tone)*gain*variation;}
/** Master contains original tone and screen sites only, no press noise or ink loss. */
export function screenPolygonMaster(source:ProceduralSource,width:number,height:number,seed:number,plateId:string,p:PolygonScreen):PolygonMasterPoint[]{
 const random=rng(salt(seed,plateId)),pitch=p.pitch,angle=p.angle*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle),extent=Math.ceil(Math.hypot(width,height)/pitch)+2,master:PolygonMasterPoint[]=[];
 for(let row=-extent;row<=extent;row++)for(let col=-extent;col<=extent;col++){
  const x=col*pitch*cos-row*pitch*sin+(random()-.5)*pitch*.2,y=col*pitch*sin+row*pitch*cos+(random()-.5)*pitch*.2;
  if(x<0||y<0||x>width||y>height)continue;
  const {shape,focus}=source.sample(x,y);if(!shape)continue;
  master.push({x,y,row,col,shape,focus});
 }return master;
}
export function screenPolygons(source:ProceduralSource,width:number,height:number,seed:number,plateId:string,p:PolygonScreen):Dot[]{
 return transferPlate({kind:'polygon',master:screenPolygonMaster(source,width,height,seed,plateId,p),seed,plateId,recipe:p});
}
