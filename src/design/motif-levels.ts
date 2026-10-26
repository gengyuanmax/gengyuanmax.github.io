// Kept apart from motifs.ts so the client can read screen levels without
// pulling the embedded plate images into its bundle.
export type Motif = 'orbit'|'earth'|'windows'|'sequence'|'query'|'frontier'|'scope';
/** Tool-rendered plates carry continuous tone (blends, cast shadows), so they print
 * on the fine tier like the portrait; constructed motifs keep the medium tier. */
export const toolPlateKinds:ReadonlySet<Motif>=new Set(['query','frontier','scope']);
export const motifScreenLevel=(kind:Motif)=>toolPlateKinds.has(kind)?'fine' as const:'medium' as const;
