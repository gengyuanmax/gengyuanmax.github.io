import {researchMemberships} from './research-memberships.ts';
import type {ResourceLinks} from './catalog';
// Source-backed review copy. Nothing is marked approved by inference.
export const profile={
 name:['Gengyuan','Zhang'],role:['PhD AI researcher in multimodal intelligence and visual understanding','Based in Europe (Germany & UK)'],core:'Visual Intelligence',approval:'pending' as const,
 introduction:'I am a final-year PhD student at LMU Munich, working on multimodal AI systems that understand and interact with the visual world. My research spans building multimodal models and agents, evaluating their visual intelligence in the wild, and applying their capabilities to specialized domains. I have also conducted research at the University of Oxford, Amazon, and TU Munich.',
 /** User copy QA, 2026-10-21. */
 status:'Actively on the job market and open to research collaboration.',
 affiliations:['LMU Munich','University of Oxford','Amazon','TU Munich'],
 collaboration:{topics:['Training and evaluating agents','Defining and evaluating multimodal intelligence','Domain applications'],open:'Open to collaborative projects, job opportunities and student mentoring.',contact:'Email me.'},
 bio:'I study multimodal learning, visual and video understanding, and multimodal agents.',
 about:'I am a PhD researcher at LMU Munich, supervised by Prof. Volker Tresp. My thesis is titled “Promises and Limits of Language-centered Visual Understanding”.',
 personal:'Outside research: plants, travelling, cooking, Crusader Kings III, and my dachshund.',
 contacts:[{label:'Email',href:'mailto:gengyuanmax@gmail.com'},{label:'Scholar',href:'https://scholar.google.com/citations?user=LN2tYr0AAAAJ'},{label:'GitHub',href:'https://github.com/gengyuanmax'},{label:'LinkedIn',href:'https://www.linkedin.com/in/gengyuan-zhang-343542184/'},{label:'CV',href:'/files/Gengyuan_Zhang_CV.pdf'}],
};
export const navigation=[{id:'home',label:'Home',shape:'home'},{id:'research',label:'Research projects',shape:'research'},{id:'artifacts',label:'Artifacts',shape:'artifacts'},{id:'about',label:'About me',shape:'about'}] as const;
export const pillars=[
 {id:'machines',action:'Building',label:'Building',short:'Building',lines:['Building'],detail:'Multimodal intelligent systems',summary:'Building AI models and systems that understand and interact with the visual, multimodal real world.'},
 {id:'benchmarking',action:'Evaluating',label:'Evaluating',short:'Evaluating',lines:['Evaluating'],detail:'Multimodal systems in the wild',summary:'Where are the capability boundaries of evolving multimodal models? Benchmarking and evaluation as a long-term goal.'},
 {id:'applications',action:'Applications',label:'Applications',short:'Applications',lines:['Applications'],detail:'Multimodal intelligence in specialized domains',summary:'Bringing multimodal intelligence into real production in expert domains.'},
] as const;
/** Home "Selected projects" (user, 2026-10-21): projects in this order, not grouped by
 * direction. Order from the user's copy QA (2026-10-21). */
