/** A failed or superseded preparation never replaces the last completed frame.
 * The host owns resource readiness; this gate owns publication and cache identity. */
export function createPrintMount(){
 let generation=0,completed:string|undefined;
 return {
  begin(key:string){
   const ticket=++generation;
   if(key===completed)return null;
   return {current:()=>ticket===generation,commit(publish:()=>void){
    if(ticket!==generation)return false;
    publish();completed=key;return true;
   }};
  },
  invalidate(){generation++;completed=undefined;},
 };
}
