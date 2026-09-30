import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { handleRequest } from '../src/index';
import { ENDPOINT, limiter, makeEnv, mockUpstreams, ORIGIN, OWNER, post, validBody } from './helpers';

let logs: MockInstance[];

beforeEach(() => {
  logs = (['log', 'warn', 'error'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe('routing and CORS', () => {
  it('answers a preflight from the portfolio', async () => {
    const request = new Request(ENDPOINT, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    });
    const response = await handleRequest(request, makeEnv());
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    expect(response.headers.get('Vary')).toBe('Origin');
  });

  it('refuses a preflight from any other origin', async () => {
    const request = new Request(ENDPOINT, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
    });
    const response = await handleRequest(request, makeEnv());
    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('does not treat a lookalike origin as allowed', async () => {
    mockUpstreams();
    for (const origin of [`${ORIGIN}.evil.example`, 'http://sammokazemi.github.io', `${ORIGIN}:8443`, 'null']) {
      const response = await handleRequest(post(validBody(), { origin }), makeEnv());
      expect(response.status).toBe(403);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    }
  });

  it('returns 404 for other paths and 405 for other methods', async () => {
    expect((await handleRequest(post(validBody(), { url: 'https://x.example/' }), makeEnv())).status).toBe(404);
    const get = await handleRequest(new Request(ENDPOINT, { headers: { Origin: ORIGIN } }), makeEnv());
    expect(get.status).toBe(405);
    expect(get.headers.get('Allow')).toBe('POST, OPTIONS');
  });

  it('sends security headers on every response', async () => {
    const response = await handleRequest(post(validBody(), { origin: null }), makeEnv());
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'; frame-ancestors 'none'");
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
  });
});

describe('request screening', () => {
  it('rejects requests without an Origin header', async () => {
    const calls = mockUpstreams();
    const response = await handleRequest(post(validBody(), { origin: null }), makeEnv());
    expect(response.status).toBe(403);
    expect(await body(response)).toEqual({ ok: false, error: 'forbidden_origin' });
    expect(calls.turnstile).toHaveLength(0);
    expect(calls.resend).toHaveLength(0);
  });

  it.each(['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/json; charset=latin1'])(
    'rejects Content-Type %s',
    async (contentType) => {
      const response = await handleRequest(post(validBody(), { contentType }), makeEnv());
      expect(response.status).toBe(415);
    },
  );

  it('accepts JSON with a UTF-8 charset parameter', async () => {
    mockUpstreams();
    const response = await handleRequest(post(validBody(), { contentType: 'application/json; charset=UTF-8' }), makeEnv());
    expect(response.status).toBe(200);
  });

  it('rejects a body declared larger than the limit', async () => {
    const response = await handleRequest(post(validBody(), { headers: { 'Content-Length': '999999' } }), makeEnv());
    expect(response.status).toBe(413);
  });

  it('rejects an oversized body that does not declare its length', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(8 * 1024));
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent++ < 10) controller.enqueue(chunk);
        else controller.close();
      },
    });
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    const response = await handleRequest(request, makeEnv());
    expect(response.status).toBe(413);
    expect(sent).toBeLessThan(10);
  });

  it.each([
    ['malformed JSON', '{"name": "Jane"'],
    ['an array', '[1, 2]'],
    ['a string', '"hello"'],
    ['null', 'null'],
    ['empty', ''],
  ])('rejects %s', async (_, raw) => {
    const response = await handleRequest(post(raw), makeEnv());
    expect(response.status).toBe(400);
    expect(await body(response)).toEqual({ ok: false, error: 'invalid_request' });
  });

  it('returns field errors without spending the Turnstile token', async () => {
    const calls = mockUpstreams();
    const response = await handleRequest(post(validBody({ email: 'not-an-email', message: '' })), makeEnv());
    expect(response.status).toBe(400);
    expect(await body(response)).toEqual({
      ok: false,
      error: 'invalid_fields',
      fields: { email: 'Please enter a valid email address.', message: 'Please enter a message.' },
    });
    expect(calls.turnstile).toHaveLength(0);
  });
});

