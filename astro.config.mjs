// astro.config.mjs
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [tailwind()],
  vite: {
    define: {
      __DEFINES__: JSON.stringify({}),
      global: 'globalThis'
    }
  }
});
