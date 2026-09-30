// Runtime configuration, read from Worker vars and secrets (see wrangler.jsonc).
// Everything is validated on each request so a bad deploy fails closed with a
// logged reason instead of silently accepting or dropping messages.

export interface Env {
  /** Inbox that receives every message. Fixed here, never taken from the request. */
  CONTACT_TO: string;
  /** Sender shown in the inbox. Must be on a domain verified in Resend, or onboarding@resend.dev. */
  MAIL_FROM: string;
  /** Comma-separated origins allowed to call the API, e.g. "https://sammokazemi.github.io". */
  ALLOWED_ORIGINS: string;
  /** "true" logs messages instead of emailing them. Local development only. */
  DRY_RUN?: string;
  /** Secret: Resend API key. */
  RESEND_API_KEY?: string;
  /** Secret: Turnstile widget secret key. */
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_LIMITER: RateLimit;
}

export interface Config {
  to: string;
  from: string;
  origins: ReadonlySet<string>;
  /** Hostnames of the allowed origins; Turnstile tokens must come from one of these. */
  hostnames: ReadonlySet<string>;
  dryRun: boolean;
  resendApiKey: string;
  turnstileSecret: string;
  /** Cloudflare's dummy Turnstile secrets, which accept dummy tokens with action "test". */
  turnstileTestMode: boolean;
}

export class ConfigError extends Error {}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

// Cloudflare's published dummy secrets: 1x... always passes, 2x... always fails, 3x... "already spent".
const TURNSTILE_TEST_SECRET = /^[123]x0+AA$/;

export function loadConfig(env: Env): Config {
  const to = env.CONTACT_TO?.trim();
  const from = env.MAIL_FROM?.trim();
  if (!to || !from) throw new ConfigError('CONTACT_TO and MAIL_FROM must be set');

  const origins = new Set<string>();
  const hostnames = new Set<string>();
  for (const raw of (env.ALLOWED_ORIGINS ?? '').split(',')) {
    const value = raw.trim();
    if (!value) continue;
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new ConfigError(`ALLOWED_ORIGINS entry is not a URL: ${value}`);
    }
    // An origin is scheme + host + port only; anything else would never match the Origin header.
    if (parsed.origin !== value) throw new ConfigError(`ALLOWED_ORIGINS entry must be a bare origin: ${value}`);
    if (parsed.protocol !== 'https:' && !LOCAL_HOSTS.has(parsed.hostname)) {
      throw new ConfigError(`ALLOWED_ORIGINS entry must use https: ${value}`);
    }
    origins.add(value);
    hostnames.add(parsed.hostname);
  }
  if (origins.size === 0) throw new ConfigError('ALLOWED_ORIGINS must list at least one origin');

  const localOnly = [...hostnames].every((host) => LOCAL_HOSTS.has(host));
  const dryRun = env.DRY_RUN === 'true';
  const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim() ?? '';
  const resendApiKey = env.RESEND_API_KEY?.trim() ?? '';
  const turnstileTestMode = TURNSTILE_TEST_SECRET.test(turnstileSecret);

  if (!turnstileSecret) throw new ConfigError('TURNSTILE_SECRET_KEY is not set');
  if (!dryRun && !resendApiKey) throw new ConfigError('RESEND_API_KEY is not set');

  // The two development shortcuts would disable real protection or real delivery,
  // so refuse them outright when the Worker serves any public origin.
  if (turnstileTestMode && !localOnly) {
    throw new ConfigError('Turnstile test secret is only allowed when every origin is local');
  }
  if (dryRun && !localOnly) throw new ConfigError('DRY_RUN is only allowed when every origin is local');

  return { to, from, origins, hostnames, dryRun, resendApiKey, turnstileSecret, turnstileTestMode };
}
