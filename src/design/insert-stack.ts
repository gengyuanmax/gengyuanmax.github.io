import {rng,salt} from './print-pipeline/index.ts';
/** Print Labs as a loose pile of its own sample sheets: four different stocks laid on
 * the page, each a separate insert in its original colours. No tape, frame or shadow;
 * the sheets read as layered material through their stock and overlap alone.
 * The base arrangement is fixed; the global seed adds a small, repeatable shuffle. */
export type InsertSheet={id:string;src:string;label:string};
export const printLabSheets:readonly InsertSheet[]=[
 {id:'object',src:'/images/print-lab-object.png',label:'Paper objects'},
 {id:'element',src:'/images/print-lab-element.png',label:'Elements'},
 {id:'texture',src:'/images/print-lab-texture.png',label:'Print texture'},
 {id:'layout',src:'/images/print-lab-layout.png',label:'Layout'},
];
/** Sheet width as a share of the stack; sheets keep the 249:320 source ratio. */
export const stackSheetWidth=.72;
export const stackRatio=320/249;
// Back to front: [left %, top % of stack width, rotation °, fan-out x %, fan-out y %].
const base:readonly (readonly [number,number,number,number,number])[]=[[4,1,-4,-3,-3],[25,3,4,5,-4],[7,15,-2,-3,3],[18,19,1.5,2,4]];
export function insertStack(seed:number){
 return printLabSheets.map((sheet,i)=>{
  const r=rng(salt(Math.trunc(seed),`insert-stack:${sheet.id}`)),[x,y,a,fx,fy]=base[i];
  const left=x+(r()-.5)*3,top=y+(r()-.5)*3,angle=a+(r()-.5)*2;
  return {...sheet,style:`--sheet-x:${left.toFixed(2)}%;--sheet-y:${top.toFixed(2)}cqw;--sheet-angle:${angle.toFixed(2)}deg;--fan-x:${fx}%;--fan-y:${fy}%;z-index:${i+1}`};
 });
}
/** Height of the stack box in units of its width, so every sheet stays inside it. */
export const stackHeight=Math.max(...base.map(b=>b[1]))/100+stackSheetWidth*stackRatio+.06;
