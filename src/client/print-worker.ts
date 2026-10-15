/// <reference lib="webworker" />
import {runMaskJob,runFieldJob,type MaskJob,type FieldJob} from '../design/print-pipeline/index';
/** Off-main-thread printing: the page measures and commits, this worker computes. */
self.onmessage=(e:MessageEvent<{id:number;job:MaskJob|FieldJob}>)=>{
 const {id,job}=e.data;
 try{
  if(job.kind==='mask'){const r=runMaskJob(job);const t=[r.png.buffer,...(r.tone?[r.tone.buffer]:[]),...(r.screened?[r.screened.buffer]:[])];(self as unknown as Worker).postMessage({id,result:r},t as Transferable[]);}
  else{const r=runFieldJob(job);(self as unknown as Worker).postMessage({id,result:r},[r.pixels.buffer,...r.tones.map(t=>t.buffer),...r.screens.map(t=>t.buffer)] as Transferable[]);}
 }catch(error){(self as unknown as Worker).postMessage({id,error:String(error)});}
};
export {};
