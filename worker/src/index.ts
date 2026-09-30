// Contact form API for the portfolio.
//
//   POST /contact  { name, email, company?, subject?, when?, timeZone?, message, turnstileToken }
//
// Checks run cheapest first, so abusive traffic is turned away before it costs
// a Turnstile or Resend call: origin, content type, per-IP rate limit, body
// size, validation, per-sender rate limit, Turnstile, then delivery.

import { ConfigError, loadConfig, type Config, type Env } from './config';
import { buildEmail, sendEmail } from './email';
import { corsHeaders, empty, HttpError, json, readText } from './http';
import { verifyTurnstile } from './turnstile';
import { parseSubmission, type FieldErrors } from './validate';

export type { Env } from './config';

const ENDPOINT = '/contact';
/** Generous for the largest valid message (5,000 characters of multi-byte text plus the other fields). */
const MAX_BODY_BYTES = 32 * 1024;
const RATE_LIMIT_PERIOD_SECONDS = '60';

/** A 400 that carries per-field messages for the form to show. */
class ValidationError extends HttpError {
  constructor(readonly fields: FieldErrors) {
    super(400, 'invalid_fields');
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    return handleRequest(request, env);
  },
} satisfies ExportedHandler<Env>;

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  let config: Config;
  try {
    config = loadConfig(env);
  } catch (error) {
    const reason = error instanceof ConfigError ? error.message : String(error);
    console.error(JSON.stringify({ event: 'config_error', reason }));
    return json(500, { ok: false, error: 'server_error' });
  }

  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, config.origins);

  if (new URL(request.url).pathname !== ENDPOINT) {
    return json(404, { ok: false, error: 'not_found' }, cors);
  }

  if (request.method === 'OPTIONS') return preflight(request, cors);
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' }, { ...cors, Allow: 'POST, OPTIONS' });
  }

  try {
    await handleSubmission(request, env, config, origin);
    return json(200, { ok: true }, cors);
  } catch (error) {
    if (error instanceof HttpError) {
      const body: Record<string, unknown> = { ok: false, error: error.code };
      if (error instanceof ValidationError) body.fields = error.fields;
      return json(error.status, body, { ...cors, ...error.headers });
    }
    console.error(JSON.stringify({ event: 'unhandled_error', reason: String(error) }));
    return json(500, { ok: false, error: 'server_error' }, cors);
  }
}

function preflight(request: Request, cors: Record<string, string>): Response {
  const allowed =
    'Access-Control-Allow-Origin' in cors && request.headers.get('Access-Control-Request-Method') === 'POST';
  if (!allowed) return empty(403, { Vary: 'Origin' });
  return empty(204, {
    ...cors,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  });
}

async function handleSubmission(request: Request, env: Env, config: Config, origin: string | null): Promise<void> {
  // Browsers always send Origin on cross-origin POSTs. Its absence or a
  // mismatch means the request didn't come from the portfolio.
  if (!origin || !config.origins.has(origin)) throw new HttpError(403, 'forbidden_origin');

  // Requiring JSON also forces a CORS preflight, which a plain HTML form on
  // another site can't satisfy.
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!/^application\/json\s*(?:;\s*charset=utf-8\s*)?$/i.test(contentType)) {
    throw new HttpError(415, 'unsupported_media_type');
  }

  const ip = request.headers.get('CF-Connecting-IP');
  await rateLimit(env, `ip:${ip ?? 'unknown'}`);

  let input: unknown;
  try {
    input = JSON.parse(await readText(request, MAX_BODY_BYTES));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'invalid_request');
  }
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new HttpError(400, 'invalid_request');
  }

  const parsed = parseSubmission(input as Record<string, unknown>);
  if (!parsed.ok) throw new ValidationError(parsed.errors);
  const { message, turnstileToken } = parsed.value;

  // A second limit keyed on the sender stops one address flooding the inbox
  // from many IPs.
  await rateLimit(env, `email:${message.email.toLowerCase()}`);

  await verifyTurnstile(turnstileToken, ip, config);

  const country = typeof request.cf?.country === 'string' && /^[A-Z0-9]{2}$/.test(request.cf.country)
    ? request.cf.country
    : '';
  await sendEmail(buildEmail(message, { receivedAt: new Date(), country }), config);
  console.log(JSON.stringify({ event: 'sent', country }));
}

async function rateLimit(env: Env, key: string): Promise<void> {
  const { success } = await env.CONTACT_LIMITER.limit({ key });
  if (!success) {
    console.warn(JSON.stringify({ event: 'rate_limited', scope: key.slice(0, key.indexOf(':')) }));
    throw new HttpError(429, 'rate_limited', { 'Retry-After': RATE_LIMIT_PERIOD_SECONDS });
  }
}
