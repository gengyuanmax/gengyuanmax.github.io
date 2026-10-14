import {darkness,screen,compose,paint,rgb,type Field,type Operation} from './element-composition';
import {screenPlate,paintMaterial,type Press} from './press-material';
import {makeToneField} from './tone-field';
export interface CompositionGeometry {
 sheet:{width:number;height:number};photo:{x:number;y:number;width:number;height:number};
 triangle:readonly (readonly number[])[];circle:{x:number;y:number;radius:number};
 print:{angle:number;seed:number};
}
export interface CompositionChoice {op:Operation;shape:string;pitch:number;mis:number;}
export interface CompositionPalette {a:string;b:string;paper:string;}
export function canvasLayers(image:CanvasImageSource,recipe:CompositionGeometry,state:CompositionChoice,width:number,press?:{settings:Press;scale:number;origin:{x:number;y:number}}){
 const r=width/recipe.sheet.width,height=Math.round(recipe.sheet.height*r),surface=document.createElement('canvas');
 surface.width=width;surface.height=height;
 const g=surface.getContext('2d',{willReadFrequently:true})!;
 g.setTransform(r,0,0,r,0,0);g.fillStyle='#000';g.beginPath();
 if(state.shape==='circle')g.arc(recipe.circle.x,recipe.circle.y,recipe.circle.radius,0,Math.PI*2);
 else{recipe.triangle.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}
 g.fill();const a=darkness(g.getImageData(0,0,width,height).data,false);
 g.clearRect(0,0,recipe.sheet.width,recipe.sheet.height);
 g.drawImage(image,recipe.photo.x,recipe.photo.y,recipe.photo.width,recipe.photo.height);
 const b=darkness(g.getImageData(0,0,width,height).data,true);
 const geometryTone=press?.settings.tone?makeToneField(a.tone,width,height,press.scale,state.shape==='circle'?'sphere':'plane',press.settings.tone,press.settings.seed):a.tone;
 return{a:{mask:a.mask,print:press?screenPlate(geometryTone,width,height,'a',press.settings,press.scale,press.origin):a.tone} as Field,b:{mask:b.mask,print:press?screenPlate(b.tone,width,height,'b',press.settings,press.scale,press.origin):screen(b.tone,width,height,state.pitch*r,recipe.print.angle)} as Field,width,height,r,press,geometryTone};
}
export function paintComposition(layers:ReturnType<typeof canvasLayers>,recipe:CompositionGeometry,choice:CompositionChoice,palette:CompositionPalette){
 const {a,b,width,height,r}=layers,offset=choice.mis*4*r;
 if(layers.press)return paintMaterial(compose(a,b,width,height,r,choice.op),width,height,{a:rgb(palette.a),b:rgb(palette.b),paper:rgb(palette.paper)},layers.press.settings,layers.press.scale);
 return paint(compose(a,b,width,height,r,choice.op),width,height,{a:rgb(palette.a),b:rgb(palette.b),paper:rgb(palette.paper)},{x:offset,y:offset*.6},recipe.print.seed);
}
