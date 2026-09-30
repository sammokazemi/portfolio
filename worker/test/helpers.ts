import { vi } from 'vitest';
import type { Env } from '../src/config';

export const ORIGIN = 'https://sammokazemi.github.io';
export const ENDPOINT = 'https://portfolio-contact.example.workers.dev/contact';
export const OWNER = 'owner@example.com';

/** Builds a string from code points, so tests never depend on invisible characters in the source. */
export const chars = (...codePoints: number[]): string => String.fromCodePoint(...codePoints);

export interface Limiter extends RateLimit {
  keys: string[];
}

export function limiter(blocked: (key: string) => boolean = () => false): Limiter {
  const keys: string[] = [];
  return {
    keys,
    async limit({ key }) {
      keys.push(key);
      return { success: !blocked(key) };
    },
  };
}

export function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    CONTACT_TO: OWNER,
    MAIL_FROM: 'Portfolio Contact <onboarding@resend.dev>',
    ALLOWED_ORIGINS: ORIGIN,
    RESEND_API_KEY: 're_live_key',
    TURNSTILE_SECRET_KEY: 'fake-turnstile-secret',
    CONTACT_LIMITER: limiter(),
    ...overrides,
  };
}

export function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    message: 'Hello! I would love to talk about a role on our team.',
    turnstileToken: '0.real-turnstile-token',
    ...overrides,
  };
}

interface PostOptions {
  origin?: string | null;
  contentType?: string;
  headers?: Record<string, string>;
  url?: string;
}

export function post(body: unknown, options: PostOptions = {}): Request {
  const headers = new Headers({
    'Content-Type': options.contentType ?? 'application/json',
    'CF-Connecting-IP': '203.0.113.7',
    ...options.headers,
  });
  const origin = options.origin === undefined ? ORIGIN : options.origin;
  if (origin !== null) headers.set('Origin', origin);
  return new Request(options.url ?? ENDPOINT, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

type Reply = { status: number; body: unknown } | Error;

export interface UpstreamCalls {
  turnstile: Record<string, string>[];
  resend: { headers: Headers; body: Record<string, unknown> }[];
}

/** Replaces global fetch with fakes for Turnstile siteverify and the Resend API. */
export function mockUpstreams(
  options: { turnstile?: Reply; resend?: Reply[] } = {},
): UpstreamCalls {
  const turnstile: Reply = options.turnstile ?? {
    status: 200,
    body: { success: true, hostname: 'sammokazemi.github.io', action: 'contact', 'error-codes': [] },
  };
  const resendQueue = [...(options.resend ?? [])];
  const calls: UpstreamCalls = { turnstile: [], resend: [] };

  const reply = (next: Reply): Response => {
    if (next instanceof Error) throw next;
    return Response.json(next.body, { status: next.status });
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
        calls.turnstile.push(JSON.parse(String(init?.body)));
        return reply(turnstile);
      }
      if (url === 'https://api.resend.com/emails') {
        calls.resend.push({ headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
        return reply(resendQueue.shift() ?? { status: 200, body: { id: 'email-id' } });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }),
  );
  return calls;
}
