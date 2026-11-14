# Sām Kazemi · Portfolio

**Live site: [sammokazemi.github.io/portfolio](https://sammokazemi.github.io/portfolio/)**

Sām Kazemi (𐎿𐎠𐎶𐏐𐎣𐎠𐏀𐎡𐎷𐎡) is a Lead Software Engineer who builds health-tech and
labor-tech platforms. He architected ClearPath Virtual Health, a production
HIPAA-compliant chronic care platform, and leads development at Workforce Systems.
This repository is the source for his portfolio.

## At a glance

- **Founding Software Engineer, MedManage Solutions (Sep 2025 – Oct 2026).** Architected and built
  [ClearPath Virtual Health](https://clearpathvirtualhealth.com/) from the ground up:
  four role-based portals with MFA, secure sessions, and audit logging, on React and
  AWS (S3, CloudFront, ECS Fargate) with CI/CD.
- **Lead Software Engineer, Workforce Systems (Nov 2026 – Present).** Designing and building a
  workforce platform for a labor union in Next.js and TypeScript, an iOS/Android member
  app in Flutter, both on a Laravel API, plus the union's public website.
- **Impact:** 200%+ recurring revenue growth that his ClearPath systems helped drive, 35%
  faster deployments, 40% less administrative overhead, and 340+ automated tests across
  the Workforce Systems web and mobile apps.
- **Education:** B.S. in Computer Science, San Francisco State University (2026).

## Case studies

| Project | What it is |
| --- | --- |
| [Planet Pooyah](https://sammokazemi.github.io/portfolio/projects/planet-pooyah/) | Game-like app teaching Persian and Iranian culture to diaspora children, in Next.js, Capacitor, and Laravel |
| [ClearPath Virtual Health](https://sammokazemi.github.io/portfolio/projects/clearpath/) | HIPAA-compliant CCM/RPM platform with Medicare billing workflows |
| [Dark Circles](https://sammokazemi.github.io/portfolio/projects/dark-circles/) | Website for a 30-episode vertical dark comedy, in Astro |

The [resume](https://sammokazemi.github.io/portfolio/#resume) is on the home page, with a
PDF download.

## About this site

Built with [Astro](https://astro.build) as a fully static site: no client framework,
just a few small scripts for the menu, theme toggle, scroll reveals, and the navbar
highlight that follows the section in view. Images are
served as responsive WebP, the site has light and dark themes, and the contact form
runs through a Cloudflare Worker with spam protection.

The design is clean and card-based, with a gold palette and motifs drawn from
ancient Iran: the twelve-petal rosettes of Persepolis and the name Sām written in
Old Persian cuneiform.

## Pages

| Route | Content |
| --- | --- |
| `/` | One long page, in order: the hero (`#hero`), impact metrics, projects newest first (`#projects`), skills (`#skills`), reviews with each full recommendation behind "Read the full recommendation" (`#reviews`), resume with PDF download (`#resume`), and the contact form (`#contact`). Each section lives in `src/components/home/`. The navbar links jump to these sections and the one in view turns gold. The old `/projects`, `/skills`, `/reviews`, `/resume`, and `/contact` URLs redirect here. |
| `/ai` | How Sām builds with AI: his workflow, and his take on hiring. Linked from the footer and the AI-Assisted Engineering skills card. |
| `/about` | Personal story (Antioch, education, the name Sām, heritage), a timeline, and his values. Linked from the navbar's "About Sām" button, the contact card, and the footer. |
| `/projects/<slug>` | A case study for each project |

## Editing content

- **Personal details, links, experience, skills, reviews:** `src/data/site.ts`.
  Every page reads from it.
- **Social links:** the `socials` array in `src/data/site.ts`. Instagram and X are
  placeholders (`href: '#'`, `placeholder: true`). Replace the URL and remove
  `placeholder`, or delete the entry.
- **Resume PDF:** replace `public/resume/Sam-Kazemi-Resume.pdf`, then update the
  `resume` block in `src/data/site.ts` so the HTML resume matches it.
- **Reviews:** the `reviews` array in `src/data/site.ts`. Reviewer photos live in
  `src/assets/reviews/` and are matched to names in `src/components/home/Reviews.astro`;
  anyone without a photo shows their initials.
- **Impact metrics:** the `metrics` array in `src/data/site.ts`. `label` shows on
  tablets and desktops, `short` on phones, where the strip is one row of four.

## Development

Requires Node 22+.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type-checks (astro check), then builds to dist/
npm run preview  # serve the production build
```

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main`. One-time setup: in the repo settings, go to **Pages** and set
**Source** to **GitHub Actions**. The site is served at
`https://sammokazemi.github.io/portfolio`.

For a custom domain, set `SITE_URL` to the domain and `BASE_PATH` to `/` in the
workflow, then add the domain under **Settings → Pages**. Also add the domain to
the contact Worker's allowed origins (see below).

### Contact form

The contact form (the home page's `#contact` section) sends messages through a small Cloudflare Worker in
[`worker/`](worker/README.md), which verifies each one and emails it to
`mokazemi0@gmail.com`. It's deployed separately from the site. Setup, local
development, and the security model are in [`worker/README.md`](worker/README.md).
Until the Worker is deployed and the `CONTACT_API_URL` and `TURNSTILE_SITE_KEY`
repository variables are set, the form asks visitors to email instead.

The output in `dist/` is plain static files, so it also deploys unchanged to
Netlify, Vercel, Cloudflare Pages, or S3 + CloudFront. Build with no `BASE_PATH`
when serving from a domain root.
