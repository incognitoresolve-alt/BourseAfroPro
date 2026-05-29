import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://bourse-afrique-academy.netlify.app',
  output: 'hybrid',
  adapter: netlify(),
  integrations: [
    tailwind(),
    mdx(),
    sitemap(),
    react({
      include: ['**/simulator/**/*', '**/market/**/*'],
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  vite: {
    ssr: {
      noExternal: ['@supabase/supabase-js'],
    },
  },
});
