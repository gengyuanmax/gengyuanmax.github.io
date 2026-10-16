import {valueNoise,salt,rng} from './noise.ts';
import type {Press} from './material.ts';
export type Sheet={seed:number;origin:{x:number;y:number};height?:number;band?:number};
/** Infinite paper coordinates: independent of crop bounds, DPR, role or element id. */
const fields=new Map<number,ReturnType<typeof createFields>>();
function createFields(seed:number){const random=rng(salt(seed,'sheet-roller')),rows=Float32Array.from({length:21},()=>random());return {rows,fine:valueNoise(salt(seed,'paper-fine'),1),low:valueNoise(salt(seed,'sheet-ink'),80),detail:valueNoise(salt(seed,'sheet-detail'),32),edge:valueNoise(salt(seed,'sheet-edge'),1.5)};}
export function sheetFields(seed:number){let f=fields.get(seed);if(!f){f=createFields(seed);if(fields.size>=4)fields.clear();fields.set(seed,f);}return f;}
export function sheetInk(seed:number,x:number,y:number){const f=sheetFields(seed);return f.low(x,y)*.65+f.detail(x,y)*.35;}
export function onSheet<Id extends string>(press:Press<Id>,seed:number,origin:{x:number;y:number},height=1440):Press<Id>{return {...press,sheet:{seed,origin,height,band:press.band}};}
/** Roller marks are a property of the press, not of the page: one drum of 20 smoothstep
 * intervals spans 1440 CSS px (the design canvas) and then runs back, so every page,
 * at every width and length, carries roller bands of the same size at the same sheet Y.
 * Within 0–1440 the field is the native one; past it, it mirrors (seamless, no clamp). */
export const rollerDrum=1440;
export function sheetRoller(sheet:Sheet,y:number){
 const rows=sheetFields(sheet.seed).rows,turn=((y/rollerDrum)%2+2)%2,position=(turn>1?2-turn:turn)*20,i=Math.min(19,Math.floor(position)),t=position-i,u=t*t*(3-2*t);
 return Math.max(0,Math.min(1,((rows[i]+(rows[i+1]-rows[i])*u)-.5)*2.4+.5));
}
