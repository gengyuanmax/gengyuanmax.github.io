import {previewStorageKey,previewViewport,currentPreview,defaultPreviewMode} from '../design/preview-state';
import {retiredElements} from '../config/main-version';
import {parameters,resolve,validateConfig,mainDesignConfig,areaIds,elementAreas,applicable,palettes,paletteRoles,getPalette,editorialBounds,activeParameter,type PaletteRole,type DesignConfig,type Key,type Scope,type Area,type Overrides} from '../design/settings';
import {printObjects,printWords,printGrounds} from '../config/print-objects';
const scope=document.querySelector<HTMLSelectElement>('#scope')!;
const target=document.querySelector<HTMLSelectElement>('#target')!;
const form=document.querySelector<HTMLFormElement>('#parameters')!;
const frame=document.querySelector<HTMLIFrameElement>('#preview')!;
const grid=document.querySelector<HTMLInputElement>('#grid')!;
const proof=document.querySelector<HTMLSelectElement>('#proof')!;
const audit=document.querySelector<HTMLInputElement>('#screen-audit')!;
const width=document.querySelector<HTMLSelectElement>('#width')!;width.value=defaultPreviewMode;
const standalone=document.body.dataset.studioView==='preview';
const viewport=document.querySelector<HTMLElement>('.studio-preview')!;
const stage=document.querySelector<HTMLElement>('.studio-stage')!;
const status=document.querySelector<HTMLElement>('#status')!;
const names:Record<string,string>={home:'Home',research:'Research projects',artifacts:'Artifacts',about:'About me','home-name':'Home · 姓名','home-portrait':'Home · 人像','home-bridge':'Home · 几何衔接','research-title':'Research · 标题','artifacts-title':'Artifacts · 标题','about-title':'About · 标题','nav-home':'导航 · Home','nav-research':'导航 · Research','nav-artifacts':'导航 · Artifacts','nav-about':'导航 · About'};
for(const [id,label]of Object.entries({intro:'简介',experience:'Experience',education:'Education',funding:'Funding',reviewing:'Reviewing',outside:'Outside research',contact:'Contact'}))names[`about-${id}`]=`About · ${label} 排版`;
for(const [i,id]of ['a','b','c','d','e'].entries())names[`artifact-${id}`]=`Artifacts · 版位 ${i+1}`;
for(const [id,object]of Object.entries({...printObjects,...printWords,...printGrounds}))names[id]=object.label;
let saved:DesignConfig,draft:DesignConfig;
let timer=0;
let panel='layout';
const layoutGroups=['网格','字体','构图','编排位置','几何'];
const storageKey=previewStorageKey;
let previewHeight=1800;
function fit(){const {width:w,scale}=previewViewport(width.value,viewport.clientWidth,document.documentElement.clientWidth);frame.style.width=`${w}px`;frame.style.height=`${previewHeight}px`;frame.style.transform=`scale(${scale})`;stage.style.width=`${w*scale}px`;stage.style.height=`${previewHeight*scale}px`;const label=`${width.value===defaultPreviewMode||width.value==='1440'?'主版':'适配检查'} ${Math.round(w)}px · 显示 ${Math.round(scale*100)}%${scale<1?' · 网点请用原尺寸检查':''}`;document.querySelector('#preview-scale')!.textContent=label;document.querySelector('#standalone-scale')!.textContent=label;}
new ResizeObserver(fit).observe(viewport);window.addEventListener('resize',fit);
const scopeValue=()=>scope.value as Scope;
const area=()=>scopeValue()==='area'?target.value as Area:scopeValue()==='element'?elementAreas[target.value]:undefined;
const element=()=>scopeValue()==='element'?target.value:undefined;
function layer(create=false):Overrides {
 if(scopeValue()==='global')return draft.global;
 if(scopeValue()==='area'){if(create)draft.areas[target.value as Area]??={};return draft.areas[target.value as Area]||{};}
 if(create)draft.elements[target.value]??={};return draft.elements[target.value]||{};
}
function announce(message:string,error=false){status.textContent=message;status.classList.toggle('error',error);if(standalone)document.querySelector('#view-state')!.textContent=error?message:`当前调整 · ${JSON.stringify(draft)===JSON.stringify(saved)?'已保存':'未保存'} · 公开文案待确认`;}
function send(){document.querySelector<HTMLElement>('#screen-legend')!.hidden=!audit.checked;frame.contentWindow?.postMessage({type:'design:apply',config:draft,proof:proof.value,screenAudit:audit.checked,grid:grid.checked,flow:document.querySelector<HTMLInputElement>('#flow')!.checked},location.origin);}
function remember(){try{sessionStorage.setItem(storageKey,JSON.stringify(draft));}catch{};clearTimeout(timer);timer=window.setTimeout(send,120);}
function sourceLabel(source:string){if(source==='selected')return '已确认主版本';if(source==='default')return '默认值';if(source==='global')return '全局';const [level,id]=source.split(':');return `${level==='area'?'页面':'元素'} · ${names[id]||id}`;}
function placementBounds(){
 const bounds=editorialBounds(draft,target.value);if(!bounds)return;
 const start=document.querySelector<HTMLInputElement>('#control-itemStart'),span=document.querySelector<HTMLInputElement>('#control-itemSpan');
 if(start){start.min=String(bounds.startMin);start.max=String(bounds.startMax);}if(span)span.max=String(bounds.spanMax);
}
function render(){
 form.replaceChildren();const effective=resolve(draft,area(),element());const groups=new Map<string,HTMLFieldSetElement>();
 for(const key of Object.keys(parameters) as Key[]){
  if(!applicable(key,scopeValue(),target.value)||!activeParameter(key,effective.values,scopeValue(),target.value))continue;
  const p=parameters[key];if(layoutGroups.includes(p.group)!==(panel==='layout'))continue;let field=groups.get(p.group);
  if(!field){field=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=p.group;field.append(legend);form.append(field);groups.set(p.group,field);}
  const row=document.createElement('div');row.className='control-row';
  const label=document.createElement('label');label.htmlFor=`control-${key}`;label.append(p.label);
  const output=document.createElement('output');label.append(output);
  let input:HTMLInputElement|HTMLSelectElement;
  if(p.type==='number'){input=document.createElement('input');input.type='range';input.min=String(p.min);input.max=String(p.max);input.step=String(p.step);if(key==='printPitch'&&effective.values.portraitMaterial==='press'){input.min='4';input.max='6';}}
  else {input=document.createElement('select');for(const [id,name] of Object.entries(p.options)){const option=new Option(name,id);input.add(option);}}
  input.id=`control-${key}`;input.value=String(effective.values[key]);
  const meta=document.createElement('div');meta.className='control-meta';const source=document.createElement('span');const reset=document.createElement('button');reset.type='button';reset.textContent=scopeValue()==='global'?'恢复默认':'恢复继承';
  const refresh=()=>{const state=resolve(draft,area(),element());output.value=p.type==='number'?String(state.values[key])+('unit'in p?p.unit:''):'';source.textContent=`来源：${sourceLabel(state.sources[key])}`;reset.disabled=!Object.hasOwn(layer(),key);};
  input.addEventListener('input',()=>{Object.assign(layer(true),{[key]:p.type==='number'?Number(input.value):input.value});refresh();placementBounds();remember();if(key==='palette'||key==='portraitMaterial'||key==='cueStyle'||key==='titleTreatment'){render();document.querySelector<HTMLElement>(`#control-${key}`)?.focus();}announce('未保存更改 · 预览已更新');});
  reset.addEventListener('click',()=>{const old={...layer()};delete layer()[key];try{validateConfig(draft);}catch(error){Object.assign(layer(true),old);announce(`无法单独恢复：${String(error)}。请先为相邻项目留出空间。`,true);return;}render();remember();announce('已恢复继承 · 尚未保存');});
  meta.append(source,reset);row.append(label,input,meta);field.append(row);refresh();
 }
 if(scopeValue()==='global'&&panel==='press'){
  const id=effective.values.palette as keyof typeof palettes;
  const colors=getPalette(draft,id);
  const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='当前色板 · 全局颜色';field.append(legend);form.prepend(field);
  for(const role of (['paper','primary','secondary'] as PaletteRole[])){
   const row=document.createElement('div');row.className='control-row';
   const label=document.createElement('label');label.textContent=paletteRoles[role];label.htmlFor=`ink-${role}`;
   const output=document.createElement('output');output.value=colors[role];label.append(output);
   const input=document.createElement('input');input.type='color';input.id=`ink-${role}`;input.value=colors[role];
   const meta=document.createElement('div');meta.className='control-meta';const reset=document.createElement('button');reset.type='button';reset.textContent='恢复色板默认';reset.disabled=!Object.hasOwn(draft.palettes?.[id]||{},role);
   input.addEventListener('input',()=>{draft.palettes??={};draft.palettes[id]??={};draft.palettes[id]![role]=input.value;output.value=input.value;reset.disabled=false;remember();announce('色板已调整 · 所有引用该色板的元素同步更新');});
   reset.addEventListener('click',()=>{delete draft.palettes?.[id]?.[role];render();remember();});meta.append(reset);row.append(label,input,meta);field.append(row);
  }
 }
 for(const name of [...layoutGroups,'全局风格','纸张','印刷墨层','图像与加网']){const group=groups.get(name);if(group)form.append(group);}
 if(panel==='press'&&effective.values.portraitMaterial==='composition'){const note=document.createElement('p');note.className='studio-help';note.textContent='人像保留已选的圆形叠印构图。加网与材质复用 Print Lab：网距只有三档：字级 1/16em（显示时取整）、图像与几何 4px、平网 2px。全页锁定墨色、每墨网角/点形及 X/Y 错位；这里可局部调整浓度、颗粒、缺墨与网点扩张。';form.append(note);}
 if(panel==='press'&&scopeValue()==='element'&&(target.value==='home-portrait'||Object.hasOwn(printObjects,target.value)||Object.hasOwn(printGrounds,target.value))){
  const button=document.createElement('button');button.type='button';button.textContent='查看／导出加网前影调';
  button.addEventListener('click',()=>frame.contentWindow?.postMessage({type:'design:tone-request',target:target.value},location.origin));
  const proof=document.createElement('div');proof.id='tone-exports';form.prepend(button,proof);
 }
 if(!form.children.length){const p=document.createElement('p');p.className='studio-help';p.textContent='这个对象的调整项在另一个面板。';form.append(p);}
 placementBounds();
}
function targets(){
 document.querySelector<HTMLElement>('#target-label')!.hidden=scopeValue()==='global';
 target.replaceChildren();const ids=scopeValue()==='element'?Object.keys(elementAreas).filter(id=>!retiredElements.has(id)):[...areaIds];
 for(const id of ids)target.add(new Option(names[id]||id,id));
 render();placementBounds();selectArea();
}
function selectArea(){const selected=area();if(selected)frame.contentWindow?.postMessage({type:'design:select-area',area:selected},location.origin);}
document.querySelectorAll<HTMLButtonElement>('[data-panel]').forEach(button=>button.addEventListener('click',()=>{panel=button.dataset.panel!;document.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
scope.addEventListener('change',targets);target.addEventListener('change',()=>{render();placementBounds();selectArea();});grid.addEventListener('change',send);document.querySelector('#flow')!.addEventListener('change',send);
width.addEventListener('change',fit);
document.querySelector<HTMLButtonElement>('#preview-zoom')!.addEventListener('click',event=>{width.value=width.value==='1440'?defaultPreviewMode:'1440';const button=event.currentTarget as HTMLButtonElement;button.textContent=width.value==='1440'?'整幅查看':'原尺寸检查';button.setAttribute('aria-pressed',String(width.value==='1440'));fit();});
document.querySelector('#standalone-preview')!.addEventListener('click',()=>{try{sessionStorage.setItem(storageKey,JSON.stringify(draft));}catch{}});
proof.addEventListener('change',()=>{audit.checked=false;send();});audit.addEventListener('change',()=>{if(audit.checked)proof.value='overprint';send();});
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='design:ready'&&draft){send();selectArea();}if(event.data?.type==='design:preview-size'){const height=Number(event.data.height);if(Number.isFinite(height)&&height>0&&height<30000){previewHeight=height;fit();}}if(event.data?.type==='design:screen-report')document.querySelector('#screen-report')!.textContent=String(event.data.message);if(event.data?.type==='design:error')announce(event.data.message,true);
 if(event.data?.type==='design:tone-output'&&event.data.target===target.value){
  const holder=document.querySelector('#tone-exports');if(!holder)return;holder.replaceChildren();
  for(const proof of event.data.proofs){const img=document.createElement('img');img.src=proof.tone;img.alt=proof.name+' 加网前灰度影调';img.style.width='100%';const link=document.createElement('a');link.textContent='下载 '+proof.name+' PNG';link.href=proof.tone;link.download=proof.name.replaceAll(':','-')+'-tone.png';holder.append(img,link);}
  if(!event.data.proofs.length)holder.textContent='这个对象当前未显示或关闭了底形。请先在预览里显示它。';
 }
});
document.querySelector('#save')!.addEventListener('click',async()=>{
 const button=document.querySelector<HTMLButtonElement>('#save')!;button.disabled=true;
 try{
  validateConfig(draft);const response=await fetch('/__design/config',{method:'POST',headers:{'Content-Type':'application/json','X-Design-Token':document.querySelector<HTMLMetaElement>('meta[name=design-token]')!.content},body:JSON.stringify(draft)});
  const result=await response.json();if(!response.ok)throw new Error(result.error);
  saved=mainDesignConfig(result.config||draft);draft=structuredClone(saved);sessionStorage.removeItem(storageKey);announce('主版本已保存。发布构建时会重新生成静态图片。');
 }catch(error){announce(String(error),true);}finally{button.disabled=false;}
});
document.querySelector('#revert')!.addEventListener('click',()=>{draft=structuredClone(saved);sessionStorage.removeItem(storageKey);render();send();announce('已恢复项目中保存的配置');});
document.querySelector('#export')!.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='design.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
form.addEventListener('submit',e=>e.preventDefault());
try{
 const response=await fetch('/__design/config');if(!response.ok)throw new Error('无法读取项目配置');
 saved=await response.json();validateConfig(saved);saved=mainDesignConfig(saved);draft=structuredClone(saved);
 draft=currentPreview(saved,sessionStorage).config;
 targets();send();announce(JSON.stringify(draft)===JSON.stringify(saved)?'已加载主版本配置':'已恢复本次会话未保存的更改');
}catch(error){announce(String(error),true);}
