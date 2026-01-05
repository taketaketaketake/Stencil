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
    },
    server: {
      // Configure CORS for development
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:4321', 
          'https://shopstencil.com',
          'https://www.shopstencil.com'
        ],
        credentials: true
      }
    }
  }
});
