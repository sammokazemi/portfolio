// Server-side Cloudflare Turnstile verification. The widget on the page only
// produces a token; this is the check that actually keeps bots out.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

import type { Config } from './config';
import { HttpError } from './http';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Must match the `action` the page passes to `turnstile.render`. */
export const TURNSTILE_ACTION = 'contact';

interface SiteverifyResponse {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
  metadata?: { result_with_testing_key?: boolean };
}

/**
 * Resolves when the token is valid for this site and action. Throws 403 for a
 * rejected token and 502 when Turnstile can't be reached, so failures never
 * fall through to sending.
 */
export async function verifyTurnstile(token: string, ip: string | null, config: Config): Promise<void> {
  const body: Record<string, string> = { secret: config.turnstileSecret, response: token };
  if (ip) body.remoteip = ip;

  let result: SiteverifyResponse;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`siteverify returned ${response.status}`);
    result = await response.json();
  } catch (error) {
    console.error(JSON.stringify({ event: 'turnstile_unavailable', reason: String(error) }));
    throw new HttpError(502, 'verification_unavailable');
  }

  // A result produced by a dummy key is only acceptable with a dummy secret,
  // which config.ts in turn only allows when every origin is local.
  const modeOk = (result.metadata?.result_with_testing_key === true) === config.turnstileTestMode;
  // Dummy keys answer for "example.com" with no action, so these checks can
  // only apply to real keys.
  const hostnameOk =
    config.turnstileTestMode || (typeof result.hostname === 'string' && config.hostnames.has(result.hostname));
  const actionOk = config.turnstileTestMode || result.action === TURNSTILE_ACTION;

  if (result.success !== true || !modeOk || !hostnameOk || !actionOk) {
    console.warn(
      JSON.stringify({
        event: 'turnstile_rejected',
        codes: result['error-codes'] ?? [],
        modeOk,
        hostnameOk,
        actionOk,
      }),
    );
    throw new HttpError(403, 'verification_failed');
  }
}
