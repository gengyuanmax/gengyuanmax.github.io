import {pillars} from './content.ts';
import type {DirectionId} from './research-memberships.ts';
export type {DirectionId};
export const directions=[
 {id:'benchmarking',label:pillars[0].label,plate:'blue',href:'#benchmarking'},
 {id:'domain',label:pillars[1].label,plate:'orange',href:'#applications'},
 {id:'machines',label:pillars[2].label,plate:'yellow',href:'#machines'},
] as const;
