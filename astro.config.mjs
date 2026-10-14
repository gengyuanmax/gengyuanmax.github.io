import { defineConfig } from 'astro/config';
import { designServer } from './scripts/design-server.ts';

export default defineConfig({
  site: 'https://gengyuanmax.github.io',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { plugins: [designServer()] },
});
