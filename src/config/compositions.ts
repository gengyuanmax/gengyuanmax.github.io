import {pillars} from '../data/content.ts';
// Placement is editorial; no rule maps an output format to a slot.
export const researchComposition = [
  { pillar:'benchmarking', className:'he-benchmark', items:[{id:'a',slot:'feature',media:'wide'},{id:'b',slot:'side'}] },
  { pillar:'applications', className:'he-applications', items:[{id:'c',slot:'embodied',media:'portrait'},{id:'d',slot:'surgical',media:'landscape'}] },
  { pillar:'machines', className:'he-machines', items:[{id:'e',slot:'note'},{id:'f',slot:'machine',media:'panorama'}] },
].sort((a,b)=>pillars.findIndex(p=>p.id===a.pillar)-pillars.findIndex(p=>p.id===b.pillar));
export const artifactComposition = [
  {id:'a',slot:'lead'}, {id:'b',slot:'margin'}, {id:'c',slot:'small'},
  {id:'d',slot:'type'}, {id:'e',slot:'open'},
];
// A stable reading order with adjustable spans; media format never selects a slot.
export const placements = {
  'about-intro': {area:'about', spread:'about', start:2, span:9, row:1, offset:0},
  'about-experience': {area:'about', spread:'about', start:1, span:7, row:2, offset:0},
  'about-education': {area:'about', spread:'about', start:9, span:4, row:2, offset:10},
  'about-funding': {area:'about', spread:'about', start:2, span:5, row:3, offset:0},
  'about-reviewing': {area:'about', spread:'about', start:8, span:5, row:3, offset:7},
  'about-outside': {area:'about', spread:'about', start:4, span:8, row:4, offset:0},
  'about-contact': {area:'about', spread:'about', start:1, span:12, row:5, offset:0},
  'project-a': { area:'research', spread:'benchmarking', start:1, span:8, row:2, offset:0 },
  'project-b': { area:'research', spread:'benchmarking', start:10, span:3, row:2, offset:5 },
  'project-c': { area:'research', spread:'applications', start:1, span:5, row:2, offset:0 },
  'project-d': { area:'research', spread:'applications', start:7, span:6, row:2, offset:7 },
  'project-e': { area:'research', spread:'machines', start:1, span:3, row:2, offset:3 },
  'project-f': { area:'research', spread:'machines', start:5, span:8, row:2, offset:0 },
  'artifact-a': { area:'artifacts', spread:'artifacts', start:1, span:6, row:1, offset:0 },
  'artifact-b': { area:'artifacts', spread:'artifacts', start:8, span:5, row:1, offset:3 },
  'artifact-c': { area:'artifacts', spread:'artifacts', start:2, span:4, row:2, offset:0 },
  'artifact-d': { area:'artifacts', spread:'artifacts', start:7, span:6, row:2, offset:4 },
  'artifact-e': { area:'artifacts', spread:'artifacts', start:4, span:6, row:3, offset:0 },
} as const;
