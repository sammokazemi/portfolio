// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL / BASE_PATH are set by the GitHub Pages workflow. Locally the site
// is served from the root. For a custom domain, set SITE_URL to it and drop BASE_PATH.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site: process.env.SITE_URL || 'https://sammokazemi.github.io',
  base,
  trailingSlash: 'ignore',
  // Tooling that assigns ports (e.g. a second dev server beside another) sets PORT.
  server: { port: Number(process.env.PORT) || 4321 },
  // Old case-study URL, kept so links already sent out still land. Astro prefixes
  // the source with the base path but not the destination, so that is done here.
  redirects: {
    '/projects/union-workforce': `${base.replace(/\/$/, '')}/projects/workforce-systems`,
  },
  integrations: [sitemap()],
  env: {
    schema: {
      // Contact form backend (see worker/README.md). Both are public values baked
      // into the page at build time. Without them the form points people to email.
      PUBLIC_CONTACT_API_URL: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
