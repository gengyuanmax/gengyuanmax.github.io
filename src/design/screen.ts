/** A finite screen scale. a = vermilion, b = blue throughout the print pipeline.
 * The em tier follows type; actual rendering snaps its pitch to whole CSS px.
 * Pixel alignment reduces sampling variation; it cannot eliminate moiré at all
 * zoom levels, DPRs, or scaled previews. All current production screens use AM. */
export const screenScale = {fine:2,medium:4,coarseEm:1/16} as const;
export type ScreenLevel = 'fine'|'medium'|'coarse';
export type ScreenInk = 'a'|'b';
export type ScreenShape = 'round'|'square';
export interface ScreenSettings {primaryAngle:number;secondaryAngle:number;primaryDotShape:string;secondaryDotShape:string;}
export function screen(level:ScreenLevel,ink:ScreenInk,s:ScreenSettings,fontSize=128){
 const pitch=level==='coarse'?Math.max(2,Math.round(fontSize*screenScale.coarseEm)):screenScale[level];
 return {level,pitch,method:'am' as const,angle:ink==='a'?s.secondaryAngle:s.primaryAngle,
  shape:(ink==='a'?s.secondaryDotShape:s.primaryDotShape) as ScreenShape};
}
/** Display lettering keeps its screened identity at every viewport. Once the
 * em tier approaches the image tier, reuse fine rather than inventing a fourth
 * frequency or replacing the screened plate with a solid one. */
export function typeScreenLevel(fontSize:number):ScreenLevel|null{
 if(fontSize<=16)return null;
 return Math.round(fontSize*screenScale.coarseEm)>=screenScale.medium*1.5?'coarse':'fine';
}
export function screenTokens(s:ScreenSettings){
 return {'--screen-fine':`${screenScale.fine}px`,'--screen-medium':`${screenScale.medium}px`,'--screen-coarse':`${screenScale.coarseEm}em`,
  '--screen-angle-a':`${s.secondaryAngle}deg`,'--screen-angle-b':`${s.primaryAngle}deg`,
  '--screen-shape-a':s.secondaryDotShape,'--screen-shape-b':s.primaryDotShape};
}
