import { defineConfig } from 'astro/config';
import { designServer } from './scripts/design-server.ts';
import { printStatic } from './scripts/print-static.ts';

export default defineConfig({
  site: 'https://gengyuanmax.github.io',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [printStatic()],
  vite: { plugins: [designServer()] },
});
