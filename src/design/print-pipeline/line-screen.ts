import {transferPlate,type LineMaster} from './transfer.ts';
export {lineFinishes,type LineFinish} from './transfer.ts';
import type {LineFinish} from './transfer.ts';
export type LineTexture='line'|'knurl'|'wave';
/** Plate geometry only. Wave is a screen pattern, not roller noise. */
export function screenLineMaster(pitch:number,texture:LineTexture):LineMaster{
 const tile=128;return {period:pitch,tile,rows:8,knurl:texture==='knurl',wave:Array.from({length:tile+1},(_,x)=>texture==='wave'?Math.sin(2*Math.PI*8*x/tile)*pitch*.6:0)};
}
export function lineScreen(pitch:number,angle:number,coverage:number,seed:number,grain:number,starvation:number,id="chapter",texture:LineTexture='line',finish:LineFinish='original'):string {
 const prefix=id.replace(/[^a-zA-Z0-9_-]/g,'-'),master=screenLineMaster(pitch,texture),{tile,rows,period,knurl}=master,height=period*rows;
 const paths=transferPlate({kind:'line',master,coverage,seed,grain,starvation,finish});
 return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true"><defs><pattern id="${prefix}-line-screen" patternUnits="userSpaceOnUse" width="${tile}" height="${height}" patternTransform="rotate(${angle})"><path d="${paths.join('')}" fill="currentColor"/></pattern>${knurl?`<pattern id="${prefix}-line-cross" href="#${prefix}-line-screen" patternTransform="rotate(${angle-60})"/>`:''}</defs><rect width="100%" height="100%" fill="url(#${prefix}-line-screen)"/>${knurl?`<rect width="100%" height="100%" fill="url(#${prefix}-line-cross)"/>`:''}</svg>`;
}
