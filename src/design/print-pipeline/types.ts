/** Coverage describes the original shape; tone is its requested ink amount.
 * Coordinates and pitch are CSS px. Raster arrays use width × height device pixels. */
export type RGB=readonly [number,number,number];
export type PrintPlate<Id extends string=string>={ink:Id;coverage:Float32Array;opaque?:boolean};
export type Point={x:number;y:number};
export type Dot=Point&{tone:number;radius:number;points:Point[]};
export type Transform={x:number;y:number;rotation:number;scale:number};
export type RasterSource={kind:'text'|'shape'|'photo';mask:Float32Array;tone:Float32Array};
export type ProceduralSource={kind:'procedural';sample:(x:number,y:number)=>{shape:number;focus:number}};
