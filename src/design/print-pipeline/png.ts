/** Minimal PNG encoder for alpha masks (grey + alpha, 8 bit, zlib "stored" blocks).
 * Encoding in JS avoids the canvas readback that toBlob/toDataURL force on the main
 * thread (seconds for a page of masks on slower GPUs). Output is a valid PNG of
 * w×h pixels whose alpha is `alpha` (0..255) and whose grey is 0. */
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc(bytes:Uint8Array,start:number,end:number){let c=0xffffffff;for(let i=start;i<end;i++)c=crcTable[(c^bytes[i])&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function encodeAlphaPNG(alpha:Uint8Array|Uint8ClampedArray,w:number,h:number){
 const row=1+w*2,raw=row*h,blocks=Math.max(1,Math.ceil(raw/65535)),idat=2+raw+blocks*5+4;
 const size=8+25+(12+idat)+12,out=new Uint8Array(size),view=new DataView(out.buffer);let o=0;
 out.set([137,80,78,71,13,10,26,10],0);o=8;
 const chunk=(type:string,len:number,fill:()=>void)=>{view.setUint32(o,len);o+=4;const s=o;for(let i=0;i<4;i++)out[o++]=type.charCodeAt(i);fill();view.setUint32(o,crc(out,s,o));o+=4;};
 chunk('IHDR',13,()=>{view.setUint32(o,w);view.setUint32(o+4,h);out[o+8]=8;out[o+9]=4;out[o+10]=0;out[o+11]=0;out[o+12]=0;o+=13;});
 // Raw scanlines: filter byte 0, then (grey 0, alpha) per pixel.
 const data=new Uint8Array(raw);for(let y=0;y<h;y++){const r=y*row;for(let x=0;x<w;x++)data[r+2+x*2]=alpha[y*w+x];}
 let a=1,b=0;for(let i=0;i<raw;){const end=Math.min(raw,i+5552);for(;i<end;i++){a+=data[i];b+=a;}a%=65521;b%=65521;}
 chunk('IDAT',idat,()=>{
  out[o++]=0x78;out[o++]=0x01;
  for(let i=0;i<raw;i+=65535){const len=Math.min(65535,raw-i);out[o++]=i+len===raw?1:0;out[o++]=len&255;out[o++]=len>>>8;out[o++]=~len&255;out[o++]=(~len>>>8)&255;out.set(data.subarray(i,i+len),o);o+=len;}
  view.setUint32(o,((b<<16)|a)>>>0);o+=4;
 });
 chunk('IEND',0,()=>{});
 return out;
}
