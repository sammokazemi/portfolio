# Sām Kazemi · Portfolio

**Live site: [sammokazemi.github.io/portfolio](https://sammokazemi.github.io/portfolio/)**

Sām Kazemi (𐎿𐎠𐎶𐏐𐎣𐎠𐏀𐎡𐎷𐎡) is a Lead Software Engineer who builds health-tech and
labor-tech platforms. He architected ClearPath Virtual Health, a production
HIPAA-compliant chronic care platform, and leads development at Workforce Systems.
This repository is the source for his portfolio.

## At a glance

- **Lead Software Engineer, MedManage Solutions.** Architected and built
  [ClearPath Virtual Health](https://clearpathvirtualhealth.com/) from the ground up:
  four role-based portals with MFA, secure sessions, and audit logging, on React and
  AWS (S3, CloudFront, ECS Fargate) with CI/CD.
- **Lead Developer, Workforce Systems.** Designing and building a five-portal
  workforce platform for a labor union, plus the union's public website.
- **Impact:** 35% faster deployments, 40% less administrative overhead, and 200%+
  growth in recurring revenue from patient engagement systems.
- **Education:** B.S. in Computer Science, San Francisco State University (2026).

## Case studies

| Project | What it is |
| --- | --- |
| [ClearPath Virtual Health](https://sammokazemi.github.io/portfolio/projects/clearpath/) | HIPAA-compliant CCM/RPM platform with Medicare billing workflows |
| [Union Workforce Ecosystem](https://sammokazemi.github.io/portfolio/projects/workforce-systems/) | Five portals on one system of record: dispatch, dues, training, benefits |
| [Labor Union Website](https://sammokazemi.github.io/portfolio/projects/labor-union-website/) | Nine-page responsive public site for a union local |

The [resume](https://sammokazemi.github.io/portfolio/resume/) is on the site as a
printable page and a PDF.

## About this site

Built with [Astro](https://astro.build) as a fully static site: no client framework,
just a few small scripts for the menu, theme toggle, and scroll reveals. Images are
served as responsive WebP, the site has light and dark themes, and the contact form
runs through a Cloudflare Worker with spam protection.

The design is clean and card-based, with a gold palette and motifs drawn from
ancient Iran: the twelve-petal rosettes of Persepolis and the name Sām written in
Old Persian cuneiform.

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero, impact metrics, featured work, story teaser |
| `/about` | Personal story: Antioch, education, the name Sām, heritage |
| `/projects` | Project overview, with a case study for each project at `/projects/<slug>` |
| `/skills` | Skills by category and engineering practices |
| `/reviews` | Recommendations from teammates, classmates, and mentors |
| `/contact` | Contact form, email, and social links |
| `/resume` | HTML resume, printable, with PDF download |

## Editing content

- **Personal details, links, experience, skills, reviews:** `src/data/site.ts`.
  Every page reads from it.
- **Social links:** the `socials` array in `src/data/site.ts`. Instagram and X are
  placeholders (`href: '#'`, `placeholder: true`). Replace the URL and remove
  `placeholder`, or delete the entry.
- **Resume PDF:** replace `public/resume/Sam-Kazemi-Resume.pdf`, then update the
  `resume` block in `src/data/site.ts` so the HTML resume matches it.
- **Reviews:** the `reviews` array in `src/data/site.ts`.

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

The form on `/contact` sends messages through a small Cloudflare Worker in
[`worker/`](worker/README.md), which verifies each one and emails it to
`mokazemi0@gmail.com`. It's deployed separately from the site. Setup, local
development, and the security model are in [`worker/README.md`](worker/README.md).
Until the Worker is deployed and the `CONTACT_API_URL` and `TURNSTILE_SITE_KEY`
repository variables are set, the form asks visitors to email instead.

The output in `dist/` is plain static files, so it also deploys unchanged to
Netlify, Vercel, Cloudflare Pages, or S3 + CloudFront. Build with no `BASE_PATH`
when serving from a domain root.
