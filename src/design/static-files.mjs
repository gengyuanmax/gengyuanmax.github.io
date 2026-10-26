// Build-time images (static print fallbacks, tool-rendered plates) are published as
// content-hashed files under /_print/ instead of being inlined into the HTML as base64.
// Node-only: imported by .astro components at render time, never by client code.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const staticPrintDir = path.resolve(process.cwd(), '.design/print-static');
export const staticPrintRoute = '/_print/';

/** Write PNG bytes once under a content hash and return the public URL. */
/** @param {Uint8Array} bytes @param {string} name @returns {string} */
export function publishPng(bytes, name) {
  const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const file = `${name.replace(/[^a-z0-9-]+/gi, '-')}-${hash}.png`;
  const target = path.join(staticPrintDir, file);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(staticPrintDir, {recursive: true});
    fs.writeFileSync(target, bytes);
  }
  return staticPrintRoute + file;
}

/** Same, for a `data:image/png;base64,` URL produced by a renderer. */
/** @param {string} dataUrl @param {string} name @returns {string} */
export function publishDataUrl(dataUrl, name) {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error(`publishDataUrl expects a PNG data URL (${name})`);
  return publishPng(Buffer.from(match[1], 'base64'), name);
}
