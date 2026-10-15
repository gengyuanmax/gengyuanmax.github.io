import {runMaskJob,runFieldJob,type MaskJob,type FieldJob,type MaskResult,type FieldResult} from '../design/print-pipeline/index';
/** Dispatch print jobs to a small worker pool so the page stays responsive while it
 * prints. Each worker takes one job at a time from a priority queue: illustrations
 * (which stay paper until printed) go before grounds, and grounds before type textures
 * (type already shows its final ink). Falls back to the main thread without workers. */
type Task={job:MaskJob|FieldJob;priority:number;transfer:Transferable[];resolve:(v:unknown)=>void;reject:(e:unknown)=>void};
const queue:Task[]=[];let pool:{worker:Worker;busy:Task|null}[]|null=null;
function workers(){
 if(pool)return pool;
 pool=[];
 try{
  const n=Math.max(1,Math.min(3,(navigator.hardwareConcurrency||2)-1));
  for(let i=0;i<n;i++){
   const slot={worker:new Worker(new URL('./print-worker.ts',import.meta.url),{type:'module'}),busy:null as Task|null};
   slot.worker.onmessage=(e:MessageEvent<{result?:unknown;error?:string}>)=>{const t=slot.busy;slot.busy=null;if(t){e.data.error?t.reject(new Error(e.data.error)):t.resolve(e.data.result);}pump();};
   slot.worker.onerror=()=>{const t=slot.busy;slot.busy=null;if(t)t.reject(new Error('print worker failed'));pump();};
   pool.push(slot);
  }
 }catch{pool=[];}
 return pool;
}
function pump(){
 for(const slot of pool||[]){
  if(slot.busy||!queue.length)continue;
  let best=0;for(let i=1;i<queue.length;i++)if(queue[i].priority>queue[best].priority)best=i;
  const task=queue.splice(best,1)[0];slot.busy=task;slot.worker.postMessage({id:0,job:task.job},task.transfer);
 }
}
function post<T>(job:MaskJob|FieldJob,priority:number,transfer:Transferable[]):Promise<T>{
 if(!workers().length)return Promise.resolve((job.kind==='mask'?runMaskJob(job):runFieldJob(job)) as T);
 return new Promise<T>((resolve,reject)=>{queue.push({job,priority,transfer,resolve:resolve as (v:unknown)=>void,reject});pump();});
}
export const printMask=(job:MaskJob)=>post<MaskResult>(job,job.ground?1:0,[]);
export const printField=(job:FieldJob)=>post<FieldResult>(job,2,job.originals.map(o=>o.coverage.buffer));
