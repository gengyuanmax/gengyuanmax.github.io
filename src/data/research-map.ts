import {pillars} from './content.ts';
import type {DirectionId} from './research-memberships.ts';
export type {DirectionId};
export const directions=[
 {id:'machines',label:pillars.find(p=>p.id==='machines')!.label,plate:'yellow',href:'#machines'},
 {id:'benchmarking',label:pillars.find(p=>p.id==='benchmarking')!.label,plate:'blue',href:'#benchmarking'},
 {id:'domain',label:pillars.find(p=>p.id==='applications')!.label,plate:'orange',href:'#applications'},
] as const;
