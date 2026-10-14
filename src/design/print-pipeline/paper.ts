import {salt,valueNoise} from './noise.ts';
export function paperField(seed:number){const field=valueNoise(salt(seed,'paper'),1);return(x:number,y:number)=>.98+field(x,y)*.04;}
export type PaperRecipe={width:number;height:number;paper:string;paperNoise:(x:number,y:number)=>number};
export function paperPixels(recipe:PaperRecipe,dpr=1){
 const width=Math.round(recipe.width*dpr),height=Math.round(recipe.height*dpr),rgba=new Uint8ClampedArray(width*height*4),rgb=[1,3,5].map(i=>parseInt(recipe.paper.slice(i,i+2),16));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,n=recipe.paperNoise((x+.5)/dpr,(y+.5)/dpr);for(let k=0;k<3;k++)rgba[i+k]=Math.min(255,rgb[k]*n);rgba[i+3]=255;}
 return {rgba,width,height};
}
