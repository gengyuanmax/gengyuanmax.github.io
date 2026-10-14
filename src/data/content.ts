import {researchMemberships} from './research-memberships';
import type {ResourceLinks} from './catalog';
// Source-backed review copy. Nothing is marked approved by inference.
export const profile={
 name:['Gengyuan','Zhang'],role:['PhD researcher','LMU Munich'],core:'Visual Intelligence',approval:'pending' as const,
 bio:'I study multimodal learning, visual and video understanding, and multimodal agents.',
 about:'I am a PhD researcher at LMU Munich, supervised by Prof. Volker Tresp. My thesis is titled “Promises and Limits of Language-centered Visual Understanding”.',
 personal:'Outside research: plants, travelling, cooking, Crusader Kings III, and my dachshund.',
 contacts:[{label:'Email',href:'mailto:gengyuanmax@gmail.com'},{label:'Scholar',href:'https://scholar.google.com/citations?user=LN2tYr0AAAAJ'},{label:'GitHub',href:'https://github.com/gengyuanmax'},{label:'LinkedIn',href:'https://www.linkedin.com/in/gengyuan-zhang-343542184/'}],
};
export const navigation=[{id:'home',label:'Home',shape:'home'},{id:'research',label:'Research projects',shape:'research'},{id:'artifacts',label:'Artifacts',shape:'artifacts'},{id:'about',label:'About me',shape:'about'}] as const;
export const pillars=[
 {id:'benchmarking',label:'Benchmarking visual intelligence',short:'Benchmarking',lines:['Benchmarking','visual intelligence'],detail:''},
 {id:'applications',label:'Domain application',short:'Domain application',lines:['Domain','application'],detail:'Embodied AI · Surgical domain'},
 {id:'machines',label:'Machines',short:'Machines',lines:['Machines'],detail:'Models · Agents · Systems'},
] as const;
export const sectionCopy={research:'Multimodal understanding, evaluation, and systems for interacting with visual evidence.',artifacts:'Interactive experiments, research tools, datasets, and papers.'};
export interface Entry {id:string;title:string;description:string;metadata:string;themes:string[];assetId?:string;links?:ResourceLinks;approval:'pending'|'approved';sources:string[];}
export const projects:Record<string,Entry & {primaryTheme:string;publicationId:string;details?:string}>={
 a:{id:'a',title:'Mosaic',description:'Multi-image re-representation: visual tools, a grounding-focused benchmark, and a trained agent.',metadata:'arXiv · 2026',primaryTheme:'benchmarking',themes:researchMemberships.a.map(id=>id==='domain'?'applications':id),publicationId:'mosaic',links:{arxiv:'https://arxiv.org/abs/2609.39363'},sources:['cv','mosaic'],approval:'pending'},
 b:{id:'b',title:'ICQ',description:'Localizing video events with a reference image and a refinement text.',metadata:'CVPR 2025',primaryTheme:'benchmarking',themes:researchMemberships.b.map(id=>id==='domain'?'applications':id),publicationId:'icq',links:{page:'https://icq-benchmark.github.io/',arxiv:'https://arxiv.org/abs/2406.10079',github:'https://github.com/icq-benchmark/icq-benchmark'},sources:['cv','homepage','icq'],approval:'pending'},
 c:{id:'c',title:'ReEXplore',description:'Retrospective experience replay and hierarchical frontier selection for embodied exploration.',metadata:'EMR Workshop · ECCV 2026',primaryTheme:'applications',themes:researchMemberships.c.map(id=>id==='domain'?'applications':id),publicationId:'reexplore',links:{arxiv:'https://arxiv.org/abs/2511.19033'},sources:['cv','reexplore'],approval:'pending'},
 d:{id:'d',title:'How to Train a Surgeon?',description:'A surgical understanding benchmark and an environment for evaluating tool-using generalist agents.',metadata:'NeurIPS 2026 · Accepted (poster)',primaryTheme:'applications',themes:researchMemberships.d.map(id=>id==='domain'?'applications':id),publicationId:'surgeon',links:{page:'https://neurips.cc/virtual/2026/loc/sydney/poster/139078'},sources:['cv','neurips'],approval:'pending'},
 e:{id:'e',title:'Me-Retriever',description:'A video–text retrieval model for videos containing multiple events.',metadata:'ICCV 2023',primaryTheme:'machines',themes:researchMemberships.e.map(id=>id==='domain'?'applications':id),publicationId:'mevtr',links:{arxiv:'https://arxiv.org/abs/2308.11551',github:'https://github.com/gengyuanmax/MeVTR'},sources:['cv','homepage','mevtr'],approval:'pending'},
 f:{id:'f',title:'AViLA',description:'A streaming vision-language agent that handles queries and visual evidence arriving at different times.',metadata:'arXiv · 2025',primaryTheme:'machines',themes:researchMemberships.f.map(id=>id==='domain'?'applications':id),publicationId:'avila',links:{arxiv:'https://arxiv.org/abs/2506.18472'},sources:['cv','avila'],approval:'pending'},
};
export const artifactCategories:Record<string,string>={demo:'Interactive',article:'Paper / Article',library:'Code',dataset:'Dataset'};
export const artifacts:Record<string,Entry & {form:string;publishedAt:string|null;categories:string[];featured?:boolean;previewRatio?:string;dateNote?:string}>={
 a:{id:'a',title:'Print Lab',description:'Four interactive labs for print texture, layout, paper objects, and element composition.',metadata:'4 labs',publishedAt:null,dateNote:'First release date to confirm; featured separately from the timeline.',categories:['demo'],featured:true,form:'Interactive',themes:[],links:{page:'https://gengyuanmax.github.io/print-labs/index.html',github:'https://github.com/gengyuanmax/print-labs'},sources:['user','print-lab'],approval:'pending'},
 b:{id:'b',title:'Mosaic',description:'Rethinking Multi-Image Re-Representation in Multi-Image Understanding.',metadata:'Preprint',publishedAt:'2026-09-30',categories:['article'],form:'Paper',themes:projects.a.themes,links:{arxiv:'https://arxiv.org/abs/2609.39363'},sources:['mosaic'],approval:'pending'},
 c:{id:'c',title:'ICQ-Highlight',description:'A benchmark, dataset, and code for localizing events with multimodal queries.',metadata:'CVPR 2025',publishedAt:null,dateNote:'Associated paper: CVPR 2025; dataset release date is not inferred from the paper year.',categories:['dataset','library'],form:'Dataset / Code',themes:projects.b.themes,links:{page:'https://icq-benchmark.github.io/',github:'https://github.com/icq-benchmark/icq-benchmark',dataset:'https://huggingface.co/datasets/gengyuanmax/ICQ-Highlight'},sources:['icq'],approval:'pending'},
 d:{id:'d',title:'WikiTiLo',description:'An image dataset for probing time and location reasoning in vision-language models.',metadata:'WACV 2024',publishedAt:null,dateNote:'Associated paper: WACV 2024; dataset release date to confirm.',categories:['dataset'],form:'Dataset',themes:['benchmarking'],links:{github:'https://github.com/gengyuanmax/WikiTiLo',arxiv:'https://arxiv.org/abs/2307.06166'},sources:['homepage','wikitilo'],approval:'pending'},
 e:{id:'e',title:'MeVTR',description:'Code and evaluation resources for Multi-Event Video-Text Retrieval.',metadata:'ICCV 2023',publishedAt:null,dateNote:'Associated paper: ICCV 2023; code release date to confirm.',categories:['library'],form:'Code',themes:researchMemberships.e.map(id=>id==='domain'?'applications':id),links:{github:'https://github.com/gengyuanmax/MeVTR',arxiv:'https://arxiv.org/abs/2308.11551'},sources:['mevtr'],approval:'pending'},
};
export const printLabModules=[
 {name:'Print texture',href:'https://gengyuanmax.github.io/print-labs/print.html',image:'/images/print-lab-texture.png'},
 {name:'Layout',href:'https://gengyuanmax.github.io/print-labs/layout.html',image:'/images/print-lab-layout.png'},
 {name:'Paper objects',href:'https://gengyuanmax.github.io/print-labs/object.html',image:'/images/print-lab-object.png'},
 {name:'Elements',href:'https://gengyuanmax.github.io/print-labs/element.html',image:'/images/print-lab-element.png'},
];
export const news=[
 {id:'surgeon-2026',date:'2026',text:'“How to Train a Surgeon?” accepted at NeurIPS 2026 as a poster.',href:'https://neurips.cc/virtual/2026/loc/sydney/poster/139078',sources:['cv','neurips'],approval:'pending',note:'Acceptance announcement date unknown; year only.'},
 {id:'mosaic-2026',date:'30 Sep 2026',text:'New preprint: Rethinking Multi-Image Re-Representation in Multi-Image Understanding.',href:'https://arxiv.org/abs/2609.39363',sources:['mosaic'],approval:'pending'},
 {id:'reexplore-2026',date:'09 Sep 2026',text:'ReEXplore at the EMR Workshop, ECCV 2026.',href:'https://arxiv.org/abs/2511.19033',sources:['cv'],approval:'pending',note:'Workshop held 9 Sep 2026: https://emr-workshop.github.io/; date describes the event, not acceptance notification.'},
 {id:'oxford-2026',date:'18 Mar 2026',text:'Started a research visit with the Torr Vision Group at the University of Oxford.',href:'https://torrvision.com/',sources:['homepage','cv'],approval:'pending'},
 {id:'funding-2025',date:'01 Dec 2025',text:'Awarded €130,000 through Software Campus for streaming surgical video understanding.',href:'https://softwarecampus.de/',sources:['homepage','cv'],approval:'pending'},
];
export const experience=[
 {date:'Oct 2021–present',role:'Research Assistant',place:'LMU Munich',detail:'Multimodal learning, visual/video understanding, and multimodal agents.'},
 {date:'Mar–Jul 2026',role:'Visiting PhD Student',place:'University of Oxford · Torr Vision Group',detail:'Agentic environments and memory for decision-making under uncertainty.'},
 {date:'Apr–Oct 2025',role:'Applied Scientist Intern',place:'Amazon · London',detail:'Omni-modal audio–video retrieval and retrieval robustness.'},
 {date:'Mar–Nov 2020',role:'Intern',place:'Agile Robots AG · Munich',detail:'Robotic object localization, grasping, and real-time perception.'},
 {date:'Sep 2019–Feb 2020',role:'Student Assistant',place:'Technical University of Munich',detail:'Perception for the RobMoSys robotic platform.'},
];
export const education=[
 {date:'2021–present',degree:'PhD in Computer Science',place:'LMU Munich',detail:'Expected completion: December 2026.'},
 {date:'2018–2021',degree:'MSc in Electrical Engineering and Information Technology',place:'Technical University of Munich',detail:''},
 {date:'2014–2018',degree:'BEng in Information Science and Engineering',place:'Zhejiang University',detail:''},
];
export const service={funding:'€130,000 · Software Campus 2025 · BMFTR',project:'Towards an Intelligent Agent for Streaming Surgical Video Understanding',reviewing:'CVPR 2024–2026; ECCV 2024–2026; NeurIPS 2024–2026; COLING 2024; ARR 2025–2026.'};
