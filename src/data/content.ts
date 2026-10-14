import {researchMemberships} from './research-memberships.ts';
import type {ResourceLinks} from './catalog';
// Source-backed review copy. Nothing is marked approved by inference.
export const profile={
 name:['Gengyuan','Zhang'],role:['AI researcher','Based in Europe (Germany/UK)'],core:'Visual Intelligence',approval:'pending' as const,
 slogan:'Vision, Intelligence, Human & Machine',
 bio:'I study multimodal learning, visual and video understanding, and multimodal agents.',
 about:'I am a PhD researcher at LMU Munich, supervised by Prof. Volker Tresp. My thesis is titled “Promises and Limits of Language-centered Visual Understanding”.',
 personal:'Outside research: plants, travelling, cooking, Crusader Kings III, and my dachshund.',
 contacts:[{label:'Email',href:'mailto:gengyuanmax@gmail.com'},{label:'Scholar',href:'https://scholar.google.com/citations?user=LN2tYr0AAAAJ'},{label:'GitHub',href:'https://github.com/gengyuanmax'},{label:'LinkedIn',href:'https://www.linkedin.com/in/gengyuan-zhang-343542184/'}],
};
export const navigation=[{id:'home',label:'Home',shape:'home'},{id:'research',label:'Research projects',shape:'research'},{id:'artifacts',label:'Artifacts',shape:'artifacts'},{id:'about',label:'About me',shape:'about'}] as const;
export const pillars=[
 {id:'machines',action:'Building',label:'Machines can see',short:'Machines can see',lines:['Machines','can see'],detail:'Models, Agents, Systems'},
 {id:'benchmarking',action:'Evaluating',label:'Benchmarking visual intelligence',short:'Benchmarking',lines:['Benchmarking','visual intelligence'],detail:''},
 {id:'applications',action:'Leveraging',label:'Domain applications',short:'Domain applications',lines:['Domain','applications'],detail:'Embodied AI, Surgical domain'},
] as const;
export const sectionCopy={research:'Multimodal understanding, evaluation, and systems',artifacts:'Interactive experiments, research tools, datasets, and papers.'};
export interface Entry {id:string;title:string;description:string;metadata:string;themes:string[];assetId?:string;links?:ResourceLinks;approval:'pending'|'approved';sources:string[];}
export const projects:Record<string,Entry & {primaryTheme:string;publicationId:string;details?:string}>={
 a:{id:'a',title:'Mosaic',description:'Multi-image re-representation: visual tools, a grounding-focused benchmark, and a trained agent.',metadata:'arXiv, 2026',primaryTheme:'benchmarking',themes:researchMemberships.a.map(id=>id==='domain'?'applications':id),publicationId:'mosaic',links:{arxiv:'https://arxiv.org/abs/2609.39363'},sources:['cv','mosaic'],approval:'pending'},
 b:{id:'b',title:'ICQ',description:'Localizing video events with a reference image and a refinement text.',metadata:'CVPR 2025',primaryTheme:'benchmarking',themes:researchMemberships.b.map(id=>id==='domain'?'applications':id),publicationId:'icq',links:{page:'https://icq-benchmark.github.io/',arxiv:'https://arxiv.org/abs/2406.10079',github:'https://github.com/icq-benchmark/icq-benchmark'},sources:['cv','homepage','icq'],approval:'pending'},
 c:{id:'c',title:'ReEXplore',description:'Retrospective experience replay and hierarchical frontier selection for embodied exploration.',metadata:'EMR Workshop, ECCV 2026',primaryTheme:'applications',themes:researchMemberships.c.map(id=>id==='domain'?'applications':id),publicationId:'reexplore',links:{arxiv:'https://arxiv.org/abs/2511.19033'},sources:['cv','reexplore'],approval:'pending'},
 d:{id:'d',title:'How to Train a Surgeon?',description:'A surgical understanding benchmark and an environment for evaluating tool-using generalist agents.',metadata:'NeurIPS 2026, Accepted (poster)',primaryTheme:'applications',themes:researchMemberships.d.map(id=>id==='domain'?'applications':id),publicationId:'surgeon',links:{page:'https://neurips.cc/virtual/2026/loc/sydney/poster/139078'},sources:['cv','neurips'],approval:'pending'},
 e:{id:'e',title:'Me-Retriever',description:'A video–text retrieval model for videos containing multiple events.',metadata:'ICCV 2023',primaryTheme:'machines',themes:researchMemberships.e.map(id=>id==='domain'?'applications':id),publicationId:'mevtr',links:{arxiv:'https://arxiv.org/abs/2308.11551',github:'https://github.com/gengyuanmax/MeVTR'},sources:['cv','homepage','mevtr'],approval:'pending'},
 f:{id:'f',title:'AViLA',description:'A streaming vision-language agent that handles queries and visual evidence arriving at different times.',metadata:'arXiv, 2025',primaryTheme:'machines',themes:researchMemberships.f.map(id=>id==='domain'?'applications':id),publicationId:'avila',links:{arxiv:'https://arxiv.org/abs/2506.18472'},sources:['cv','avila'],approval:'pending'},
};
export const artifactCategories:Record<string,string>={demo:'Interactive',article:'Paper / Article',library:'Code',dataset:'Dataset'};
export const artifacts:Record<string,Entry & {form:string;publishedAt:string|null;categories:string[];featured?:boolean;previewRatio?:string;dateNote?:string}>={
 a:{id:'a',title:'Print Labs',description:'Four interactive labs for print texture, layout, paper objects, and element composition.',metadata:'4 labs',publishedAt:'2026-10-13',dateNote:'Launch date confirmed by the user on 14 Oct 2026.',categories:['demo'],featured:true,form:'Interactive',themes:[],links:{page:'https://gengyuanmax.github.io/print-labs/index.html',github:'https://github.com/gengyuanmax/print-labs'},sources:['user','print-lab'],approval:'pending'},
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
 {id:'print-labs-2026',date:'13 Oct 2026',text:'I launched a fun product, Print Labs, with four interactive labs for print texture, layout, paper objects, and composition.',href:'https://gengyuanmax.github.io/print-labs/index.html',sources:['user','print-lab'],approval:'approved',note:'Launch date confirmed by the user on 14 Oct 2026 as yesterday.'},
 {id:'mosaic-2026',date:'30 Sep 2026',text:'Introducing Mosaic, a visual tool environment, benchmark, and trained agent for multi-image understanding.',href:'https://arxiv.org/abs/2609.39363',sources:['mosaic'],approval:'pending'},
 {id:'surgeon-2026',date:'20 Sep 2026',text:'Our paper “How to Train a Surgeon?” has been accepted to the NeurIPS 2026 Evaluations and Datasets Track.',href:'https://neurips.cc/virtual/2026/loc/sydney/poster/139078',sources:['user','cv','neurips'],approval:'approved',note:'Acceptance date confirmed by the user on 14 Oct 2026.'},
 {id:'reexplore-2026',date:'09 Sep 2026',text:'ReEXplore at the Embodied Multimodal Reasoning Workshop, ECCV 2026.',href:'https://arxiv.org/abs/2511.19033',sources:['user','cv'],approval:'approved',note:'Workshop date confirmed by the user; this is not the acceptance notification date or a claim of personal attendance.'},
 {id:'oxford-2026',date:'16 Mar 2026',text:'I visited the Torr Vision Group at the University of Oxford from 16 Mar to 31 Jul 2026.',href:'https://torrvision.com/',sources:['user','cv'],approval:'approved',note:'Full visit dates confirmed by the user; ordered by the start date.'},
 {id:'funding-2025',date:'Dec 2025',text:'Secured €115,000 in Software Campus funding to lead a research project on intelligent agents for surgical video understanding.',href:'https://softwarecampus.de/',sources:['user','homepage','cv'],approval:'pending',note:'The user confirmed €115,000 and December 2025. Month precision is intentional; no exact day is claimed.'},
];
export const experience=[
 {date:'Oct 2021–present',role:'Research Assistant',place:'LMU Munich',detail:'Multimodal learning, visual/video understanding, and multimodal agents.'},
 {date:'16 Mar–31 Jul 2026',role:'Visiting PhD Student',place:'University of Oxford, Torr Vision Group',detail:'Agentic environments and memory for decision-making under uncertainty.'},
 {date:'Apr–Oct 2025',role:'Applied Scientist Intern',place:'Amazon, London',detail:'Omni-modal audio–video retrieval and retrieval robustness.'},
 {date:'Mar–Nov 2020',role:'Intern',place:'Agile Robots AG, Munich',detail:'Robotic object localization, grasping, and real-time perception.'},
 {date:'Sep 2019–Feb 2020',role:'Student Assistant',place:'Technical University of Munich',detail:'Perception for the RobMoSys robotic platform.'},
];
export const education=[
 {date:'2021–present',degree:'PhD in Computer Science',place:'LMU Munich',detail:'Expected completion: Dec 2026.'},
 {date:'2018–2021',degree:'MSc in Electrical Engineering and Information Technology',place:'Technical University of Munich',detail:''},
 {date:'2014–2018',degree:'BEng in Information Science and Engineering',place:'Zhejiang University',detail:''},
];
export const service={funding:'€115,000, Software Campus 2025, BMFTR',project:'Towards an Intelligent Agent for Streaming Surgical Video Understanding',reviewing:'CVPR 2024–2026; ECCV 2024–2026; NeurIPS 2024–2026; COLING 2024; ARR 2025–2026.'};
