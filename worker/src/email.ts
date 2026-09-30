// Builds the notification email and delivers it through Resend.
// https://resend.com/docs/api-reference/emails/send-email

import type { Config } from './config';
import { HttpError } from './http';
import type { ContactMessage } from './validate';

export interface OutgoingEmail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

export interface ReceivedMeta {
  receivedAt: Date;
  /** Two-letter country code from Cloudflare, or empty when unknown. */
  country: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]!);
}

/** Formats `YYYY-MM-DDTHH:MM` as written, without shifting it into another zone. */
export function formatWhen(when: string, timeZone: string): string {
  const [year, month, day, hour, minute] = when.split(/[-T:]/).map(Number) as [number, number, number, number, number];
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(Date.UTC(year, month - 1, day, hour, minute)));
  return `${label} (${timeZone ? timeZone.replace(/_/g, ' ') : 'their local time'})`;
}

function formatReceived(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function buildEmail(message: ContactMessage, meta: ReceivedMeta): OutgoingEmail {
  const rows: [string, string][] = [
    ['Name', message.name],
    ['Email', message.email],
    ['Company', message.company],
    ['Subject', message.subject],
    ['Preferred time', message.when ? formatWhen(message.when, message.timeZone) : ''],
  ];
  const filled = rows.filter(([, value]) => value);

  const subject = (
    message.subject ? `[Portfolio] ${message.subject} (${message.name})` : `[Portfolio] New message from ${message.name}`
  ).slice(0, 200);

  const received = `Received ${formatReceived(meta.receivedAt)} Pacific${meta.country ? ` from ${meta.country}` : ''}.`;
  const replyHint = `Reply to this email to answer ${message.name} directly.`;

  const text = [
    'New message from the contact form on your portfolio.',
    '',
    ...filled.map(([label, value]) => `${label}: ${value}`),
    '',
    'Message:',
    message.message,
    '',
    '--',
    received,
    replyHint,
  ].join('\n');

  // Every interpolated value is escaped. Nothing visitor-supplied is placed in
  // an attribute or URL, and line breaks are the only markup derived from input.
  const cell = 'padding:6px 0;vertical-align:top';
  const tableRows = filled
    .map(
      ([label, value]) =>
        `<tr><td style="${cell};padding-right:16px;color:#6f6555;white-space:nowrap">${escapeHtml(label)}</td>` +
        `<td dir="auto" style="${cell};color:#1f1a12">${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  const body = escapeHtml(message.message).replace(/\n/g, '<br>');

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px 12px;background:#fbf8f1;font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1f1a12">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8dcc3;border-radius:12px;overflow:hidden">
<div style="height:4px;background:#c8962b"></div>
<div style="padding:24px 28px">
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a5f10">Portfolio contact form</p>
<h1 dir="auto" style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#1f1a12">New message from ${escapeHtml(message.name)}</h1>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5">${tableRows}</table>
<div dir="auto" style="margin-top:20px;padding:16px 18px;background:#fbf8f1;border-left:3px solid #c8962b;border-radius:6px;font-size:15px;line-height:1.6;color:#1f1a12;overflow-wrap:anywhere">${body}</div>
<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#6f6555">${escapeHtml(received)}<br>${escapeHtml(replyHint)}</p>
</div>
</div>
</body>
</html>`;

  return { subject, text, html, replyTo: message.email };
}

const RESEND_URL = 'https://api.resend.com/emails';
const MAX_ATTEMPTS = 2;

/** Sends the email, retrying once on a network error, 429, or 5xx. Throws 502 on failure. */
export async function sendEmail(email: OutgoingEmail, config: Config): Promise<void> {
  if (config.dryRun) {
    console.log(JSON.stringify({ event: 'dry_run', to: config.to, replyTo: email.replyTo, subject: email.subject }));
    console.log(email.text);
    return;
  }

  const payload = JSON.stringify({
    from: config.from,
    to: [config.to],
    reply_to: email.replyTo,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
  // The same key on the retry means Resend delivers at most once, even if the
  // first attempt went through but its response was lost.
  const idempotencyKey = crypto.randomUUID();

  for (let attempt = 1; ; attempt++) {
    let status = 0;
    let errorName = '';
    try {
      const response = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'User-Agent': 'portfolio-contact-worker/1.0',
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return;
      status = response.status;
      // Only the error type is logged; Resend's messages can echo addresses back.
      const detail: unknown = await response.json().catch(() => null);
      if (detail && typeof detail === 'object' && 'name' in detail && typeof detail.name === 'string') {
        errorName = detail.name.slice(0, 64);
      }
    } catch (error) {
      errorName = error instanceof Error ? error.name : 'unknown';
    }

    const retryable = status === 0 || status === 429 || status >= 500;
    if (!retryable || attempt >= MAX_ATTEMPTS) {
      console.error(JSON.stringify({ event: 'delivery_failed', status, errorName, attempt }));
      throw new HttpError(502, 'delivery_failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
  }
}
