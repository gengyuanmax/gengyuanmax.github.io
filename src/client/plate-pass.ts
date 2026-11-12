/** Shared plate-pass timing (user, 2026-11-10/12): a printed object appears one ink pass at a
 * time, light to dark, each pass revealed along the paper feed in stepped frames. The last
 * sheet is always the finished print, so the end state equals the static page. Only reveals
 * here: screening, noise and compositing stay in the print pipeline. */
export const PASS=300,STAGGER=380;
/** Ink order of passes: yellow, vermilion, blue, dark (light to dark). */
export const passOrder=['c','a','b','d'] as const;
export function printMotionOn(root:HTMLElement){
 return root.dataset.printMotion==='press'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&'animate' in root&&'IntersectionObserver' in window;
}
/** Reveal stacked sheets in order (each covers the previous one). Resolves when done or cancelled. */
export function passReveal(sheets:HTMLElement[]){
 const running=sheets.map((sheet,i)=>sheet.animate([{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}],
  {duration:PASS,delay:i*STAGGER,easing:'steps(10,end)',fill:'both'}));
 const finished=Promise.all(running.map(a=>a.finished)).then(()=>undefined,()=>undefined);
 return {finished,cancel:()=>running.forEach(a=>a.cancel())};
}
/** Paper objects (inserted sheets) are laid down one after another, each dropping a few px
 * into place in two stepped frames. Only `translate`, so each sheet's own transform stays. */
export function layDown(sheets:HTMLElement[],gap=150){
 const running=sheets.map((sheet,i)=>sheet.animate([{translate:'0 -14px',visibility:'hidden'},{translate:'0 -14px',visibility:'visible',offset:.01},{translate:'0 0',visibility:'visible'}],
  {duration:180,delay:i*gap,easing:'steps(2,end)',fill:'both'}));
 return {finished:Promise.all(running.map(a=>a.finished)).then(()=>undefined,()=>undefined),cancel:()=>running.forEach(a=>a.cancel())};
}
/** Play `start` once, the first time `el` is at least 30% on screen. */
export function onFirstView(el:Element,start:()=>void){
 const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();start();}},{threshold:.3});
 io.observe(el);return ()=>io.disconnect();
}
