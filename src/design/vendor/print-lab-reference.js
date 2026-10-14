// Development-only reference: original Print Lab rendering functions, unmodified.
// gengyuanmax/print-lab e1c9d82 / src/print.html. MIT: licenses/print-lab.txt.
import {rng,lowNoise,spotT,spread,boxBlur} from './print-lab-core.js';
const S=600, noiseCache={};
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);
const ink=c=>({c,white:false}),paper=c=>({c});
const STOCKS=[{id:'explicit',sat:1,tex:0,gain:0,veil:0}];
const desat=(c,k)=>{const l=.299*c[0]+.587*c[1]+.114*c[2];return c.map(v=>l+(v-l)*k);};
const BAYER = (() => { const m=[[0,2],[3,1]]; let M=m; while (M.length<8){ const s=M.length, R=[]; for (let y=0;y<s*2;y++){ R.push([]); for (let x=0;x<s*2;x++){ const q=[[0,2],[3,1]][y>=s?1:0][x>=s?1:0]; R[y].push(4*M[y%s][x%s]+q); } } M=R; } return M; })();
function noises(n){
  if (noiseCache[n]) return noiseCache[n];
  const r = rng(1337), N = n*n;
  const g1 = new Float32Array(N), g2 = new Float32Array(N), fm = new Float32Array(N);
  for (let i=0;i<N;i++){ g1[i]=r(); g2[i]=r(); fm[i]=r(); }
  const la = lowNoise(n,5,r), lb = lowNoise(n,13,r), lc = lowNoise(n,7,r);
  const low = new Float32Array(N), low2 = new Float32Array(N);
  for (let i=0;i<N;i++){ low[i] = la[i]*.65 + lb[i]*.35; low2[i] = lc[i]; }
  const rows = new Float32Array(n), rv = []; for (let i=0;i<=20;i++) rv.push(r());
  for (let y=0;y<n;y++){ const f=y/n*20, i=Math.floor(f), t=f-i, s=t*t*(3-2*t); const v=rv[i]+(rv[i+1]-rv[i])*s; rows[y]=Math.min(1,Math.max(0,(v-.5)*2.4+.5)); }
  return noiseCache[n] = {g1,g2,fm,low,low2,rows};
}

function plates(data, n, mode, k, gain, tone){
  const N = n*n, A = new Float32Array(N);
  // tone: black / white point, midtone gamma and posterize act on lightness before the plates are split
  const {black=0, white=1, gamma=1, posterize=0} = tone || {};
  const span = Math.max(.02, white - black);
  const tc = c => { let v = (c - black)/span; v = v<0?0:v>1?1:v; v = Math.pow(v, 1/gamma); if (posterize>1) v = Math.round(v*(posterize-1))/(posterize-1); return v; };
  const B = mode==='mono' ? null : new Float32Array(N);
  const C = mode==='tri' ? new Float32Array(N) : null;
  // contrast, then a dot-gain tone curve that peaks in the midtones
  const f = v => { v = (v-.5)*k+.5; v = v<0?0:v>1?1:v; v += gain*.32*4*v*(1-v); return v>1?1:v; };
  for (let i=0;i<N;i++){
    const r=tc(data[i*4]/255), g=tc(data[i*4+1]/255), b=tc(data[i*4+2]/255);
    const d = 1-(.299*r+.587*g+.114*b);
    if (mode==='mono'){ A[i]=f(d); }
    else if (mode==='sep'){ const cy=1-r; A[i]=f(Math.max(0,(1-g)-cy*.6)); B[i]=f(cy); }
    else if (mode==='tri'){ A[i]=f(1-g); B[i]=f(1-r); C[i]=f((1-b)*.85); }
    else { const v=f(d); A[i]=Math.pow(v,.75); B[i]=Math.pow(v,1.9); }
  }
  return [A,B,C];
}

