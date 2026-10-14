import type {Press} from '../design/press-material';
/** Metadata describes the actual rendered plate, not an intended CSS class. */
export function recordScreen(el:HTMLElement,p:Press,inks:'a'|'b'|'ab',fontSize?:number){
 el.dataset.screenLevel=p.level;el.dataset.screenPitch=String(p.pitch);el.dataset.screenInks=inks;
 el.dataset.screenAngles=JSON.stringify(p.angles);el.dataset.screenShapes=JSON.stringify(p.shapes);
 el.dataset.screenMethod='am';if(fontSize)el.dataset.screenFontSize=String(fontSize);
}
export function clearScreen(el:HTMLElement){for(const key of Object.keys(el.dataset))if(key.startsWith('screen'))delete el.dataset[key];}
