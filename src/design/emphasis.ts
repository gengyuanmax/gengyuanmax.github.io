/** Solid SVG dots, not a translucent band. Tint each dot to protect blue type. */
const rgb=(hex:string)=>hex.slice(1).match(/../g)!.map(v=>parseInt(v,16));
const hex=(c:number[])=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const luminance=(color:string)=>rgb(color).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
export function contrastRatio(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
/** Body emphasis band (user, 2026-10-21: denser and deeper so it reads). Fine-tier dots
 * (2px) in a deep vermilion tint at the vermilion screen angle. Legibility is judged the
 * way a reader sees a halftone: by the band's average colour (paper + coverage × dot),
 * which must keep the blue text at ≥ 4.5:1, also under the paper texture; coverage is lowered until it does. */
export function emphasisMaterial(p:{primary:string;secondary:string;paper:string},pitch=2,coverage=.5,angle=15,depth=.85){
 const paper=rgb(p.paper),orange=rgb(p.secondary);
 const tint=hex(paper.map((v,i)=>v+(orange[i]-v)*depth));
 const mix=(c:number)=>hex(paper.map((v,i)=>v+(rgb(tint)[i]-v)*c));
 // Also under the shared paper texture (up to 8% darker on text and band alike).
 const under=(c:string)=>hex(rgb(c).map(v=>v*.92));
 const ok=(c:number)=>contrastRatio(p.primary,mix(c))>=4.5&&contrastRatio(under(p.primary),under(mix(c)))>=4.5;
 let cover=coverage;while(cover>.1&&!ok(cover))cover-=.01;
 const radius=pitch*Math.sqrt(cover/Math.PI),tile=pitch;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><pattern id="dots" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><circle cx="${pitch/2}" cy="${pitch/2}" r="${radius.toFixed(3)}" fill="${tint}"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>`;
 return {tint,coverage:cover,average:mix(cover),paperContrast:contrastRatio(p.primary,p.paper),bandContrast:contrastRatio(p.primary,mix(cover)),tile,image:`url("data:image/svg+xml,${encodeURIComponent(svg)}")`};
}
