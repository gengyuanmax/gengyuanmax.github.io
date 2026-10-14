import type {Settings} from './settings';
// A seeded field along the actual portrait-to-News turn, thinning toward the text.
export function bridgeMarkup(s:Settings){
 const original=1000-s.portraitSpan/12*500;
 // The portrait shrinks toward its start edge, then moves inward by at most
 // 0.6 of a column. Follow its new centre instead of leaving the cue behind.
 const shrink=(1-s.homeScale)*s.portraitSpan/12*500;
 const interlock=s.homeComposition==='interlock',compactSpan=interlock?4:s.portraitSpan;
 const compact=1000-compactSpan/12*500;
 const wide=original-shrink-(interlock?1000/12+(1-s.homeScale)*2000/12:0);
 const medium=compact-(1-s.homeScale)*compactSpan/12*500;
 return `<g class="he-cue-wide">${drawBridge(s,wide)}</g><g class="he-cue-compact"><g class="he-cue-medium">${drawBridge(s,medium)}</g><g class="he-cue-narrow">${drawBridge(s,compact)}</g></g>`;
}
function drawBridge(s:Settings,anchor:number){
 const knee=Math.min(anchor-50,1000-s.cueReach*10);
 const path=`M${anchor.toFixed(2)} -20Q${anchor.toFixed(2)} 75 ${knee.toFixed(2)} 75H20`;
 let random=s.seed>>>0;
 const next=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
 const dots:string[]=[];
 for(let x=20;x<anchor;x+=s.cuePitch){
  const t=(x-20)/(anchor-20),bend=Math.max(0,(x-knee)/(anchor-knee));
  const center=75-95*bend*bend,band=s.cueThickness*(.8+.7*t);
  for(let offset=-band;offset<=band;offset+=s.cuePitch){
   const density=(.15+.85*t)*(1-Math.abs(offset)/(band+s.cuePitch));
   if(next()>density)continue;
   const radius=s.cueDot*(.5+.5*t),opacity=.25+.75*t;
   dots.push(`<circle cx="${x.toFixed(2)}" cy="${(center+offset).toFixed(2)}" r="${radius.toFixed(2)}" opacity="${opacity.toFixed(2)}"/>`);
  }
 }
 const marks=`<g class="he-cue-dots">${dots.join('')}</g><path class="he-cue-ink" d="${path}"/>`;
 return `<g class="he-bridge-a">${marks}</g><g class="he-bridge-b">${marks}</g>`;
}
