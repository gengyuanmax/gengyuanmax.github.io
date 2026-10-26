/** Home landscape (user, 2026-10-21; four inks from 2026-10-26): Max's own photograph of
 * the Wetterstein ridge with his portrait standing in front of it. The separation into
 * ink plates is design/photo/home_landscape_4c.py (sources stay out of public/); the
 * printed result is published by scripts/render-home-landscape.mjs. */
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
 /** Landscape screen: medium, so the dots read (user, 2026-10-25). */
 screen:'medium' as const,displaySize:96,
 /** Reference sheet position (home at 1440). */
 origin:{x:40,y:420},
 /** Four-ink plates written by design/photo/home_landscape_4c.py: {a,b,c,d}.png (landscape)
  * and figure-{a,b,c,d}.png (the person). */
 plates:'src/assets/home/landscape-4c',
 /** The person prints on the fine screen (2px), like the portrait (user, 2026-10-26). */
 figureScreen:'fine' as const,
};
