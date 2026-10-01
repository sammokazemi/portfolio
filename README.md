# Sām Kazemi · Portfolio

Personal portfolio of Sām Kazemi (𐎿𐎠𐎶𐏐𐎣𐎠𐏀𐎡𐎷𐎡), Lead Software Engineer. Built with
[Astro](https://astro.build) as a fully static site: no client framework, a few
small scripts for the menu, theme toggle, and scroll reveals.

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
