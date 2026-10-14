// Source-native silhouette, in the coordinates of the user's 768 × 1024 photo.
// The image pixels are never repainted. This editable outline is a review mask.
export const portraitSource = {
 version:'canyon-outline-v1', source:'/images/gengyuan-zhang.jpeg',
 cutout:'/images/portrait-source-cutout.png', fallback:'/images/portrait-press.png',
 crop:{left:180,top:384,width:480,height:640},
 outline:'M348 444 L362 433 L384 428 L403 432 L424 433 L441 446 L453 464 L458 484 L454 507 L449 536 L442 552 L452 561 L477 572 L514 590 L550 616 L576 652 L588 683 L598 706 L606 737 L611 767 L609 801 L600 832 L584 854 L565 878 L544 894 L527 904 L524 941 L516 963 L515 1024 L295 1024 L295 986 L291 952 L299 927 L305 905 L303 874 L299 848 L287 818 L285 786 L287 751 L288 718 L289 681 L294 648 L305 616 L321 593 L344 576 L358 566 L361 550 L348 524 L342 494 L341 470 Z',
} as const;
