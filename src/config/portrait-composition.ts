import imported from './portrait-composition.json' with {type:'json'};
import {operations,type Operation} from '../design/element-composition.ts';
// The export's selection is authoritative; `defaults` and `print.pitch` can
// describe the initial lab state rather than the recipe the user exported.
const chosen=imported.selection;
if(!Object.hasOwn(operations,chosen.op)||!['circle','triangle'].includes(chosen.shape))throw new Error('Unknown portrait composition');
export const selectedComposition={
 ...imported,
 print:{...imported.print,pitch:chosen.pitch,mis:chosen.mis},
 selection:{...chosen,op:chosen.op as Operation,shape:chosen.shape as 'circle'|'triangle'},
};
// Crop empty sheet margins for placement, preserving both elements and their
// exact relation. Units remain those of the original 640 × 540 lab sheet.
export const portraitViewport={x:104,y:34,width:458,height:438};
export const compositionAsset='/images/portrait-composition.png';

/** Portrait and its circle share one screen tier. Fine (2px) is the only tier at which the
 * face reads at display size (user review 2026-10-14); medium 4px and 3px lose eyes and mouth. */
export const portraitScreenLevel='fine' as const;