describe('rate limiting', () => {
  it('limits by IP before reading the body', async () => {
    const calls = mockUpstreams();
    const env = makeEnv({ CONTACT_LIMITER: limiter((key) => key.startsWith('ip:')) });
    const response = await handleRequest(post('not even json'), env);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(calls.turnstile).toHaveLength(0);
  });

  it('limits by sender address, case-insensitively', async () => {
    const calls = mockUpstreams();
    const rateLimiter = limiter((key) => key === 'email:jane@example.com');
    const response = await handleRequest(post(validBody({ email: 'Jane@Example.com' })), makeEnv({ CONTACT_LIMITER: rateLimiter }));
    expect(response.status).toBe(429);
    expect(rateLimiter.keys).toEqual(['ip:203.0.113.7', 'email:jane@example.com']);
    expect(calls.turnstile).toHaveLength(0);
  });
});

describe('Turnstile', () => {
  it('sends the secret, token, and visitor IP to siteverify', async () => {
    const calls = mockUpstreams();
    await handleRequest(post(validBody()), makeEnv());
    expect(calls.turnstile).toEqual([
      { secret: 'fake-turnstile-secret', response: '0.real-turnstile-token', remoteip: '203.0.113.7' },
    ]);
  });

  it.each([
    ['a failed challenge', { success: false, 'error-codes': ['invalid-input-response'] }],
    ['a token from another site', { success: true, hostname: 'evil.example', action: 'contact' }],
    ['a token for another action', { success: true, hostname: 'sammokazemi.github.io', action: 'login' }],
    // The exact reply Cloudflare gives for the dummy keys.
    ['a dummy test token', { success: true, hostname: 'example.com', 'error-codes': [], metadata: { result_with_testing_key: true } }],
    [
      'a testing-key result that otherwise looks right',
      { success: true, hostname: 'sammokazemi.github.io', action: 'contact', metadata: { result_with_testing_key: true } },
    ],
    ['a malformed reply', { success: 'true', hostname: 'sammokazemi.github.io', action: 'contact' }],
  ])('rejects %s', async (_, reply) => {
    const calls = mockUpstreams({ turnstile: { status: 200, body: reply } });
    const response = await handleRequest(post(validBody()), makeEnv());
    expect(response.status).toBe(403);
    expect(await body(response)).toEqual({ ok: false, error: 'verification_failed' });
    expect(calls.resend).toHaveLength(0);
  });

  it('fails closed when siteverify is unreachable or errors', async () => {
    for (const turnstile of [new TypeError('network down'), { status: 500, body: {} }]) {
      const calls = mockUpstreams({ turnstile });
      const response = await handleRequest(post(validBody()), makeEnv());
      expect(response.status).toBe(502);
      expect(await body(response)).toEqual({ ok: false, error: 'verification_unavailable' });
      expect(calls.resend).toHaveLength(0);
    }
  });
});