function inShape(shape, du, dw){
  if (shape==='ellipse') return du*du+dw*dw*2.4<.13;
  if (shape==='diamond') return Math.abs(du)+Math.abs(dw)<.42;
  if (shape==='square') return Math.max(Math.abs(du),Math.abs(dw))<.29;
  return du*du+dw*dw<.105;
}

function hh(a, b){ const v = Math.sin(a*127.1 + b*311.7)*43758.5453; return v - Math.floor(v); }

function erode(m, n, r){
  const N = n*n, h = new Uint8Array(N), v = new Uint8Array(N);
  for (let y=0;y<n;y++){ const row=y*n; for (let x=0;x<n;x++){ let on=1; for (let k=-r;k<=r&&on;k++){ const xx=x+k; if (xx<0||xx>=n||!m[row+xx]) on=0; } h[row+x]=on; } }
  for (let y=0;y<n;y++) for (let x=0;x<n;x++){ let on=1; for (let k=-r;k<=r&&on;k++){ const yy=y+k; if (yy<0||yy>=n||!h[yy*n+x]) on=0; } v[y*n+x]=on; }
  return v;
}

function xeroxDegrade(pl, n, gens, nz){
  let v = pl; const N = n*n;
  for (let g=0; g<gens; g++){
    v = boxBlur(v, n, 1);
    const out = new Float32Array(N), off = g*7717;
    for (let i=0;i<N;i++){
      let t = (v[i]-.5)*1.45 + .5 + .05 + (nz.g1[(i+off)%N]-.5)*.14;
      if (nz.fm[(i*13+off)%N] < .0012*(g+1)) t = 1;                 // toner specks
      out[i] = t<0?0:t>1?1:t;
    }
    v = out;
  }
  return v;
}

