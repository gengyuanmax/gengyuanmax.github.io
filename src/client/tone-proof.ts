import {grayscaleTone,maskBounds,type ToneBounds} from '../design/tone-field';
type Proof={name:string;tone:Float32Array;screen:Float32Array;width:number;height:number;scale:number;bounds:ToneBounds};
const proofs=new Map<string,Proof>();let requested='';
export function rememberTone(id:string,tone:Float32Array,screen:Float32Array,width:number,height:number,scale:number){
 if(!import.meta.env.DEV)return;
 proofs.set(id,{name:id,tone,screen,width,height,scale,bounds:maskBounds(tone,width,height)});
 if(requested&&id.startsWith(requested))send();
}
function png(values:Float32Array,width:number,height:number,bounds:ToneBounds){
 const canvas=document.createElement('canvas');canvas.width=bounds.width;canvas.height=bounds.height;
 canvas.getContext('2d')!.putImageData(new ImageData(grayscaleTone(values),width,height),-bounds.x,-bounds.y);
 return canvas.toDataURL('image/png');
}
function send(){
 const selected=[...proofs.values()].filter(p=>p.name.startsWith(requested));
 parent.postMessage({type:'design:tone-output',target:requested,proofs:selected.map(p=>({name:p.name,width:p.bounds.width,height:p.bounds.height,sourceOrigin:{x:p.bounds.x,y:p.bounds.y},scale:p.scale,tone:png(p.tone,p.width,p.height,p.bounds),screen:png(p.screen,p.width,p.height,p.bounds)}))},location.origin);
}
if(import.meta.env.DEV)window.addEventListener('message',e=>{
 if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='design:tone-request'||typeof e.data.target!=='string')return;
 requested=e.data.target;send();
});
