// Response helpers, CORS, and bounded body reading.

/** An error that maps directly to an HTTP response. `code` is safe to show to clients. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(code);
  }
}

// The API only ever returns small JSON documents, so lock everything else down.
const SECURITY_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

export function empty(status: number, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers: { ...SECURITY_HEADERS, ...headers } });
}

/** CORS headers for a response. Only exact allowlisted origins are echoed back. */
export function corsHeaders(origin: string | null, allowed: ReadonlySet<string>): Record<string, string> {
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (origin && allowed.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/**
 * Reads the request body as UTF-8 text, refusing anything over `limit` bytes.
 * Streams the body so an oversized or lying Content-Length can't exhaust memory.
 */
export async function readText(request: Request, limit: number): Promise<string> {
  const declared = request.headers.get('Content-Length');
  if (declared !== null && !/^\d+$/.test(declared)) throw new HttpError(400, 'invalid_request');
  if (declared !== null && Number(declared) > limit) throw new HttpError(413, 'payload_too_large');
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, 'payload_too_large');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
  } catch {
    throw new HttpError(400, 'invalid_request');
  }
}
