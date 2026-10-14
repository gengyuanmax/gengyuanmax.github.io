/** About folio: Max's own photograph of Delicate Arch, printed in one blue ink.
 * Source is kept out of public/; only the printed result is published. */
export const aboutPhoto={
 source:'src/assets/about/delicate-arch.jpg',
 output:'/images/about-arch.png',
 /** Crop of the 1600×1200 source that frames the arch with sky above it. */
 crop:{left:380,top:40,width:1220,height:1100},
 /** Reference width in CSS px; rendered at 2× so phones and retina stay sharp. */
 width:480,scale:2,
 /** The folio replaces a display numeral, so it uses the display (coarse) tier at the
  * name's reference size: 128px → 8 CSS px dots. No fourth frequency. */
 screen:'coarse' as const,displaySize:128,
 /** User choice (2026-10-15): a blue box with the arch knocked out, like the old "04". */
 treatment:'knockout' as const,
 /** Reference sheet position (About masthead at 1440); static prints use a fixed origin. */
 origin:{x:1000,y:150},
};
