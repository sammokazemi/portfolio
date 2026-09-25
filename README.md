# Sām Kazemi · Portfolio

Personal portfolio of Sām Kazemi (سام کاظمی), Lead Software Engineer. Built with
[Astro](https://astro.build) as a fully static site: no client framework, a few
small scripts for the menu, theme toggle, and scroll reveals.

The design follows the clean, card-based look of
[ClearPath Virtual Health](https://clearpathvirtualhealth.com/), with a palette and
motifs drawn from Persian tilework: firuzeh turquoise, lapis lazuli, saffron gold,
the eight-pointed *khatam* star, and the pointed arch.

## Pages

| Route | Content |
| --- | --- |
| `/` | Hero, impact metrics, featured work, story teaser |
| `/about` | Personal story: Antioch, education, the name Sām, heritage |
| `/experience` | Timeline of roles |
| `/projects` | Project overview, plus case studies at `/projects/clearpath` and `/projects/union-workforce` |
| `/skills` | Skills by category and engineering practices |
| `/education` | SFSU and Los Medanos College |
| `/blog` | Writing, fed by Markdown in `src/content/blog/` |
| `/contact` | Email and social links |
| `/resume` | HTML resume, printable, with PDF download |

## Editing content

- **Personal details, links, experience, skills, education:** `src/data/site.ts`.
  Every page reads from it.
- **Social links:** the `socials` array in `src/data/site.ts`. Instagram and X are
  placeholders (`href: '#'`, `placeholder: true`). Replace the URL and remove
  `placeholder`, or delete the entry.
- **Resume PDF:** replace `public/resume/Sam-Kazemi-Resume.pdf`.
- **Blog posts:** copy `src/content/blog/_TEMPLATE.md` to `my-post.md`, fill in the
  front matter, and set `draft: false`. Files starting with `_` are ignored.

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
workflow, then add the domain under **Settings → Pages**.

The output in `dist/` is plain static files, so it also deploys unchanged to
Netlify, Vercel, Cloudflare Pages, or S3 + CloudFront. Build with no `BASE_PATH`
when serving from a domain root.
