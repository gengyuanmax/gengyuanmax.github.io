import {salt,valueNoise} from './noise.ts';
import {sheetFields,sheetInk,sheetRoller,type Sheet} from './sheet.ts';
import {noiseBudget,within} from './budget.ts';
/** `rule-v1`: a printed guide line. Lines are ink too, so they get the same transfer as
 * images and type on the same sheet (low-frequency starvation, fine grain loss, roller),
 * plus a slightly uneven edge where ink spreads along the long side. The edge moves at
 * most noiseBudget.rule.edge CSS px and changes over several px, never per pixel, so a
 * line never breaks, frays or reads as a glitch. */
export const ruleVersion='rule-v1';
export type RuleTransfer={grain:number;starve:number;holes:number;band?:number};
/** Alpha mask for one rectangular rule. `pad` CSS px of room on each long side holds the edge. */
export function printRule(width:number,height:number,scale:number,sheet:Sheet,transfer:RuleTransfer,pad=1){
 const vertical=height>=width,W=Math.round((width+(vertical?pad*2:0))*scale),H=Math.round((height+(vertical?0:pad*2))*scale),out=new Float32Array(W*H);
 const b=noiseBudget.transfer,e=noiseBudget.rule.edge,f=sheetFields(sheet.seed);
 const sideA=valueNoise(salt(sheet.seed,'rule-edge-a'),noiseBudget.rule.wave),sideB=valueNoise(salt(sheet.seed,'rule-edge-b'),noiseBudget.rule.wave);
 const fraction=within(transfer.holes,b.grainArea),grain=within(transfer.grain,b.grainLoss),starve=within(transfer.starve,b.starvation),roller=within((transfer.band||0)*.5,b.roller);
 const thick=vertical?width:height,alongN=vertical?H:W,acrossN=vertical?W:H,half=.5/scale;
 // Everything but the 1px grain varies slowly along the line: evaluate it once per
 // device pixel along the line at the line's centre, not for every pixel across it.
 for(let a=0;a<alongN;a++){
  const along=(a+.5)/scale+(vertical?sheet.origin.y:sheet.origin.x),centre=(vertical?sheet.origin.x:sheet.origin.y)+thick/2;
  const cx=vertical?centre:along,cy=vertical?along:centre,fixed=vertical?sheet.origin.x:sheet.origin.y;
  const lo=(sideA(along,fixed)-.5)*e,hi=thick+(sideB(along,fixed)-.5)*e;
  const m=Math.max(0,Math.min(1,(sheetInk(sheet.seed,cx,cy)-.42)/.38)),strength=(1-starve*m*m)*(1-roller*sheetRoller(sheet,cy));
  for(let c=0;c<acrossN;c++){
   const across=(c+.5)/scale-pad,cover=Math.max(0,Math.min(1,(Math.min(across+half,hi)-Math.max(across-half,lo))/(2*half)));
   if(!cover)continue;
   const px=vertical?fixed+across:along,py=vertical?along:fixed+across,fine=f.fine(px,py),g=fraction?Math.max(0,(fraction-fine)/fraction):0;
   out[vertical?a*W+c:c*W+a]=cover*(1-grain*g)*strength;
  }
 }
 return {alpha:out,width:W,height:H,pad};
}
