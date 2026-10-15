import {printText,type TextRecipe} from './text.ts';
/** Public entry: adapters supply originals, registered profiles own screening.
 * Versioned kernels preserve existing visual recipes during staged migration. */
import {screenPolygons,type PolygonScreen} from './polygon.ts';
import {screenPlate,type Press} from './material.ts';
import type {ProceduralSource,RasterSource,Dot} from './types.ts';
export type PolygonElement={id:string;profile:'polygon-v1';width:number;height:number;seed:number;plate:string;source:ProceduralSource;screen:PolygonScreen};
export type MaterialElement<Id extends string=string>={id:string;profile:'material-v1';width:number;height:number;scale:number;plate:Id;source:RasterSource;press:Press<Id>;origin?:{x:number;y:number};solid?:boolean;textRecipe?:TextRecipe};
export type InsertElement={id:string;profile:'insert';source:{kind:'graphic';src:string}};
export type PrintElement=PolygonElement|MaterialElement|InsertElement;
export function definePrintElement<T extends PrintElement>(element:T):Readonly<T>{
 if(!element.id.trim())throw new Error('Print element requires a stable id');
 if(element.profile==='insert'){
  if(!element.source.src)throw new Error('Insert requires its original image');
 }else{
  if(!Number.isFinite(element.width)||!Number.isFinite(element.height)||element.width<=0||element.height<=0)throw new Error('Invalid print dimensions');
  if(element.profile==='material-v1'){
   const size=element.width*element.height;
   if(element.source.mask.length!==size||element.source.tone.length!==size)throw new Error('Mask and tone dimensions must match');
   if(!Number.isFinite(element.press.angles[element.plate])||!element.press.shapes[element.plate])throw new Error('Unregistered ink plate');
  }else if(element.screen.pitch<=0||!Number.isFinite(element.screen.pitch))throw new Error('Invalid screen pitch');
 }
 return Object.freeze(element);
}
export function screenPrintElement(e:Readonly<PolygonElement>):Dot[];
export function screenPrintElement<Id extends string>(e:Readonly<MaterialElement<Id>>):Float32Array;
export function screenPrintElement(e:Readonly<InsertElement>):string;
export function screenPrintElement(e:Readonly<PrintElement>):Dot[]|Float32Array|string{
 if(e.profile==='insert')return e.source.src;
 if(e.profile==='polygon-v1')return screenPolygons(e.source,e.width,e.height,e.seed,e.plate,e.screen);
 if(e.textRecipe&&e.source.kind==='text')return printText(e.source.mask,e.width,e.height,e.scale,e.press.seed,e.press.pitch,e.press.angles[e.plate],{transfer:{grain:e.press.grain,starve:e.press.starve,holes:e.press.holes,band:e.press.band},...e.textRecipe},e.press.sheet);
 return screenPlate(e.source.tone,e.width,e.height,e.plate,e.press,e.scale,e.origin,e.solid);
}
export {paintMaterial,pressSettings,elementPress,materialVersion,type Press} from './material.ts';
export type {PrintPlate,RGB,Dot,Transform,RasterSource} from './types.ts';
/** Raster adapter convenience; still validates and dispatches through the public declaration. */
export function screenOriginal<Id extends string>(id:string,source:RasterSource,width:number,height:number,plate:Id,press:Press<Id>,scale=1,origin={x:0,y:0},solid=false,textRecipe?:TextRecipe){
 return screenPrintElement(definePrintElement({id,profile:'material-v1',source,width,height,plate,press,scale,origin,solid,textRecipe}));
}

export {registeredPlates} from './registration.ts';
export {paperField,paperPixels} from './paper.ts';
export {polygonVector} from './vector.ts';
export {darkness,separateOriginal,separatePrintLab,portraitSeparation} from './sources.ts';
export {makeToneField,toneSettings} from './tone.ts';

export {textTextureVersion,textTier} from './text.ts';

export {onSheet,sheetFields,type Sheet} from './sheet.ts';

export {preparePortraitOriginals,paintPortraitOriginals} from './portrait.ts';

export {renderFieldOriginals,type FieldOriginal} from './field.ts';

export {dotPitch,dotPlateImage,groundFirstCoverage} from './first-frame.ts';
export {noiseBudget} from './budget.ts';
export {rng,salt} from './noise.ts';
export {printRule,ruleVersion,type RuleTransfer} from './rule.ts';
export {runMaskJob,runFieldJob,type MaskJob,type FieldJob,type MaskResult,type FieldResult} from './jobs.ts';
export {separateSubject,subjectSeparation,raggedFrame,raggedFrameRecipe,type SubjectRecipe,type FrameRecipe} from './subject.ts';
export {pagePlates,plateTables,referencePlate,type PagePlate,type PlateInk} from './plates.ts';
