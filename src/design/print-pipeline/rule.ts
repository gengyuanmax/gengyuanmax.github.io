import type {Sheet} from './sheet-context.ts';
import {transferPlate} from './transfer.ts';
export const ruleVersion='rule-v1';
export type RuleTransfer={grain:number;starve:number;holes:number;band?:number};
/** Alpha mask for one rectangular rule. `pad` CSS px of room on each long side holds the edge. */
export function printRule(width:number,height:number,scale:number,sheet:Sheet,transfer:RuleTransfer,pad=1){
 return transferPlate({kind:'rule',width,height,scale,sheet,recipe:transfer,pad});
}
