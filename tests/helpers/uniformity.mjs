/** Shared glitch metric for every screening profile.
 * Coverage is averaged over blocks a few screen cells wide. `std` is the spread of
 * those block means; `residual` removes each block's 3×3 neighbourhood mean first,
 * so slow, designed ink variation cancels and only block-scale mottle remains. */
export function blockStats(coverage,w,h,block){
 const bw=Math.floor(w/block),bh=Math.floor(h/block),means=new Float64Array(bw*bh);
 for(let by=0;by<bh;by++)for(let bx=0;bx<bw;bx++){let s=0;for(let y=by*block;y<(by+1)*block;y++)for(let x=bx*block;x<(bx+1)*block;x++)s+=coverage[y*w+x];means[by*bw+bx]=s/block/block;}
 const mean=means.reduce((a,v)=>a+v,0)/means.length,std=Math.sqrt(means.reduce((a,v)=>a+(v-mean)**2,0)/means.length);
 const residuals=[];
 for(let by=1;by<bh-1;by++)for(let bx=1;bx<bw-1;bx++){let s=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)s+=means[(by+dy)*bw+bx+dx];residuals.push(means[by*bw+bx]-s/9);}
 const residual=Math.sqrt(residuals.reduce((a,v)=>a+v*v,0)/residuals.length);
 return {mean,std,residual};
}
/** Rasterize polygon-v1 dots (convex polygons in CSS px) to area coverage with 3×3 subsamples. */
export function rasterizeDots(dots,w,h,scale=1){
 const out=new Float32Array(w*h),k=3;
 for(const d of dots){
  const xs=d.points.map(p=>p.x),ys=d.points.map(p=>p.y);
  const x0=Math.max(0,Math.floor(Math.min(...xs)*scale)),x1=Math.min(w-1,Math.ceil(Math.max(...xs)*scale)),y0=Math.max(0,Math.floor(Math.min(...ys)*scale)),y1=Math.min(h-1,Math.ceil(Math.max(...ys)*scale));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let hit=0;
   for(let sy=0;sy<k;sy++)for(let sx=0;sx<k;sx++){const px=(x+(sx+.5)/k)/scale,py=(y+(sy+.5)/k)/scale;let pos=0,neg=0;
    for(let i=0;i<d.points.length;i++){const a=d.points[i],b=d.points[(i+1)%d.points.length],c=(b.x-a.x)*(py-a.y)-(b.y-a.y)*(px-a.x);if(c>0)pos++;else if(c<0)neg++;}
    if(!pos||!neg)hit++;}
   out[y*w+x]=Math.min(1,out[y*w+x]+hit/(k*k));}
 }
 return out;
}
