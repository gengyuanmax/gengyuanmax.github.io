import {getPalette,type Settings,type DesignConfig} from './settings.ts';
import {pagePlates,type PlateInk} from './print-pipeline/plates.ts';
export type PlateId='blue'|'orange'|'yellow';
/** The research circles print with the page's own plates (user decision 2026-10-14):
 * angle and registration come from the page plate list, so the whole page is one press.
 * Orange is the page's vermilion reference plate; there is no per-module rotation or scale. */
const pageInk:Record<PlateId,PlateInk>={blue:'b',orange:'a',yellow:'c'};
export function researchPlates(s:Settings,config?:DesignConfig){
 const palette=getPalette(config,s.palette),page=Object.fromEntries(pagePlates(s).map(p=>[p.ink,p]));
 const plate=(id:PlateId,color:string)=>{const p=page[pageInk[id]];return {color,angle:p.angle,x:p.registration.x,y:p.registration.y,rotation:0,scale:1};};
 return {blue:plate('blue',palette.primary),orange:plate('orange',palette.secondary),yellow:plate('yellow',palette.yellow)};
}
export const researchPrintOrder=['yellow','orange','blue'] as const;
export const researchTransfer=.9;
