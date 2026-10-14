// Verbatim functions from gengyuanmax/print-lab src/print.html
// commit e1c9d82a12508e005e22fac5518b9ae855d76623. MIT: licenses/print-lab.txt.
// Extraction only; no new noise, spot or spreading algorithm.
export function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function lowNoise(n, grid, r){
  const G = grid+1, v = new Float32Array(G*G); for (let i=0;i<v.length;i++) v[i]=r();
  const out = new Float32Array(n*n), sc = grid/n;
  for (let y=0;y<n;y++){ const fy=y*sc, iy=Math.floor(fy), ty=fy-iy, sy=ty*ty*(3-2*ty);
    for (let x=0;x<n;x++){ const fx=x*sc, ix=Math.floor(fx), tx=fx-ix, sx=tx*tx*(3-2*tx);
      const a=v[iy*G+ix], b=v[iy*G+ix+1], c=v[(iy+1)*G+ix], d=v[(iy+1)*G+ix+1];
      out[y*n+x] = (a+(b-a)*sx) + ((c+(d-c)*sx) - (a+(b-a)*sx))*sy; } }
  return out;
}

export function spotT(shape, u, w){
  const fu = u-Math.floor(u)-.5, fw = w-Math.floor(w)-.5, TAU = Math.PI*2;
  if (shape==='ellipse') return 1-(Math.cos(TAU*u)+.55*Math.cos(TAU*w)+1.55)/3.1;
  if (shape==='diamond'){ const s=Math.abs(fu)+Math.abs(fw); return s<=.5 ? 2*s*s : 1-2*(1-s)*(1-s); }
  if (shape==='square'){ const m=Math.max(Math.abs(fu),Math.abs(fw)); return 4*m*m; }
  return 1-(Math.cos(TAU*u)+Math.cos(TAU*w)+2)/4;
}

export function spread(m, n, r, field, amt, off){
  const N = n*n, h = new Uint8Array(N), v = new Uint8Array(N);
  for (let y=0;y<n;y++){ const row=y*n; for (let x=0;x<n;x++){ let on=0; for (let k=-r;k<=r&&!on;k++){ const xx=x+k; if (xx>=0&&xx<n&&m[row+xx]) on=1; } h[row+x]=on; } }
  for (let y=0;y<n;y++) for (let x=0;x<n;x++){ let on=0; for (let k=-r;k<=r&&!on;k++){ const yy=y+k; if (yy>=0&&yy<n&&h[yy*n+x]) on=1; } v[y*n+x]=on; }
  for (let i=0;i<N;i++) if (!m[i] && v[i] && field[(i+off)%N] < amt) m[i]=1;
}

export function boxBlur(src, n, r){
  const tmp = new Float32Array(n*n), out = new Float32Array(n*n), w = 2*r+1, cl = v => v<0?0:v>=n?n-1:v;
  for (let y=0;y<n;y++){ const row=y*n; let acc=0; for (let k=-r;k<=r;k++) acc+=src[row+cl(k)];
    for (let x=0;x<n;x++){ tmp[row+x]=acc/w; acc += src[row+cl(x+r+1)] - src[row+cl(x-r)]; } }
  for (let x=0;x<n;x++){ let acc=0; for (let k=-r;k<=r;k++) acc+=tmp[cl(k)*n+x];
    for (let y=0;y<n;y++){ out[y*n+x]=acc/w; acc += tmp[cl(y+r+1)*n+x] - tmp[cl(y-r)*n+x]; } }
  return out;
}