function screen(pl, n, type, cell, angDeg, idx, nz, shape, wear = 0){
  const out = new Uint8Array(n*n), TAU = Math.PI*2;
  const a = angDeg*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
  const at = (x,y) => { x=x<0?0:x>=n?n-1:x|0; y=y<0?0:y>=n?n-1:y|0; return pl[y*n+x]; };
  if (type==='am' || type==='line' || type==='hatch'){
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const i=y*n+x, v=pl[i]; if (v<=0) continue;
      const u=(x*c+y*s)/cell, w=(-x*s+y*c)/cell;
      let on;
      if (type==='am'){ on = v > spotT(shape, u, w); }
      else if (type==='line'){ on = v > (1-Math.cos(TAU*w))/2; }
      else { const t1=(1-Math.cos(TAU*w))/2, t2=(1-Math.cos(TAU*u))/2; on = Math.min(1,v*1.7)>t1*.95+.03 || (v>.42 && (v-.42)/.58*1.1>t2); }
      out[i]=on?1:0;
    }
    return out;
  }
  if (type==='benday'){
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const u=(x*c+y*s)/cell, w=(-x*s+y*c)/cell, iu=Math.floor(u), iw=Math.floor(w);
      const cu=iu+.5, cw=iw+.5, px=(cu*c-cw*s)*cell, py=(cu*s+cw*c)*cell, vc=at(px,py);
      const du=u-cu, dw=w-cw;
      out[y*n+x] = vc>.78 ? 1 : vc>.2 ? (inShape(shape,du,dw)?1:0) : 0;
    }
    return out;
  }
  if (type==='stamp'){
    // a seal: the image inside a square face with a frame; relief, so ink sits on the raised parts
    const N = n*n, bp = boxBlur(pl, n, Math.max(1, Math.round(cell*.25)));
    const in0 = n*.07, in1 = n*.93, fr = Math.max(2, n*.028);
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const i = y*n+x;
      if (x<in0 || x>in1 || y<in0 || y>in1){ out[i] = 0; continue; }
      const edge = x<in0+fr || x>in1-fr || y<in0+fr || y>in1-fr;
      out[i] = edge ? 1 : (bp[i] + (nz.g1[(i+idx*977)%N]-.5)*.08 > .5 ? 1 : 0);
    }
    return out;
  }
  if (type==='rub'){
    // rubbing: dark parts of the image are read as carving (stay paper), the rest takes ink,
    // with dabbed, directional pad texture and fine paper grain
    const N = n*n, bp = boxBlur(pl, n, 1), low = nz.low, g1 = nz.g1;
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const i = y*n+x, h = 1 - bp[i];
      const pad = low[(y*n + (x>>2)) % N], fib = g1[(i*3+idx*131)%N];
      out[i] = (h > .42 + (pad-.5)*.35 && fib > .1 + (1-pad)*.18) ? 1 : 0;
    }
    return out;
  }
  if (type==='silk' || type==='letter' || type==='wood'){
    const N = n*n;
    const rb = type==='wood' ? Math.max(1, Math.round(cell*.12)) : Math.max(1, Math.round(cell*.35));
    const bp = boxBlur(pl, n, rb);
    if (type==='silk'){ const off = idx*977; for (let i=0;i<N;i++) out[i] = bp[i] + (nz.g1[(i+off)%N]-.5)*.07 > .46 ? 1 : 0; }
    else if (type==='letter'){
      // worn wood type: the edge wanders with a slow noise, and small nicks are knocked out near the edges
      const off = idx*7919, low = nz.low, g1 = nz.g1;
      for (let i=0;i<N;i++){ const j = (i + off) % N, t = .5 + wear*(.34*(low[j] - .5) + .12*(g1[j] - .5));
        out[i] = bp[i] > t && !(bp[i] < .82 && g1[(j*7) % N] > 1 - .05*wear) ? 1 : 0; }
    }
    else {
      const low = nz.low, off = idx*7919;
      for (let y=0;y<n;y++) for (let x=0;x<n;x++){
        const i=y*n+x, v=bp[i]; if (v<.1) continue;
        const u=(x*c+y*s)/cell, w=(-x*s+y*c)/cell + (low[(i+off)%N]-.5)*2.4;
        // solid blacks with gouge chips aligned to the cut direction; carved wavy lines in the midtones
        const on = v>.8 ? hh(Math.floor(u*.6)+idx*31, Math.floor(w*2.5)) > .06 : v*1.15 > (1-Math.cos(TAU*w))/2;
        out[i] = on?1:0;
      }
    }
    return out;
  }
  if (type==='thresh'){ for (let i=0;i<n*n;i++) out[i]=pl[i]>.5?1:0; return out; }
  // block-based: bayer, fs, fm
  const b = Math.max(1, Math.round(cell/(type==='fm'?4.5:3.5)));
  const bw = Math.ceil(n/b), bh = bw, bv = new Float32Array(bw*bh);
  for (let by=0;by<bh;by++) for (let bx=0;bx<bw;bx++) bv[by*bw+bx]=at(bx*b+b/2, by*b+b/2);
  const bit = new Uint8Array(bw*bh);
  if (type==='bayer'){
    for (let by=0;by<bh;by++) for (let bx=0;bx<bw;bx++){
      const m = idx===1 ? BAYER[bx%8][by%8] : idx===2 ? BAYER[(by+4)%8][(bx+2)%8] : BAYER[by%8][bx%8];
      bit[by*bw+bx] = bv[by*bw+bx] > (m+.5)/64 ? 1 : 0;
    }
  } else if (type==='fs'){
    for (let by=0;by<bh;by++) for (let bx=0;bx<bw;bx++){
      const i=by*bw+bx, o=bv[i], q=o>.5?1:0, e=o-q; bit[i]=q;
      if (bx+1<bw) bv[i+1]+=e*7/16;
      if (by+1<bh){ if (bx>0) bv[i+bw-1]+=e*3/16; bv[i+bw]+=e*5/16; if (bx+1<bw) bv[i+bw+1]+=e/16; }
    }
  } else {
    const fm = nz.fm, N=fm.length;
    for (let i=0;i<bw*bh;i++) bit[i] = bv[i] > fm[(i*7+idx*104729)%N] ? 1 : 0;
  }
  for (let y=0;y<n;y++){ const by=Math.floor(y/b); for (let x=0;x<n;x++) out[y*n+x]=bit[by*bw+Math.floor(x/b)]; }
  return out;
}

