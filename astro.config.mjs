// astro.config.mjs
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shopstencil.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      filter: (page) => 
        !page.includes('/vendor-portal') &&
        !page.includes('/api/') &&
        !page.includes('/checkout') &&
        !page.includes('/login') &&
        !page.includes('/register') &&
        !page.includes('/edit-listing') &&
        !page.includes('/add-listing')
    })
  ],
  vite: {
    define: {
      __DEFINES__: JSON.stringify({}),
      global: 'globalThis'
    }
  }
});
