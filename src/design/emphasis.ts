/** Solid SVG dots, not a translucent band. Tint each dot to protect blue type. */
const rgb=(hex:string)=>hex.slice(1).match(/../g)!.map(v=>parseInt(v,16));
const hex=(c:number[])=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const luminance=(color:string)=>rgb(color).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
export function contrastRatio(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function emphasisMaterial(p:{primary:string;secondary:string;paper:string},pitch=3.5,coverage=.23){
 const paper=rgb(p.paper),orange=rgb(p.secondary);
 // Keep the site's blue; reserve contrast headroom for the shared paper.
 let amount=.3,tint=p.paper;
 while(amount>=0){tint=hex(paper.map((v,i)=>v+(orange[i]-v)*amount));if(contrastRatio(p.primary,tint)>=5.3)break;amount-=.01;}
 const radius=pitch*Math.sqrt(coverage/Math.PI),tile=pitch*Math.SQRT2;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><pattern id="dots" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${pitch/2}" cy="${pitch/2}" r="${radius}" fill="${tint}"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>`;
 return {tint,paperContrast:contrastRatio(p.primary,p.paper),dotContrast:contrastRatio(p.primary,tint),tile,image:`url("data:image/svg+xml,${encodeURIComponent(svg)}")`};
}
