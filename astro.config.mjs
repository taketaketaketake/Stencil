// astro.config.mjs
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [tailwind()],
  vite: {
    define: {
      __DEFINES__: JSON.stringify({}),
      global: 'globalThis'
    }
  }
});
