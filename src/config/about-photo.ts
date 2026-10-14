/** About folio: Max's own photograph of Delicate Arch, printed in one blue ink.
 * Source is kept out of public/; only the printed result is published. */
export const aboutPhoto={
 source:'src/assets/about/delicate-arch.jpg',
 output:'/images/about-arch.png',
 /** Crop of the 1600×1200 source that frames the arch with sky above it. */
 crop:{left:560,top:120,width:1040,height:1000},
 /** Reference width in CSS px; rendered at 2× so phones and retina stay sharp. */
 width:360,scale:2,
 screen:'medium' as const,
 /** Reference sheet position (About masthead at 1440); static prints use a fixed origin. */
 origin:{x:1000,y:150},
};
