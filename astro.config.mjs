// astro.config.mjs
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://api.shopstencil.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: {
    define: {
      __DEFINES__: JSON.stringify({}),
      global: 'globalThis'
    }
  }
});
