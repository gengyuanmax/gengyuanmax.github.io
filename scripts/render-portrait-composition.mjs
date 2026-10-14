import fs from 'node:fs/promises';
import sharp from 'sharp';
import {selectedComposition as recipe,portraitViewport as view,compositionAsset} from '../src/config/portrait-composition.ts';
import {darkness,compose,rgb} from '../src/design/element-composition.ts';
import {resolve,getPalette} from '../src/design/settings.ts';
import {screenPlate,paintMaterial,pressSettings,elementPress,materialVersion} from '../src/design/press-material.ts';
import {makeToneField} from '../src/design/tone-field.ts';

export async function renderPortraitComposition(config){
 const s=resolve(config,'home','home-portrait').values,p=getPalette(config,s.palette),r=2;
 const width=recipe.sheet.width*r,height=recipe.sheet.height*r;
 const shape=s.compositionShape==='circle'?`<circle cx="${recipe.circle.x}" cy="${recipe.circle.y}" r="${recipe.circle.radius}"/>`:`<polygon points="${recipe.triangle.map(p=>p.join(',')).join(' ')}"/>`;
 const mask=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${recipe.sheet.width} ${recipe.sheet.height}">${shape}</svg>`)).ensureAlpha().raw().toBuffer();
 const photo=await sharp(new URL('../public'+recipe.photoSource.cutout,import.meta.url).pathname).resize(Math.round(recipe.photo.width*r),Math.round(recipe.photo.height*r)).png().toBuffer();
 const positioned=await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:photo,left:Math.round(recipe.photo.x*r),top:Math.round(recipe.photo.y*r)}]).raw().toBuffer();
 const a=darkness(mask,false),b=darkness(positioned,true);
 const press=elementPress(pressSettings(s),'home-portrait','image'),origin={x:-view.x,y:-view.y};
 const geometryTone=makeToneField(a.tone,width,height,r,s.compositionShape==='circle'?'sphere':'plane',press.tone,press.seed);
 const plates=compose({mask:a.mask,print:screenPlate(geometryTone,width,height,'a',press,r,origin)},{mask:b.mask,print:screenPlate(b.tone,width,height,'b',press,r,origin)},width,height,r,s.compositionOperation);
 const data=paintMaterial(plates,width,height,{a:rgb(p.secondary),b:rgb(p.primary),paper:[255,255,255]},press,r);
 await sharp(Buffer.from(data),{raw:{width,height,channels:4}}).extract({left:view.x*r,top:view.y*r,width:view.width*r,height:view.height*r}).png().toFile(new URL('../public'+compositionAsset,import.meta.url).pathname);
 await fs.writeFile(new URL('../.design/portrait-composition-applied.json',import.meta.url),JSON.stringify({sourceExport:'.design/imports/portrait-composition-review.json',sourceVersion:recipe.sourceVersion,selection:{op:s.compositionOperation,shape:s.compositionShape,pitch:s.compositionPitch,mis:s.compositionMis},inks:{a:p.secondary,b:p.primary,paper:p.paper},view,output:compositionAsset,blend:'multiply on the shared page paper',status:'User-selected working recipe; homepage placement remains reviewable'},null,2)+'\n');
 await fs.writeFile(new URL('../.design/press-material.json',import.meta.url),JSON.stringify({materialVersion,sourceVersion:recipe.sourceVersion,press,referenceWidth:view.width,origin,units:'CSS px at reference width; live renderer recalculates at actual display size',paper:'Shared Layout Lab SVG paper texture over the complete page'},null,2)+'\n');
 console.log('Rendered selected circle / portrait composition with Print Lab material');
}