export const selectedProjects=['a','d','b','e','f'] as const;
/** One line per selected project (user copy QA, 2026-10-21). */
export const selectedLines:Record<string,string>={
 a:'Rethinking multi-image representation in multi-image MLLMs.',
 d:'Can generalist agents be trained into specialized surgeons?',
 b:'Semantic event localization with multimodal user queries.',
 e:'Multi-event video retrieval.',
 f:'Ongoing work on online, interactive multimodal systems.',
};
export const sectionCopy={research:'My research spans three directions: building, evaluating and applying multimodal intelligence, told here through its projects.',artifacts:'Artifacts from my research and personal interests: interactive demos, tools, datasets, papers and more.'};
export interface Entry {id:string;title:string;description:string;metadata:string;themes:string[];assetId?:string;links?:ResourceLinks;approval:'pending'|'approved';sources:string[];}
export const mosaicLinks:ResourceLinks={page:'https://gengyuanmax.github.io/Mosaic/',arxiv:'https://arxiv.org/abs/2609.39363',github:'https://github.com/gengyuanmax/Mosaic',model:'https://huggingface.co/gengyuanmax/MosaicAgent-8B',dataset:'https://huggingface.co/datasets/gengyuanmax/MosaicBench'};
export const projects:Record<string,Entry & {primaryTheme:string;publicationId:string;details?:string}>={
 a:{id:'a',title:'Mosaic',description:'An image workspace for multi-image understanding, with ten visual tools, the MosaicBench benchmark, and the reinforcement-learned MosaicAgent-8B.',metadata:'arXiv, 2026',primaryTheme:'benchmarking',themes:researchMemberships.a.map(id=>id==='domain'?'applications':id),publicationId:'mosaic',links:mosaicLinks,sources:['cv','mosaic','mosaic-release'],approval:'pending'},
 b:{id:'b',title:'ICQ',description:'Localizing video events with a reference image and a refinement text.',metadata:'CVPR 2025',primaryTheme:'benchmarking',themes:researchMemberships.b.map(id=>id==='domain'?'applications':id),publicationId:'icq',links:{page:'https://icq-benchmark.github.io/',arxiv:'https://arxiv.org/abs/2406.10079',github:'https://github.com/icq-benchmark/icq-benchmark'},sources:['cv','homepage','icq'],approval:'pending'},
 c:{id:'c',title:'ReEXplore',description:'Retrospective experience replay and hierarchical frontier selection for embodied exploration.',metadata:'EMR Workshop, ECCV 2026',primaryTheme:'applications',themes:researchMemberships.c.map(id=>id==='domain'?'applications':id),publicationId:'reexplore',links:{arxiv:'https://arxiv.org/abs/2511.19033'},sources:['cv','reexplore'],approval:'pending'},
 d:{id:'d',title:'How to Train a Surgeon?',description:'A surgical understanding benchmark and an environment for evaluating tool-using generalist agents.',metadata:'NeurIPS 2026, Accepted (poster)',primaryTheme:'applications',themes:researchMemberships.d.map(id=>id==='domain'?'applications':id),publicationId:'surgeon',links:{page:'https://neurips.cc/virtual/2026/loc/sydney/poster/139078'},sources:['cv','neurips'],approval:'pending'},
 e:{id:'e',title:'Me-Retriever',description:'A video–text retrieval model for videos containing multiple events.',metadata:'ICCV 2023',primaryTheme:'machines',themes:researchMemberships.e.map(id=>id==='domain'?'applications':id),publicationId:'mevtr',links:{arxiv:'https://arxiv.org/abs/2308.11551',github:'https://github.com/gengyuanmax/MeVTR'},sources:['cv','homepage','mevtr'],approval:'pending'},
 f:{id:'f',title:'AViLA',description:'A streaming vision-language agent that handles queries and visual evidence arriving at different times.',metadata:'arXiv, 2025',primaryTheme:'machines',themes:researchMemberships.f.map(id=>id==='domain'?'applications':id),publicationId:'avila',links:{arxiv:'https://arxiv.org/abs/2506.18472'},sources:['cv','avila'],approval:'pending'},
};
export const artifactCategories:Record<string,string>={demo:'Interactive',article:'Paper / Article',library:'Code',dataset:'Dataset'};
export const artifacts:Record<string,Entry & {form:string;publishedAt:string|null;categories:string[];featured?:boolean;previewRatio?:string;dateNote?:string}>={
 a:{id:'a',title:'Print Labs',description:'Four interactive labs for print texture, layout, paper objects, and element composition.',metadata:'4 labs',publishedAt:'2026-10-13',dateNote:'Launch date confirmed by the user on 14 Oct 2026.',categories:['demo'],featured:true,form:'Interactive',themes:[],links:{page:'https://gengyuanmax.github.io/print-labs/index.html',github:'https://github.com/gengyuanmax/print-labs'},sources:['user','print-lab'],approval:'pending'},
 b:{id:'b',title:'Mosaic',description:'MosaicGym image workspace and training code, MosaicAgent-8B model weights, and the MosaicBench evaluation dataset.',metadata:'arXiv, 2026',publishedAt:'2026-09-30',dateNote:'Date retained for the paper; not the code, model, or dataset release date.',categories:['article','library','dataset'],form:'Paper / Code / Model / Dataset',themes:projects.a.themes,links:mosaicLinks,sources:['mosaic','mosaic-release'],approval:'pending'},
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
 {id:'print-labs-2026',date:'13 Oct 2026',text:'I launched a fun product, Print Labs, to visualize how printing can be simulated in codes.',href:'https://gengyuanmax.github.io/print-labs/index.html',sources:['user','print-lab'],approval:'approved',note:'Launch date confirmed by the user on 14 Oct 2026 as yesterday.'},
 {id:'mosaic-2026',date:'30 Sep 2026',text:'Introducing Mosaic, a agentic visual harness for multi-image understanding',href:mosaicLinks.page!,sources:['mosaic','mosaic-release'],approval:'pending'},
 {id:'surgeon-2026',date:'20 Sep 2026',text:'Our paper “How to Train a Surgeon? Benchmarking Generalist Agents in Surgical Scene Understanding” has been accepted to the NeurIPS 2026 Evaluations and Datasets Track.',href:'https://neurips.cc/virtual/2026/loc/sydney/poster/139078',sources:['user','cv','neurips'],approval:'approved',note:'Acceptance date confirmed by the user on 14 Oct 2026.'},
 {id:'reexplore-2026',date:'09 Sep 2026',text:'ReEXplore at the Embodied Multimodal Reasoning Workshop, ECCV 2026.',href:'https://arxiv.org/abs/2511.19033',sources:['user','cv'],approval:'approved',note:'Workshop date confirmed by the user; this is not the acceptance notification date or a claim of personal attendance.'},
 {id:'oxford-2026',date:'16 Mar 2026',text:'I visited the Torr Vision Group at the University of Oxford from 16 Mar to 31 Jul 2026.',href:'https://torrvision.com/',sources:['user','cv'],approval:'approved',note:'Full visit dates confirmed by the user; ordered by the start date.'},
 {id:'funding-2025',date:'Dec 2025',text:'Secured €115,000 in Software Campus funding to lead a research project on intelligent agents for surgical video understanding.',href:'https://softwarecampus.de/',sources:['user','homepage','cv'],approval:'pending',note:'The user confirmed €115,000 and December 2025. Month precision is intentional; no exact day is claimed.'},
 {id:"amazon-2025",date:"07 Apr 2025",text:"I start my internship @Amazon London!",href:"#about-experience",sources:['legacy-news'],approval:'approved'},
 {id:"worldmodel-2025",date:"05 Mar 2025",text:"One paper accepted by ICLR 2025 Workshop World Model.",href:"https://arxiv.org/abs/2502.15457",sources:['legacy-news'],approval:'approved'},
 {id:"cvpr-2025",date:"26 Feb 2025",text:"Two papers accepted at CVPR2025! See you in Nashville.",href:"#publications",sources:['legacy-news'],approval:'approved'},
 {id:"memory-2025",date:"20 Feb 2025",text:"Our new paper is now on arXiv: Memory Helps, but Confabulation Misleads: Understanding Streaming Events in Videos with MLLMs!",href:"https://arxiv.org/abs/2502.15457",sources:['legacy-news'],approval:'approved'},
 {id:"wacv-2025",date:"28 Oct 2024",text:"One new paper is accepted by WACV 2025, Tuscon, Arizona!",href:"#publications",sources:['legacy-news'],approval:'approved'},
 {id:"icq-2024",date:"17 Jun 2024",text:"Our new paper is now on arXiv: Localizing Events in Videos with Multimodal Queries!",href:"https://arxiv.org/pdf/2406.10079",sources:['legacy-news'],approval:'approved'},
 {id:"spot-2023",date:"27 Nov 2023",text:"1 new paper is now on arXiv: SPOT! Revisiting Video-Language Models for Event Understanding!",href:"https://arxiv.org/abs/2311.12919",sources:['legacy-news'],approval:'approved'},
 {id:"wacv-2024",date:"24 Oct 2023",text:"1 Paper accepted at WACV 2024!",href:"https://wacv2024.thecvf.com/",sources:['legacy-news'],approval:'approved'},
 {id:"iccv-2023",date:"01 Jul 2023",text:"1 Paper accepted at ICCV 2023!",href:"https://iccv2023.thecvf.com/",sources:['legacy-news'],approval:'approved'},
 {id:"phd-2021",date:"01 Oct 2021",text:"I started my PhD at LMU.",href:"#about-education",sources:['legacy-news'],approval:'approved'},
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
