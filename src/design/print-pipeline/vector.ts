import type {Dot,Transform} from './types.ts';
/** Build backend shares marks and affine transforms, not a second screen algorithm. */
export function polygonVector(width:number,height:number,color:string,t:Transform,dots:Dot[],transfer:number){
 const cx=width/2,cy=height/2;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g fill="${color}" opacity="${String(transfer).replace(/^0\./,'.')}" transform="translate(${cx+t.x} ${cy+t.y}) rotate(${t.rotation}) scale(${t.scale}) translate(${-cx} ${-cy})">${dots.map(d=>`<polygon points="${d.points.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')}"/>`).join('')}</g></svg>`;
}