function paperPattern(n, kind, sc){
  if (!kind || kind==='none') return [];
  const N = n*n, step = 22*sc, lw = Math.max(1, .9*sc), m = new Float32Array(N), m2 = new Float32Array(N);
  const near = (v, period, w) => { const f = ((v % period) + period) % period; return f < w || f > period - w*.15; };
  for (let y=0;y<n;y++) for (let x=0;x<n;x++){
    const i = y*n+x;
    if (kind==='grid'){ const bold = near(x, step*5, lw*1.9) || near(y, step*5, lw*1.9); m[i] = bold ? .85 : (near(x, step, lw) || near(y, step, lw)) ? .55 : 0; }
    else if (kind==='dots'){ const dx = ((x % step) + step) % step, dy = ((y % step) + step) % step, rx = Math.min(dx, step-dx), ry = Math.min(dy, step-dy); m[i] = rx*rx + ry*ry < (1.5*sc)*(1.5*sc) ? .75 : 0; }
    else if (kind==='lined'){ m[i] = y > step*2 && near(y, step*1.25, lw) ? .6 : 0; m2[i] = Math.abs(x - n*.14) < lw ? .75 : 0; }
    else if (kind==='ledger'){ m[i] = near(y, step, lw) ? .55 : 0; const cols = [.16,.6,.78]; if (cols.some(c => Math.abs(x - n*c) < lw || Math.abs(x - n*c - 3*sc) < lw)) m[i] = .7; }
    else if (kind==='security'){ const v = Math.sin(x*.55/sc + Math.sin(y*.21/sc)*2.2) + Math.sin((x + y)*.31/sc) + .6*Math.sin((x - y)*.12/sc); m[i] = v > .95 ? .8 : 0; }
  }
  const C = {grid:[.52,.7,.86], dots:[.45,.5,.6], lined:[.5,.68,.86], ledger:[.45,.68,.5], security:[.3,.36,.55]}[kind];
  const out = [[m, C]]; if (kind==='lined') out.push([m2, [.88,.33,.38]]);
  return out;
}

function renderLight(data, n, sc, p, nz, kind){
  const {g1, low, low2} = nz, N = n*n, E = new Float32Array(N);
  for (let i=0;i<N;i++){ const L = (.299*data[i*4] + .587*data[i*4+1] + .114*data[i*4+2])/255; let e = (L - .5)*p.contrast + .5; E[i] = e<0?0:e>1?1:e; }
  const soft = boxBlur(E, n, Math.max(1, Math.round((kind==='gram' ? 2.6 : 1.6)*sc)));
  const PB = [.07,.24,.45], STAIN = [.9,.94,.98], DARK = [.06,.06,.07];
  const pp = kind==='gram' ? [.97,.97,.95] : hex(paper(p.paper).c), r = rng(91), ragged = new Float32Array(n*4).map(() => r());
  const edge = (t, k) => { const a = Math.floor(t), f = t - a; return ragged[(k*n + a) % (n*4)]*(1-f) + ragged[(k*n + a + 1) % (n*4)]*f; };
  for (let y=0;y<n;y++) for (let x=0;x<n;x++){
    const i = y*n+x, e = soft[i];
    let col;
    if (kind==='cyano'){
      // brushed coating: ragged, streaky borders; inside it, exposure turns Prussian blue with a mottled density
      const m = n*.06, w = n*.035;
      const inside = x > m + w*edge(y/6, 0) && x < n - m - w*edge(y/6, 1) && y > m + w*edge(x/6, 2) && y < n - m - w*edge(x/6, 3);
      if (!inside){ const pt = 1 - p.tex*(.1*nz.g2[i] + .08*low2[i]); col = pp.map(v => v*pt); }
      else {
        let d = Math.pow(e, .85) * (.8 + .2*low2[i]) * (1 - p.grain*.35*Math.pow(g1[i], 2)) * (1 - p.starve*.25*low[i]);
        const pt = 1 - p.tex*(.1*nz.g2[i] + .08*low2[i]);
        col = [0,1,2].map(k => (STAIN[k]*(1-d) + PB[k]*d) * pp[k] / Math.max(pp[0],pp[1],pp[2]) * pt);
      }
    } else {
      // photogram on glossy paper with a white easel border; dust leaves tiny white specks
      const b = n*.045, inside = x > b && x < n-b && y > b && y < n-b;
      if (!inside) col = pp;
      else {
        let d = e*e*(3 - 2*e);
        if (g1[i] > .997 - p.grain*.004) d *= .15;
        col = [0,1,2].map(k => pp[k]*(1-d) + DARK[k]*d);
      }
    }
    data[i*4] = col[0]*255; data[i*4+1] = col[1]*255; data[i*4+2] = col[2]*255; data[i*4+3] = 255;
  }
}

