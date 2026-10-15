/** The single noise budget for every print recipe on the page.
 *
 * Two kinds of noise exist and they are bounded differently:
 * - before screening, noise changes how large dots are. It must stay low-frequency
 *   (at least ~10 screen cells), or it beats against the lattice and reads as glitch;
 * - after screening, noise only thins ink that has already landed. It never adds,
 *   removes or reshapes a dot, so its amplitude, not its frequency, is what matters.
 *
 * Ceilings sit at the values approved on 2026-10-14, so the current page does not
 * change; they exist so that no setting, override or direct call can exceed them.
 * Settings ranges in settings.ts must not be wider than these numbers (tested). */
export const noiseBudget={
 /** Pre-screen tone variation, ± fraction of ink demand, and its smallest feature in CSS px. */
 tone:{amplitude:.08,minScale:80},
 /** Post-screen ink loss on images, grounds and geometry. */
 transfer:{starvation:.15,grainLoss:.12,grainArea:.04,roller:.05},
 /** Total ink loss on type (print-type-v4: the images' own transfer, title-capped). */
 text:{display:.15,heading:.12,
  /** Display-name dots (user, 2026-10-14): size ± fraction, centre shift as a fraction of
   * the pitch, and the blue plate's register against the red letter in CSS px. */
  dots:{radius:.18,shift:.06,registration:1.25}},
 /** Printed guide lines (rule-v1): edge wander in CSS px and its smallest feature. */
 rule:{edge:.35,wave:14},
 /** Worn plate edges (wear-v1): inset depth in CSS px, missing-dot share at the edge, and
  * the inset's smallest feature in CSS px. */
 wear:{depth:2.5,speckle:.75,wave:9},
 /** Midtone dot gain added to the tone curve before screening. */
 dotGain:.4,
 /** Shared paper texture strength. */
 paper:.1,
 /** Plate offsets in CSS px (every page plate, research circles included). Text is clamped
  * further in duotone-type.css (.75 / .5). */
 registration:{plate:3},
 /** Research circles (polygon-v1): pre-screen per-dot noise and dot size. */
 research:{ink:.15,feed:.2,fiber:.08,dotGain:1.3,dropout:.15},
} as const;

export const within=(value:number,max:number)=>Math.max(0,Math.min(max,Number.isFinite(value)?value:0));
export const withinSigned=(value:number,max:number)=>Math.max(-max,Math.min(max,Number.isFinite(value)?value:0));

/** Settings whose range must stay inside the budget: [setting key, budget ceiling, lower bound if signed]. */
export const budgetedSettings:readonly (readonly [string,number,'signed'?])[]=[
 ['toneNoise',noiseBudget.tone.amplitude],
 ['starvation',noiseBudget.transfer.starvation],
 ['grain',noiseBudget.transfer.grainLoss],
 ['pressGrain',noiseBudget.transfer.grainArea],
 // Roller loss is band × .5 in the transfer stage.
 ['banding',noiseBudget.transfer.roller*2],
 ['dotGain',noiseBudget.dotGain],
 ['paperTexture',noiseBudget.paper],
 ['registration',noiseBudget.registration.plate,'signed'],
 ['registrationY',noiseBudget.registration.plate,'signed'],
 ['researchInkNoise',noiseBudget.research.ink],
 ['researchFeedNoise',noiseBudget.research.feed],
 ['researchFiberNoise',noiseBudget.research.fiber],
 ['researchDotGain',noiseBudget.research.dotGain],
 ['researchDropout',noiseBudget.research.dropout],
 ['yellowX',noiseBudget.registration.plate,'signed'],
 ['yellowY',noiseBudget.registration.plate,'signed'],
];
