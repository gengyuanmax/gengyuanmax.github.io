/** Home landscape (user, 2026-10-21): Max's own photograph of the Wetterstein ridge with
 * his portrait standing in front of it, printed in the two inks. It replaces the
 * portrait-with-circle and the vermilion block. Sources stay out of public/; only the
 * printed result is published (scripts/render-home-landscape.mjs). */
export const homeLandscape={
 mountain:'src/assets/home/mountain.jpg',
 personSource:'public/images/portrait-source-cutout.png',
 output:'/images/home-landscape.png',
 /** Reference size in CSS px (the 1440 canvas content plus bleed), rendered at 2×. */
 width:1360,height:600,scale:2,
 /** Mountain band: bottom part of the sheet, cropped from the source (source px). */
 band:{height:400,source:{left:0,top:320,width:2400,height:706}},
 /** Person placement: height and centre x as fractions of the sheet, standing on the bottom edge. */
 placement:{height:.92,x:.8},
 /** Screen tier for a large photographic print. */
 screen:'medium' as const,displaySize:96,
 /** Reference sheet position (home at 1440). */
 origin:{x:40,y:420},
 /** 'two-ink' (approved) or 'four-ink' (trial, 2026-10-25): plates from design/photo/home_landscape_4c.py. */
 separation:'two-ink' as 'two-ink'|'four-ink',
 fourInkPlates:'src/assets/home/landscape-4c',
 /** Four inks print on the fine tier: the face needs it (as the portrait, 2026-10-14). */
 fourInkScreen:'fine' as const,
};