function render(canvas, p, srcCanvas){
  const n = canvas.width, sc = n/S, nz = noises(n);
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  ctx.drawImage(srcCanvas, 0, 0, n, n);
  const sd = ctx.getImageData(0,0,n,n), data = sd.data;
  const N = n*n;
  const {g1,g2,low,low2,rows} = nz;
  // paper stock: absorbency adds dot gain and dulls colour; tracing paper veils everything
  const st = STOCKS.find(x => x.id===p.stock) || STOCKS[0];
  const kA = ink(p.inkA), kB = ink(p.inkB), kC = ink(p.inkC);
  const iA = kA.white ? hex(kA.c) : desat(hex(kA.c), st.sat), iB = kB.white ? hex(kB.c) : desat(hex(kB.c), st.sat), iC = kC.white ? hex(kC.c) : desat(hex(kC.c), st.sat);
  let pp = hex(paper(p.paper).c); if (st.veil) pp = pp.map(v => v*(1-st.veil) + .9*st.veil);
  const tex = Math.max(0, Math.min(1, p.tex + st.tex)), gainEff = Math.min(1, p.gain + st.gain);
  const proc = p.process || 'none';
  const eff = proc==='xerox' ? 'thresh' : (proc==='none' ? p.screen : proc);   // a process makes its own marks
  let result = null;
  const patL = paperPattern(n, p.pattern, sc);

  if (p.mode==='trans'){
    // tone → A-to-B transition, made with the chosen technique; B is read at its misregistered position
    const [pa] = plates(data, n, 'mono', p.contrast, gainEff, {black:p.black, white:p.white, gamma:p.gamma, posterize:p.posterize});
    const cell = Math.max(2, p.cell*sc), dx = Math.round(p.mx*sc), dy = Math.round(p.my*sc), id = p.trans || 'am';
    const mA = new Float32Array(N), mB = new Float32Array(N), split = id==='split';
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const i = y*n+x, xs = Math.min(n-1, Math.max(0, x-dx)), ys = Math.min(n-1, Math.max(0, y-dy));
      const [a, b] = transCover(id, x, y, pa[i], x-dx, y-dy, pa[ys*n+xs], cell);
      mA[i] = a; mB[i] = b;
    }
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const i = y*n+x;
      const s = .96*(1 - p.grain*.85*Math.pow(g1[i],1.6))*(1 - p.starve*.92*Math.pow(Math.max(0,(low[i]-.42)/.38),2))*(1 - p.band*.5*rows[y]);
      const pt = 1 - tex*(.08*g2[i] + .06*low2[i]);
      let c0 = pp[0]*pt, c1 = pp[1]*pt, c2 = pp[2]*pt;
      for (let q=0;q<patL.length;q++){ const mm = patL[q][0][i]; if (mm){ const pc = patL[q][1]; c0*=1-mm*(1-pc[0]); c1*=1-mm*(1-pc[1]); c2*=1-mm*(1-pc[2]); } }
      if (split){
        const k0 = Math.min(1, Math.max(0, mB[i] + .03*Math.sin(y/sc*.9))), k = k0*k0*(3-2*k0), ss = s;
        const ck = [iA[0]+(iB[0]-iA[0])*k, iA[1]+(iB[1]-iA[1])*k, iA[2]+(iB[2]-iA[2])*k];
        c0 += (ck[0]*c0 - c0)*ss; c1 += (ck[1]*c1 - c1)*ss; c2 += (ck[2]*c2 - c2)*ss;
      } else {
        const a = mA[i]*s, b = mB[i]*s;
        if (a){ c0*=1-a*(1-iA[0]); c1*=1-a*(1-iA[1]); c2*=1-a*(1-iA[2]); }
        if (b){ c0*=1-b*(1-iB[0]); c1*=1-b*(1-iB[1]); c2*=1-b*(1-iB[2]); }
      }
      data[i*4]=c0*255; data[i*4+1]=c1*255; data[i*4+2]=c2*255; data[i*4+3]=255;
    }
    if (!split){
      // plate view: B shown on its own plate (un-shifted)
      const mB0 = new Float32Array(N); for (let y=0;y<n;y++) for (let x=0;x<n;x++){ const xs = x+dx, ys = y+dy; if (xs>=0&&xs<n&&ys>=0&&ys<n) mB0[y*n+x] = mB[ys*n+xs]; }
      result = {n, masks:[mA, mB0, null], cont: id==='overlap'};
    }
  } else if (proc==='cyano' || proc==='gram'){
    renderLight(data, n, sc, p, nz, proc);
  } else if (p.mode==='grad'){
    // digital gradient map: highlights -> ink A, shadows -> ink B
    for (let i=0;i<N;i++){
      const d = 1-(.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2])/255;
      let v = (d-.5)*p.contrast+.5; v = v<0?0:v>1?1:v;
      const pt = 1 - tex*(.08*g2[i] + .06*low2[i]);
      data[i*4]   = (iA[0]+(iB[0]-iA[0])*v)*pt*255;
      data[i*4+1] = (iA[1]+(iB[1]-iA[1])*v)*pt*255;
      data[i*4+2] = (iA[2]+(iB[2]-iA[2])*v)*pt*255;
      data[i*4+3] = 255;
    }
  } else {
    let [pa, pb, pc] = plates(data, n, p.mode, p.contrast, gainEff, {black:p.black, white:p.white, gamma:p.gamma, posterize:p.posterize});
    const inv = pl => { for (let i=0;i<pl.length;i++) pl[i] = 1-pl[i]; };
    const baiwen = proc==='stamp' && p.stampType==='bai';
    if (p.invA !== baiwen) inv(pa);
    if (pb && (p.invB !== baiwen)) inv(pb);
    if (pc && baiwen) inv(pc);
    if (proc==='xerox' && p.copyGen > 0){ pa = xeroxDegrade(pa, n, p.copyGen, nz); if (pb) pb = xeroxDegrade(pb, n, p.copyGen, nz); if (pc) pc = xeroxDegrade(pc, n, p.copyGen, nz); }
    const cell = Math.max(1.6, p.cell*sc);
    const lineish = eff==='line'||eff==='hatch'||eff==='wood';
    const cont = eff==='cont';
    let mA, mB, mC;
    if (cont){ mA = pa; mB = pb; mC = pc; }
    else {
      mA = screen(pa, n, eff, cell, p.angle, 0, nz, p.shape, p.wear);
      mB = pb ? screen(pb, n, eff, cell, p.angle + (lineish?45:30), 1, nz, p.shape, p.wear) : null;
      mC = pc ? screen(pc, n, eff, cell, p.angle + (lineish?90:60), 2, nz, p.shape, p.wear) : null;
      if (gainEff > .02){
        const r = Math.max(1, Math.round(gainEff*2.5*sc)), amt = .3 + .6*gainEff;
        spread(mA, n, r, g2, amt, 0);
        if (mB) spread(mB, n, r, g2, amt, 7919);
        if (mC) spread(mC, n, r, g2, amt, 15401);
      }
    }
    result = {n, masks:[mA, mB, mC], cont};
    const letter = eff==='letter', stamp = eff==='stamp', wood = eff==='wood', opaque = p.blend==='opaque';
    let eA, eB, eC;
    if (letter || stamp){ const r = Math.max(1, Math.round(2.5*sc)); eA = erode(mA,n,r); eB = mB && erode(mB,n,r); eC = mC && erode(mC,n,r); }
    const dx = Math.round(p.mx*sc), dy = Math.round(p.my*sc);
    const cdx = Math.round(-p.my*.7*sc), cdy = Math.round(p.mx*.7*sc);
    const strength = (j, y, er, x) => {
      let s = .96;
      s *= 1 - p.grain*.85*Math.pow(g1[j],1.6);
      const l = low[j]; const m = l<.42?0:l>.8?1:(l-.42)/.38; s *= 1 - p.starve*.92*m*m;
      s *= 1 - p.band*.5*rows[y];
      if (er) s *= (.64 + .36*Math.min(1, low2[j]*1.25)) * (.86 + .14*g2[j]);  // relief: mottled interior, full ink at the squeezed rim
      if (wood) s *= .82 + .18*(.5 + .5*Math.sin(y/sc*.5 + low[j]*16));      // wood grain
      if (letter && p.wear){ s *= 1 - p.wear*.26*Math.pow(.5 + .5*Math.sin(x/sc*.3 + low[j]*18 + 3*Math.sin(y/n*5 + x/n*2)), 3);          // the grain of the wood block shows in the solids
        s *= 1 - p.wear*.28*(.5 + .5*Math.sin(y/n*7.3 + x/n*2.1 + 1.7)); }                         // each block takes ink a little differently
      if (stamp){ const t = (x + y)/(2*n); s *= 1 - .5*Math.max(0, t - .45)/.55; }   // uneven pressure fades one corner
      return s<0?0:s;
    };
    const col = [0,0,0];
    const lay = (ic, s, white) => {
      if (white){ const w = Math.min(1, s*1.2)*.94; col[0]+=(ic[0]-col[0])*w; col[1]+=(ic[1]-col[1])*w; col[2]+=(ic[2]-col[2])*w; return; }   // white ink is semi-opaque
      if (opaque){ col[0]+=(ic[0]-col[0])*s; col[1]+=(ic[1]-col[1])*s; col[2]+=(ic[2]-col[2])*s; }
      else { col[0]*=1-s*(1-ic[0]); col[1]*=1-s*(1-ic[1]); col[2]*=1-s*(1-ic[2]); }
    };
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const i = y*n+x;
      let pt = 1 - tex*(.08*g2[i] + .06*low2[i]);
      if (letter && !mA[i]){ // impression into the paper: shadow on one side of each inked edge, highlight on the other
        const o = Math.max(1, Math.round((1 + p.wear*1.5)*sc));
        if (x>=o && y>=o && mA[i-o*n-o]) pt *= .9 - .04*p.wear; else if (x<n-o && y<n-o && mA[i+o*n+o]) pt *= 1.03;
      }
      col[0]=Math.min(1,pp[0]*pt); col[1]=Math.min(1,pp[1]*pt); col[2]=Math.min(1,pp[2]*pt);
      for (let q=0;q<patL.length;q++){ const mm = patL[q][0][i]; if (mm){ const pc = patL[q][1]; col[0]*=1-mm*(1-pc[0]); col[1]*=1-mm*(1-pc[1]); col[2]*=1-mm*(1-pc[2]); } }
      const a = mA[i]; if (a) lay(iA, strength(i, y, (letter||stamp) && eA[i], x) * a, kA.white);
      if (mB){ const xs=x-dx, ys=y-dy;
        if (xs>=0&&xs<n&&ys>=0&&ys<n){ const j=ys*n+xs, b=mB[j]; if (b) lay(iB, strength(N-1-i, ys, (letter||stamp) && eB[j], xs) * b, kB.white); } }
      if (mC){ const xs=x-cdx, ys=y-cdy;
        if (xs>=0&&xs<n&&ys>=0&&ys<n){ const j=ys*n+xs, c=mC[j]; if (c) lay(iC, strength((i+(N>>1))%N, ys, (letter||stamp) && eC[j], xs) * c, kC.white); } }
      data[i*4]=col[0]*255; data[i*4+1]=col[1]*255; data[i*4+2]=col[2]*255; data[i*4+3]=255;
    }
  }
  ageing(data, n, p, nz, sc, pp);
  const ca = Math.round(p.ca*sc);
  if (ca > 0){
    const src = new Uint8ClampedArray(data);
    for (let y=0;y<n;y++) for (let x=0;x<n;x++){
      const i=(y*n+x)*4, xr=Math.max(0,x-ca), xb=Math.min(n-1,x+ca);
      data[i] = src[(y*n+xr)*4];
      data[i+2] = src[(y*n+xb)*4+2];
    }
  }
  ctx.putImageData(sd,0,0);
  return result;
}

