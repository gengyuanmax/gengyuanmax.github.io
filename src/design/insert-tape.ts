/** Tape geometry adapted from Print Labs Layout Lab tapeClip(): straight long
 * edges, seeded tears at the two short ends. No lighting or cast shadow. */
export function insertTapes(index:number,seed:number){
 let state=(Math.trunc(seed)+Math.imul(index+1,2654435761))>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const mode=((Math.trunc(seed)%3)+3+index)%3;
 const positions=mode===0?[50]:mode===1?[23,77]:[index%2?76:24];
 return positions.map(position=>{
  const left:string[]=[],right:string[]=[];
  for(let i=0;i<=6;i++){
   const y=(i/6*100).toFixed(1);
   left.push(`${(random()*5).toFixed(1)}% ${y}%`);
   right.unshift(`${(100-random()*5).toFixed(1)}% ${y}%`);
  }
  return `--tape-x:${(position+(random()-.5)*6).toFixed(2)}%;--tape-angle:${((random()-.5)*16).toFixed(2)}deg;--tape-width:${(mode===1?32+random()*5:40+random()*7).toFixed(2)}%;clip-path:polygon(${left.concat(right).join(',')})`;
 });
}
