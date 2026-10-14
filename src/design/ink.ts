import type {Settings} from './settings';
// Layout Lab turbulence fallback. Both effects only thin ink; neither removes
// a patch. Live material masks use Print Lab's smooth noise at device resolution.
export function inkFilter(s:Settings,id:string){
 const grain=Math.min(.08,s.grain),starve=Math.min(.08,s.starvation);
 return `<filter id="${id}" x="-8%" y="-12%" width="116%" height="124%" color-interpolation-filters="sRGB">
 <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${s.seed%97}" result="fine"/>
 <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0"/>
 <feComponentTransfer><feFuncA type="linear" slope="8" intercept="-5.8"/></feComponentTransfer>
 <feComponentTransfer result="fineLoss"><feFuncA type="linear" slope="${grain}"/></feComponentTransfer>
 <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="${s.seed*3%97}"/>
 <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0"/>
 <feComponentTransfer result="patches"><feFuncA type="linear" slope="${starve}"/></feComponentTransfer>
 <feComposite in="SourceGraphic" in2="fineLoss" operator="out" result="ink"/>
 <feComposite in="ink" in2="patches" operator="out"/>
 </filter>`;
}
