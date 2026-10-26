import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {AstroIntegration} from 'astro';
import {staticPrintDir, staticPrintRoute} from '../src/design/static-files.mjs';

/** Serves /_print/ from .design/print-static in dev, and copies the files a build
 * referenced into dist/_print/. The directory is emptied when a build starts, so only
 * files written by the current render are published. */
export function printStatic(): AstroIntegration {
  return {
    name: 'print-static',
    hooks: {
      'astro:build:start': async () => {
        await fs.rm(staticPrintDir, {recursive: true, force: true});
      },
      'astro:server:setup': ({server}) => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url?.split('?')[0] || '';
          if (!url.startsWith(staticPrintRoute)) return next();
          const file = path.join(staticPrintDir, path.basename(url));
          try {
            const bytes = await fs.readFile(file);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-store');
            res.end(bytes);
          } catch { res.statusCode = 404; res.end(); }
        });
      },
      'astro:build:done': async ({dir, logger}) => {
        const out = path.join(fileURLToPath(dir), staticPrintRoute);
        await fs.mkdir(out, {recursive: true});
        const files = await fs.readdir(staticPrintDir).catch(() => []);
        for (const file of files) await fs.copyFile(path.join(staticPrintDir, file), path.join(out, file));
        logger.info(`Published ${files.length} print images to ${staticPrintRoute}`);
      },
    },
  };
}
