import {paperPixels,plateVector} from './research-render.ts';
import {researchPrintOrder} from './research-plates.ts';
import {directions} from '../data/research-map.ts';
import {renderPngScene} from './print-pipeline/node.mjs';
/** Build-only adapter; the pipeline owns rasterization and composition. */
export async function staticResearchPreview(recipe){
 const png=await renderPngScene(paperPixels(recipe),researchPrintOrder.map(id=>plateVector(recipe,directions.find(d=>d.plate===id).id)));
 return `data:image/png;base64,${png.toString('base64')}`;
}
