# Contact form API

The backend for the form on `/contact`. It's a [Cloudflare Worker](https://developers.cloudflare.com/workers/)
that checks each submission and emails it to `mokazemi0@gmail.com` through
[Resend](https://resend.com). The site itself stays static on GitHub Pages; the
form posts to this Worker.

```
Browser ──POST /contact──▶ Worker ──▶ Turnstile siteverify (is this a person?)
                              └────▶ Resend API ──▶ mokazemi0@gmail.com
```

Both services are free at this scale: Workers allows 100,000 requests a day and
Resend 100 emails a day (3,000 a month).

## How it's protected

| Threat | Defense |
| --- | --- |
| Spam bots | [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/), verified server-side, including that the token was issued for this site's hostname and the `contact` action. Tokens are single-use and expire in 5 minutes. |
| Flooding | Rate limits of 5 requests a minute per IP and per sender address, checked before any paid work happens. Resend's daily cap is a hard ceiling. |
| Other sites posting to the API (CSRF) | Exact-match `Origin` allowlist, and JSON-only bodies, which force a CORS preflight a plain HTML form can't pass. |
| Using the form to email anyone else (open relay) | The recipient and sender are fixed in config. Nothing in the request can change them. |
| Email header injection | The sender's address must be a single plain address (no spaces, commas, quotes, or angle brackets). Line breaks are stripped from every one-line field. Mail goes out through Resend's JSON API, not raw SMTP. |
| HTML or script injection into your inbox | Every value is HTML-escaped. Nothing a visitor types is placed in a link or attribute. |
| Hidden or reversed text | Control, zero-width, and bidi-override characters are stripped, and text is Unicode-normalized. |
| Oversized or malformed requests | Bodies are streamed and cut off at 32 KB. Invalid UTF-8, bad JSON, non-string fields, and over-length values are rejected. |
| Leaked secrets | API keys live only in Worker secrets. The Worker has no runtime dependencies. |
| Misconfiguration | Config is validated on every request and fails closed. The Turnstile test key and `DRY_RUN` are refused unless every allowed origin is `localhost`. |
| Privacy | Logs record event names and error codes only, never names, addresses, or message text. |

## One-time setup

You need free accounts with Resend and Cloudflare. This takes about 10 minutes.

### 1. Resend (email delivery)

1. Sign up at [resend.com](https://resend.com) **with `mokazemi0@gmail.com`**.
   Until you verify a domain of your own, Resend only delivers to the address that
   owns the account.
2. Go to **API Keys → Create API key**, choose **Sending access**, and copy the key
   (it starts with `re_`).

### 2. Cloudflare Turnstile (bot check)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Go to **Turnstile → Add widget**. Name it "Portfolio contact", add the hostname
   `sammokazemi.github.io`, and keep the widget mode **Managed**.
3. Copy the **site key** and the **secret key**.

### 3. Deploy the Worker

From this folder:

```bash
npm install
npx wrangler login
npm run deploy
```

The first deploy asks you to pick a `workers.dev` subdomain. When it finishes it
prints the Worker's URL, for example `https://portfolio-contact.<subdomain>.workers.dev`.

Then add the two secrets. Each command prompts you to paste the value:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Until both are set, the Worker answers every request with an error instead of
running unprotected.

### 4. Point the site at it

In the GitHub repo, go to **Settings → Secrets and variables → Actions → Variables**
and add two repository variables:

| Name | Value |
| --- | --- |
| `CONTACT_API_URL` | The Worker URL plus `/contact`, e.g. `https://portfolio-contact.<subdomain>.workers.dev/contact` |
| `TURNSTILE_SITE_KEY` | The Turnstile **site** key (not the secret) |

Then re-run the **Deploy to GitHub Pages** workflow, or push to `main`. Send
yourself a test message from the live site.

## Local development

```bash
cp .dev.vars.example .dev.vars    # in worker/
cp .env.example .env              # in the repo root
npm run dev                       # in worker/: the API on http://localhost:8787
```

Then run `npm run dev` in the repo root and open `/contact`. Locally the Worker
uses Cloudflare's test Turnstile key and `DRY_RUN`, so messages print to the
terminal instead of being emailed. To send real email, set `RESEND_API_KEY` in
`.dev.vars` and remove `DRY_RUN`.

```bash
npm test             # unit and request tests
npm run typecheck
npm run check        # both; runs in CI on every change to worker/
```

## Operating it

- **Live logs:** `npx wrangler tail`, or **Workers → portfolio-contact → Logs** in
  the Cloudflare dashboard.
- **Rotating a key:** run `npx wrangler secret put` again with the new value. It
  takes effect immediately.
- **Custom domain:** add the new origin to `ALLOWED_ORIGINS` in `wrangler.jsonc`
  (comma-separated), add the hostname to the Turnstile widget, and redeploy.
- **Sending from your own domain:** verify the domain in Resend, then change
  `MAIL_FROM` in `wrangler.jsonc` and redeploy.

| Log event | Meaning |
| --- | --- |
| `sent` | Message delivered to Resend. |
| `turnstile_rejected` | Failed the bot check. Occasional ones are normal. |
| `rate_limited` | Someone hit the per-minute limit. |
| `delivery_failed` | Resend refused the message. `errorName` says why, for example `invalid_api_key`. |
| `config_error` | A var or secret is missing or invalid. The reason is in the log. |
