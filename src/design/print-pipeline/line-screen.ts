import {rng,salt,valueNoise} from './noise.ts';
/** Screen geometries share one engraving: straight lines (Research), a diamond knurl of two
 * crossing passes (Artifacts) and a wave screen (About). 'line' is the original recipe. */
export type LineTexture='line'|'knurl'|'wave';
/** Local finish presets; do not raise the page-wide image/text noise budget. */
export const lineFinishes={
 original:{edgeGain:1,widthVariation:.25,dryGain:1},
 rubbed:{edgeGain:2.4,widthVariation:.65,dryGain:2.4},
} as const;
export type LineFinish=keyof typeof lineFinishes;
/** Seeded, hard-edged line engraving. A repeat spans many screen cells so each
 * line has independent pressure, ragged edges and occasional dry ink breaks. */
export function lineScreen(pitch:number,angle:number,coverage:number,seed:number,grain:number,starvation:number,id="chapter",texture:LineTexture='line',finish:LineFinish='original'):string {
 const prefix=id.replace(/[^a-zA-Z0-9_-]/g,'-');
 const treatment=lineFinishes[finish];
 const period=pitch,tile=128,rows=8,height=period*rows;
 const random=rng(salt(seed,'navigation-line-v2')),pressure=valueNoise(salt(seed,'navigation-pressure'),12);
 const knurl=texture==='knurl',rough=(.15+Math.min(.2,grain)*2)*treatment.edgeGain,half=period*coverage/(knurl?3.2:2),paths:string[]=[];
 // Eight whole waves across the tile keep the roll seamless at the repeat.
 const wave=(x:number)=>texture==='wave'?Math.sin(2*Math.PI*8*x/tile)*period*.6:0;
 const fmt=(v:number)=>v.toFixed(2);
 for(let row=0;row<rows;row++){
  const top:string[]=[],bottom:string[]=[];
  const flush=()=>{if(top.length>1)paths.push(`M${top.join('L')}L${bottom.reverse().join('L')}Z`);top.length=0;bottom.length=0;};
  let dry=0;
  for(let x=0;x<=tile;x++){
   if(!dry&&x>2&&x<tile-3&&random()<Math.min(.04,starvation*.12*treatment.dryGain))dry=1+Math.floor(random()*3);
   if(dry){flush();dry--;continue;}
   // Periodic low-frequency field keeps the repeated tile join continuous.
   const taper=Math.sin(Math.PI*x/tile);
   const field=(y:number)=>pressure(x,y)*(1-x/tile)+pressure(x-tile,y)*(x/tile);
   const bend=(field(row*19)-.5)*1.2;
   const width=finish==='original'?half*(.75+field(row*19+9)*.5):half*(1+(field(row*19+9)*2-1)*treatment.widthVariation);
   const center=row*period+period/2+bend+wave(x);
   const upper=(random()-.5)*rough*2*taper,lower=(random()-.5)*rough*2*taper;
   // Keep a narrow ink bridge at irregular edges; deliberate dry breaks above
   // are the only full interruptions. No outer silhouette or blurred edge.
   top.push(`${x},${fmt(center-width+(finish==='original'?upper:Math.min(width*.85,upper)))}`);
   bottom.push(`${x},${fmt(center+width+(finish==='original'?lower:Math.max(-width*.85,lower)))}`);
  }
  flush();
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true"><defs><pattern id="${prefix}-line-screen" patternUnits="userSpaceOnUse" width="${tile}" height="${height}" patternTransform="rotate(${angle})"><path d="${paths.join('')}" fill="currentColor"/></pattern>${knurl?`<pattern id="${prefix}-line-cross" href="#${prefix}-line-screen" patternTransform="rotate(${angle-60})"/>`:''}</defs><rect width="100%" height="100%" fill="url(#${prefix}-line-screen)"/>${knurl?`<rect width="100%" height="100%" fill="url(#${prefix}-line-cross)"/>`:''}</svg>`;
}
