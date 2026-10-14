const bridge=document.querySelector<HTMLElement>('[data-style-element="home-bridge"]');
if(bridge&&'IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  bridge.dataset.cueRevealed='true';observer.disconnect();
 },{threshold:.3});
 observer.observe(bridge);
}