function ageing(data, n, p, nz, sc, pp){
  const folds = p.fold==='quarter' ? [['v', n/2], ['h', n/2]] : p.fold==='half' ? [['v', n/2]] : [];
  if (!p.age && !p.fox && !folds.length) return;
  const N = n*n, low = nz.low, g1 = nz.g1, r = rng(31), Y = [1, .9, .7], BR = [.66, .48, .32], fw = Math.max(2, 3*sc);
  const spot = new Float32Array(N);
  for (let k=0, ns=Math.round(p.fox*70); k<ns; k++){
    const cx = r()*n, cy = r()*n, rad = (1 + r()*5)*sc, a = .35 + .65*r(), R = Math.ceil(rad*2);
    for (let y=Math.max(0, Math.floor(cy-R)); y<Math.min(n, cy+R); y++) for (let x=Math.max(0, Math.floor(cx-R)); x<Math.min(n, cx+R); x++){
      const d = Math.hypot(x-cx, y-cy)/rad; if (d < 2){ const i = y*n+x, v = a*(1 - d*d/4)*(.6 + .4*g1[i]); if (v > spot[i]) spot[i] = v; } }
  }
  for (let y=0;y<n;y++) for (let x=0;x<n;x++){
    const i = y*n+x, o = i*4; let c0 = data[o]/255, c1 = data[o+1]/255, c2 = data[o+2]/255;
    for (const [d, pos] of folds){
      const t = (d==='v' ? x : y) - pos, at = Math.abs(t);
      if (at < fw*.7 && g1[(i*13) % N] > .4){ c0 += (pp[0]-c0)*.75; c1 += (pp[1]-c1)*.75; c2 += (pp[2]-c2)*.75; }   // the ink layer cracks
      if (at < fw*3){ const f = 1 + (t < 0 ? -.1 : .05)*(1 - at/(fw*3)); c0 *= f; c1 *= f; c2 *= f; }                // one side of the crease in shade
    }
    const ed = Math.min(x, y, n-1-x, n-1-y)/n, edge = Math.max(0, 1 - ed/.1);
    const ya = Math.min(1, p.age*(.7 + .3*low[i]) + p.fox*.6*edge*edge*(.5 + .5*low[(i*3) % N]));
    if (ya > 0){ c0 *= 1 - ya*(1-Y[0]); c1 *= 1 - ya*(1-Y[1]); c2 *= 1 - ya*(1-Y[2]); }
    const sm = spot[i]; if (sm > 0){ c0 *= 1 - sm*(1-BR[0]); c1 *= 1 - sm*(1-BR[1]); c2 *= 1 - sm*(1-BR[2]); }
    data[o] = Math.min(255, c0*255); data[o+1] = Math.min(255, c1*255); data[o+2] = Math.min(255, c2*255);
  }
}
export {render};
