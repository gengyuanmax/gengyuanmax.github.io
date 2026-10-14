// Originals, recipes, derivatives and placements have separate identities.
export const assets = {
  'portrait-canyon': {
    source: '/images/gengyuan-zhang.jpeg', original: 'assets/img/portrait3.jpeg', owner: 'user',
    sourceHash: '4651d951812703c4e2c065a5279b30015777096447260b8e2d434efad8c068ca',
    width:768, height:1024, recipe:'portrait-print', derivative:'/images/portrait-print.webp',
    alt:'现有峡谷人像的印刷处理试样', approval:'pending',
    previousTrial:'/images/portrait-review.webp', previousTrialProvenance:'imagegen-derived review candidate, not source pixels',
  },
} as const;
export const treatments = { 'portrait-print': { renderer:'print-lab-rgba-v2', area:'home', element:'home-portrait', seed:'inherited from design settings', status:'review' } } as const;
export const placements = { 'home-portrait': { asset:'portrait-canyon', recipe:'portrait-print', area:'home', treatmentOverrides:{} } } as const;

// Reuse the exact pre-existing cutout selected for layout review; no second screening pass.
export const portraitReview = {
 source:'/images/portrait-review.webp',width:1086,height:1448,
 hash:'87c6205351d62220d527be17f6c4a10e3f78410c579c3409aaa4c88df0a6ea18',
 alt:'现有峡谷人像的印刷处理试样',
 provenance:'Existing imagegen-derived transparent Riso candidate from portrait3.jpeg',
 approval:'Framing and pose selected for next layout; final likeness and treatment pending',
} as const;
