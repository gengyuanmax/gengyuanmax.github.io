import {getPalette,type Settings,type DesignConfig} from './settings.ts';
export type PlateId='blue'|'orange'|'yellow';
/** This research-only recipe is intentionally isolated from the site's two-ink
 * portrait recipe. It is the only source of its angles and affine registration. */
export function researchPlates(s:Settings,config?:DesignConfig){
 const palette=getPalette(config,s.palette);
 return {
  blue:{color:palette.primary,angle:s.researchBlueAngle,x:0,y:0,rotation:0,scale:1},
  orange:{color:palette.secondary,angle:s.researchOrangeAngle,x:s.researchOrangeX,y:s.researchOrangeY,rotation:.15,scale:1.002},
  yellow:{color:palette.yellow,angle:s.yellowAngle,x:s.yellowX,y:s.yellowY,rotation:-.2,scale:.998},
 };
}
export const researchPrintOrder=['yellow','orange','blue'] as const;
export const researchTransfer=.9;
