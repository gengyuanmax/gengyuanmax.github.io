/* Müller-Brockmann row rhythm (user, 2026-10-15).
 * Every vertical dimension in the site's stylesheets is a whole number of rows
 * (--baseline, 8px): line-heights, vertical margins/paddings/gaps and block heights.
 * Authors keep writing the proportions they mean (1.65, 18px …); this pass rounds
 * them to the row at build time, so a module's height, and therefore the top of the
 * next module, always lands on a row line. Borders do not consume rows: a rule that
 * draws a top/bottom border gives the same width back in its margin.
 * Opt out per declaration with a trailing comment containing "rhythm:off". */
const ROW='var(--baseline, 8px)';
const q=v=>`round(nearest, ${v}, ${ROW})`;
const KEYWORD=/^(normal|inherit|initial|unset|revert|revert-layer|auto|none|0|0px|fit-content|max-content|min-content)$/;
const NUMBER=/^-?(\d+\.?\d*|\.\d+)$/;

/** A line-height becomes a whole number of rows (at least one). */
export function lineHeight(v){
 v=v.trim();
 if(KEYWORD.test(v)||v.includes('round('))return v;
 const important=v.endsWith('!important');if(important)v=v.slice(0,-10).trim();
 let out;
 if(NUMBER.test(v)||/^var\(/.test(v))out=`max(${ROW}, ${q(`${v} * 1em`)})`;
 else if(/^(calc|clamp|min|max)\(|^-?[\d.]+(px|em|rem)$/.test(v))out=`max(${ROW}, ${q(v)})`;
 else return important?`${v} !important`:v;
 return important?`${out} !important`:out;
}
/** One vertical length becomes a whole number of rows; keywords and percentages stay. */
export function length(v){
 const t=v.trim();
 if(KEYWORD.test(t)||t.includes('round(')||/%$/.test(t))return v;
 if(/^-?[\d.]+(px|em|rem)$/.test(t)||/^(calc|clamp|min|max)\(/.test(t)||/^var\(/.test(t))return q(t);
 return v;
}
/** Split a value on top-level whitespace (keeps calc(...) etc. intact). */
export function tokens(v){
 const out=[];let depth=0,cur='';
 for(const ch of v){if(ch==='(')depth++;if(ch===')')depth--;if(/\s/.test(ch)&&depth===0){if(cur)out.push(cur);cur='';}else cur+=ch;}
 if(cur)out.push(cur);return out;
}
/** margin/padding shorthand: quantize the top and bottom components only. */
export function boxShorthand(v){
 const important=/!important\s*$/.test(v);const t=tokens(v.replace(/!important\s*$/,'').trim());
 if(t.length===1)t.push(t[0]);
 if(t.length===2)t.splice(2,0,t[0]);           // top right bottom
 t[0]=length(t[0]);t[2]=length(t[2]);
 return t.join(' ')+(important?' !important':'');
}
/** font shorthand: quantize the line-height after the slash. */
export function font(v){
 const t=tokens(v);const i=t.findIndex(x=>x.includes('/'));
 if(i<0)return v;
 const [size,...rest]=t[i].split('/');let lh=rest.join('/');
 if(!lh&&t[i+1]){lh=t[i+1];t.splice(i+1,1);}
 t[i]=`${size}/${lineHeight(lh)}`;
 return t.join(' ');
}
const VERTICAL=new Set(['margin-top','margin-bottom','padding-top','padding-bottom','row-gap','min-height','margin-block-start','margin-block-end','padding-block-start','padding-block-end']);
const borderWidth=v=>{const m=tokens(v.replace(/!important/,'')).find(x=>/^[\d.]+px$/.test(x));return m?parseFloat(m):0;};
/* Borders give their width back through the bottom margin, wherever that margin is
 * declared: every bottom margin is stored in --rb-m and written as
 * calc(var(--rb-m) - var(--rb-t) - var(--rb-b)); every rule that draws a top/bottom
 * border records its width in --rb-t/--rb-b and repeats the same margin formula. */
// A top border sits on the row line and is taken out of the padding below it, so the
// content inside still starts on a row; whatever the padding cannot absorb, and the
// bottom border, come out of the bottom margin.
const ABSORB='min(var(--rb-pt), var(--rb-t))';
const GIVE=`calc(var(--rb-m) - var(--rb-t) - var(--rb-b) + ${ABSORB})`;
const PT=`calc(var(--rb-pt) - ${ABSORB})`;
export const properties='@property --rb-pt{syntax:"<length-percentage>";inherits:false;initial-value:0px}@property --rb-m{syntax:"<length-percentage>";inherits:false;initial-value:0px}@property --rb-t{syntax:"<length>";inherits:false;initial-value:0px}@property --rb-b{syntax:"<length>";inherits:false;initial-value:0px}';
const SIDES={top:['border-top','border-top-width'],bottom:['border-bottom','border-bottom-width'],both:['border','border-width','border-block','border-block-width']};
function widths(p,v){
 const t=tokens(v.replace(/!important/,''));const px=x=>/^[\d.]+px$/.test(x)?parseFloat(x):/^(0|none|hidden)$/.test(x)?0:null;
 if(p==='border-width'){const n=t.map(px);if(n.some(x=>x===null))return null;const top=n[0],bottom=n.length>2?n[2]:n[0];return {top,bottom};}
 if(p==='border-block-width'){const n=t.map(px);return {top:n[0]??0,bottom:n[1]??n[0]??0};}
 const w=t.map(px).find(x=>x!==null);const none=t.some(x=>/^(none|hidden|0)$/.test(x));
 const width=none&&!t.some(x=>/^[\d.]*[1-9][\d.]*px$/.test(x))?0:(w??(t.some(x=>/^(thin|medium|thick)$/.test(x))?null:null));
 if(width===null)return null;
 if(SIDES.top.includes(p))return {top:width};if(SIDES.bottom.includes(p))return {bottom:width};return {top:width,bottom:width};
}

export function rhythm(){
 return {postcssPlugin:'mb-row-rhythm',
 Once(root){root.prepend(properties);},
 Rule(rule){
  if(rule.__rhythm)return;rule.__rhythm=true;
  // Only the site; the design desk and review tools keep their own metrics.
  if(!/#personal-site/.test(rule.selector))return;
  let border=false,hasMargin=false,pad=false;
  const add=[];
  rule.each(d=>{
   if(d.type!=='decl')return;
   const raw=d.raws?.value?.raw||'';if(/rhythm:off/.test(raw))return;
   const p=d.prop,val=d.value;
   if(p==='line-height')d.value=lineHeight(val);
   else if(p==='font')d.value=font(val);
   else if((p==='margin-bottom'||p==='margin-block-end')&&!/auto/.test(val)){add.push([d,'--rb-m',length(val)]);d.value=GIVE;hasMargin=true;}
   else if((p==='padding-top'||p==='padding-block-start')){add.push([d,'--rb-pt',length(val)]);d.value=PT;pad=true;}
   else if(VERTICAL.has(p))d.value=length(val);
   else if(p==='height'&&!/^(100%|auto)$/.test(val.trim())){const n=parseFloat(val);if(!(/px$/.test(val.trim())&&n<24))d.value=length(val);}
   else if(p==='margin'&&!/auto/.test(tokens(val)[tokens(val).length>2?2:0])){const t=tokens(val);if(t.length===1)t.push(t[0]);if(t.length===2)t.splice(2,0,t[0]);t[0]=length(t[0]);add.push([d,'--rb-m',length(t[2])]);t[2]=GIVE;d.value=t.join(' ');hasMargin=true;}
   else if(p==='margin-block'&&!/auto/.test(val)){const t=tokens(val);if(t.length===1)t.push(t[0]);t[0]=length(t[0]);add.push([d,'--rb-m',length(t[1])]);t[1]=GIVE;d.value=t.join(' ');hasMargin=true;}
   else if(p==='padding'){const t=tokens(boxShorthand(val));add.push([d,'--rb-pt',t[0]]);t[0]=PT;d.value=t.join(' ');pad=true;}
   else if(p==='padding-block'){const t=tokens(val).map(length);add.push([d,'--rb-pt',t[0]]);t[0]=PT;d.value=t.join(' ');pad=true;}
   else if(p==='gap'){const t=tokens(val);t[0]=length(t[0]);d.value=t.join(' ');}
   // Device pixels snap fractional borders (1.5px draws as 1px at 1×), so the width
   // given back would not match: horizontal rules use whole pixels.
   if(/^border(-top|-bottom|-block)?(-width)?$/.test(p))d.value=d.value.replace(/(^|\s)(\d*\.\d+)px/g,(m,a,n)=>`${a}${Math.max(1,Math.round(+n))}px`);
   if(/^border(-top|-bottom|-block)?(-width)?$/.test(p)){const val=d.value;const w=widths(p,val);if(w){border=true;if('top' in w)add.push([d,'--rb-t',`${w.top}px`]);if('bottom' in w)add.push([d,'--rb-b',`${w.bottom}px`]);}}
  });
  for(const [d,prop,value] of add)d.cloneBefore({prop,value});
  if(border&&!hasMargin)rule.append({prop:'margin-bottom',value:GIVE});
  if(border&&!pad)rule.append({prop:'padding-top',value:PT});
 }};
}
rhythm.postcss=true;
