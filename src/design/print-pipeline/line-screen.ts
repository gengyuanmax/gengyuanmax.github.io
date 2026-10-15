import {rng,salt,valueNoise} from './noise.ts';
/** Roller textures share one engraving: straight lines (Research), a diamond knurl of two
 * crossing passes (Artifacts) and a wavy roll (About). 'line' is the original recipe. */
export type LineTexture='line'|'knurl'|'wave';
/** Seeded, hard-edged line engraving. A repeat spans many screen cells so each
 * line has independent pressure, ragged edges and occasional dry ink breaks. */
export function lineScreen(pitch:number,angle:number,coverage:number,seed:number,grain:number,starvation:number,id="chapter",texture:LineTexture='line'):string {
 const prefix=id.replace(/[^a-zA-Z0-9_-]/g,'-');
 const period=pitch,tile=128,rows=8,height=period*rows;
 const random=rng(salt(seed,'navigation-line-v2')),pressure=valueNoise(salt(seed,'navigation-pressure'),12);
 const knurl=texture==='knurl',rough=.15+Math.min(.2,grain)*2,half=period*coverage/(knurl?3.2:2),paths:string[]=[];
 // Two full periods across the tile keep the wave seamless at the repeat.
 const wave=(x:number)=>texture==='wave'?Math.sin(2*Math.PI*2*x/tile)*period*.32:0;
 const fmt=(v:number)=>v.toFixed(2);
 for(let row=0;row<rows;row++){
  const top:string[]=[],bottom:string[]=[];
  const flush=()=>{if(top.length>1)paths.push(`M${top.join('L')}L${bottom.reverse().join('L')}Z`);top.length=0;bottom.length=0;};
  let dry=0;
  for(let x=0;x<=tile;x++){
   if(!dry&&x>2&&x<tile-3&&random()<Math.min(.04,starvation*.12))dry=1+Math.floor(random()*3);
   if(dry){flush();dry--;continue;}
   // Periodic low-frequency field keeps the repeated tile join continuous.
   const taper=Math.sin(Math.PI*x/tile);
   const field=(y:number)=>pressure(x,y)*(1-x/tile)+pressure(x-tile,y)*(x/tile);
   const bend=(field(row*19)-.5)*1.2;
   const width=half*(.75+field(row*19+9)*.5);
   const center=row*period+period/2+bend+wave(x);
   top.push(`${x},${fmt(center-width+(random()-.5)*rough*2*taper)}`);
   bottom.push(`${x},${fmt(center+width+(random()-.5)*rough*2*taper)}`);
  }
  flush();
 }
 // A seeded, inset silhouette prevents the screen from ending at the SVG's
 // rectangular viewport. Normalized coordinates preserve rough edges at any size.
 const edge=rng(salt(seed,'navigation-outline-v3')),outline:string[]=[];
 for(let i=0;i<=32;i++)outline.push(`${(.025+i*.95/32).toFixed(4)},${(.05+edge()*.15).toFixed(4)}`);
 for(let i=1;i<=6;i++)outline.push(`${(.94+edge()*.04).toFixed(4)},${(.16+i*.1).toFixed(4)}`);
 for(let i=32;i>=0;i--)outline.push(`${(.025+i*.95/32).toFixed(4)},${(.80+edge()*.15).toFixed(4)}`);
 for(let i=6;i>=1;i--)outline.push(`${(.02+edge()*.04).toFixed(4)},${(.16+i*.1).toFixed(4)}`);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true"><defs><clipPath id="${prefix}-ink-edge" clipPathUnits="objectBoundingBox"><polygon points="${outline.join(' ')}"/></clipPath><pattern id="${prefix}-line-screen" patternUnits="userSpaceOnUse" width="${tile}" height="${height}" patternTransform="rotate(${angle})"><path d="${paths.join('')}" fill="currentColor"/></pattern>${knurl?`<pattern id="${prefix}-line-cross" href="#${prefix}-line-screen" patternTransform="rotate(${angle-60})"/>`:''}</defs><rect width="100%" height="100%" clip-path="url(#${prefix}-ink-edge)" fill="url(#${prefix}-line-screen)"/>${knurl?`<rect width="100%" height="100%" clip-path="url(#${prefix}-ink-edge)" fill="url(#${prefix}-line-cross)"/>`:''}</svg>`;
}