describe('delivery', () => {
  it('emails the owner and replies to the sender', async () => {
    const calls = mockUpstreams();
    const response = await handleRequest(post(validBody({ subject: 'Hello' })), makeEnv());
    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({ ok: true });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);

    expect(calls.resend).toHaveLength(1);
    const [sent] = calls.resend;
    expect(sent!.headers.get('Authorization')).toBe('Bearer re_live_key');
    expect(sent!.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
    expect(sent!.body).toMatchObject({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: [OWNER],
      reply_to: 'jane@example.com',
      subject: '[Portfolio] Hello (Jane Doe)',
    });
    expect(sent!.body.text).toContain('Hello! I would love to talk about a role on our team.');
  });

  it('never lets the request choose the recipient or sender', async () => {
    const calls = mockUpstreams();
    const hostile = validBody({ to: 'evil@example.net', from: 'ceo@bank.example', cc: 'x@example.net', bcc: 'y@example.net', CONTACT_TO: 'evil@example.net' });
    await handleRequest(post(hostile), makeEnv());
    const sent = calls.resend[0]!.body;
    expect(sent.to).toEqual([OWNER]);
    expect(sent.from).toBe('Portfolio Contact <onboarding@resend.dev>');
    expect(Object.keys(sent).sort()).toEqual(['from', 'html', 'reply_to', 'subject', 'text', 'to']);
  });

  it('retries once on a server error with the same idempotency key', async () => {
    const calls = mockUpstreams({ resend: [{ status: 503, body: { name: 'internal_server_error' } }] });
    const response = await handleRequest(post(validBody()), makeEnv());
    expect(response.status).toBe(200);
    expect(calls.resend).toHaveLength(2);
    expect(calls.resend[0]!.headers.get('Idempotency-Key')).toBe(calls.resend[1]!.headers.get('Idempotency-Key'));
  });

  it('does not retry a client error such as a bad API key', async () => {
    const calls = mockUpstreams({ resend: [{ status: 401, body: { name: 'invalid_api_key' } }] });
    const response = await handleRequest(post(validBody()), makeEnv());
    expect(response.status).toBe(502);
    expect(await body(response)).toEqual({ ok: false, error: 'delivery_failed' });
    expect(calls.resend).toHaveLength(1);
  });

  it('gives up after the retry fails too', async () => {
    const calls = mockUpstreams({ resend: [new TypeError('network down'), { status: 500, body: {} }] });
    const response = await handleRequest(post(validBody()), makeEnv());
    expect(response.status).toBe(502);
    expect(calls.resend).toHaveLength(2);
  });

  it('never logs message content or the sender address', async () => {
    mockUpstreams({ resend: [{ status: 401, body: { name: 'invalid_api_key', message: 'jane@example.com' } }] });
    await handleRequest(post(validBody({ subject: 'Secret subject' })), makeEnv());
    mockUpstreams();
    await handleRequest(post(validBody({ subject: 'Secret subject' })), makeEnv());

    const logged = logs.flatMap((spy) => spy.mock.calls.flat()).join('\n');
    expect(logged).toContain('delivery_failed');
    expect(logged).toContain('"event":"sent"');
    for (const secret of ['jane@example.com', 'Jane Doe', 'Secret subject', 'role on our team', 're_live_key', 'fake-turnstile-secret']) {
      expect(logged).not.toContain(secret);
    }
  });
});

describe('configuration', () => {
  it.each([
    ['the Turnstile test secret with a public origin', { TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' }],
    ['dry run with a public origin', { DRY_RUN: 'true' }],
    ['a missing Resend key', { RESEND_API_KEY: '' }],
    ['a missing Turnstile secret', { TURNSTILE_SECRET_KEY: undefined }],
    ['no allowed origins', { ALLOWED_ORIGINS: ' , ' }],
    ['an origin with a path', { ALLOWED_ORIGINS: `${ORIGIN}/portfolio` }],
    ['a plain-http public origin', { ALLOWED_ORIGINS: 'http://sammokazemi.github.io' }],
    ['a missing recipient', { CONTACT_TO: '' }],
  ])('fails closed with %s', async (_, overrides) => {
    const calls = mockUpstreams();
    const response = await handleRequest(post(validBody()), makeEnv(overrides));
    expect(response.status).toBe(500);
    expect(await body(response)).toEqual({ ok: false, error: 'server_error' });
    expect(calls.turnstile).toHaveLength(0);
    expect(calls.resend).toHaveLength(0);
  });

  it('supports local development with test keys and dry run', async () => {
    const local = 'http://localhost:4321';
    const dummyReply = { success: true, hostname: 'example.com', 'error-codes': [], metadata: { result_with_testing_key: true } };
    const calls = mockUpstreams({ turnstile: { status: 200, body: dummyReply } });
    const env = makeEnv({
      ALLOWED_ORIGINS: local,
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
      DRY_RUN: 'true',
      RESEND_API_KEY: undefined,
    });
    const response = await handleRequest(post(validBody({ turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' }), { origin: local }), env);
    expect(response.status).toBe(200);
    expect(calls.turnstile).toHaveLength(1);
    expect(calls.resend).toHaveLength(0);
  });

  it('in test mode, still rejects a result that did not come from a testing key', async () => {
    const local = 'http://localhost:4321';
    mockUpstreams({ turnstile: { status: 200, body: { success: true, hostname: 'localhost', action: 'contact' } } });
    const env = makeEnv({ ALLOWED_ORIGINS: local, TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' });
    const response = await handleRequest(post(validBody(), { origin: local }), env);
    expect(response.status).toBe(403);
  });

  it('allows several origins', async () => {
    mockUpstreams();
    const env = makeEnv({ ALLOWED_ORIGINS: `https://sam.example, ${ORIGIN}` });
    expect((await handleRequest(post(validBody()), env)).status).toBe(200);
  });
});
