/** Poster / Compact reading modes (user, 2026-10-15). The boot script in Base.astro picks
 * the mode before first paint; this only handles the switch and remembers the choice.
 * Layout observers (print masks, reading tree, printed rules) follow the new layout. */
const root=document.querySelector<HTMLElement>('#personal-site');
if(root){
 const buttons=[...root.querySelectorAll<HTMLButtonElement>('[data-reading-choice]')];
 const sync=()=>buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readingChoice===root.dataset.reading)));
 buttons.forEach(b=>b.addEventListener('click',()=>{
  const mode=b.dataset.readingChoice!;if(root.dataset.reading===mode)return;
  root.dataset.reading=mode;try{localStorage.setItem('reading-mode',mode);}catch{}
  sync();root.dispatchEvent(new CustomEvent('reading:layout'));
 }));
 sync();
}
export {};
