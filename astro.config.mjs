// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL / BASE_PATH are set by the GitHub Pages workflow. Locally the site
// is served from the root. For a custom domain, set SITE_URL to it and drop BASE_PATH.
export default defineConfig({
  site: process.env.SITE_URL || 'https://sammokazemi.github.io',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
