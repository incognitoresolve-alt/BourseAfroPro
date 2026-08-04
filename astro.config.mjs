import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://bourse-afrique-academy.pages.dev',
  output: 'static',
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
});
