import {rgb,type Operation} from './element-composition';
import {preparePortraitOriginals,paintPortraitOriginals,type Press} from './print-pipeline/index';
export interface CompositionGeometry {
 sheet:{width:number;height:number};photo:{x:number;y:number;width:number;height:number};
 triangle:readonly (readonly number[])[];circle:{x:number;y:number;radius:number};
 print:{angle:number;seed:number};
}
export interface CompositionChoice {op:Operation;shape:string;pitch:number;mis:number;}
export interface CompositionPalette {a:string;b:string;paper:string;}
export function canvasLayers(image:CanvasImageSource,recipe:CompositionGeometry,state:CompositionChoice,width:number,press:{settings:Press;scale:number;origin:{x:number;y:number}}){
 const r=width/recipe.sheet.width,height=Math.round(recipe.sheet.height*r),surface=document.createElement('canvas');
 surface.width=width;surface.height=height;
 const g=surface.getContext('2d',{willReadFrequently:true})!;
 g.setTransform(r,0,0,r,0,0);g.fillStyle='#000';g.beginPath();
 if(state.shape==='circle')g.arc(recipe.circle.x,recipe.circle.y,recipe.circle.radius,0,Math.PI*2);
 else{recipe.triangle.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}
 g.fill();const shape=g.getImageData(0,0,width,height).data;
 g.clearRect(0,0,recipe.sheet.width,recipe.sheet.height);
 g.drawImage(image,recipe.photo.x,recipe.photo.y,recipe.photo.width,recipe.photo.height);
 const photo=g.getImageData(0,0,width,height).data;
 return {...preparePortraitOriginals({shape,photo,width,height,geometryScale:r,kind:state.shape==='circle'?'sphere':'plane',operation:state.op,press:press.settings,scale:press.scale,origin:press.origin}),r};
}
export function paintComposition(layers:ReturnType<typeof canvasLayers>,_recipe:CompositionGeometry,_choice:CompositionChoice,palette:CompositionPalette){
 return paintPortraitOriginals(layers,{a:rgb(palette.a),b:rgb(palette.b),paper:rgb(palette.paper)});
}
