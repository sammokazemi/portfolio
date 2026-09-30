import { describe, expect, it } from 'vitest';
import { buildEmail, escapeHtml, formatWhen } from '../src/email';
import type { ContactMessage } from '../src/validate';
import { chars } from './helpers';

const LF = chars(0x0a);

function message(overrides: Partial<ContactMessage> = {}): ContactMessage {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: '',
    subject: '',
    message: 'Hello there',
    when: '',
    timeZone: '',
    ...overrides,
  };
}

const meta = { receivedAt: new Date('2026-09-29T04:30:00Z'), country: 'US' };

/** ICU puts narrow no-break spaces in formatted times; compare them as plain spaces. */
const plain = (value: string) => value.replace(/\s/g, ' ');

describe('escapeHtml', () => {
  it('escapes every character that matters in text and attributes', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });
});

describe('formatWhen', () => {
  it('formats the time as entered, labeled with the visitor time zone', () => {
    expect(plain(formatWhen('2026-10-03T14:30', 'America/Los_Angeles'))).toBe(
      'Sat, Oct 3, 2026, 2:30 PM (America/Los Angeles)',
    );
  });

  it('falls back to a generic label without a time zone', () => {
    expect(plain(formatWhen('2026-10-03T09:05', ''))).toBe('Sat, Oct 3, 2026, 9:05 AM (their local time)');
  });
});

describe('buildEmail', () => {
  it('uses the subject when given and the name otherwise', () => {
    expect(buildEmail(message({ subject: 'Project inquiry' }), meta).subject).toBe(
      '[Portfolio] Project inquiry (Jane Doe)',
    );
    expect(buildEmail(message(), meta).subject).toBe('[Portfolio] New message from Jane Doe');
  });

  it('keeps the subject to 200 characters', () => {
    expect(buildEmail(message({ subject: 'x'.repeat(150), name: 'y'.repeat(100) }), meta).subject).toHaveLength(200);
  });

  it('replies to the sender', () => {
    expect(buildEmail(message(), meta).replyTo).toBe('jane@example.com');
  });

  it('lists only the fields that were filled in', () => {
    const { text } = buildEmail(message({ company: 'Acme', when: '2026-10-03T14:30', timeZone: 'Asia/Tehran' }), meta);
    expect(text).toContain('Name: Jane Doe');
    expect(text).toContain('Email: jane@example.com');
    expect(text).toContain('Company: Acme');
    expect(plain(text)).toContain('Preferred time: Sat, Oct 3, 2026, 2:30 PM (Asia/Tehran)');
    expect(text).not.toContain('Subject:');
    expect(text).toContain(`Message:${LF}Hello there`);
    expect(plain(text)).toContain('Received Sep 28, 2026, 9:30 PM Pacific from US.');
  });

  it('omits the country when unknown', () => {
    expect(buildEmail(message(), { ...meta, country: '' }).text).toMatch(/Pacific\.\n/);
  });

  it('escapes all visitor input in the HTML body', () => {
    const { html } = buildEmail(
      message({
        name: '<script>alert(1)</script>',
        company: '"><img src=x onerror=alert(1)>',
        subject: "' onmouseover='alert(1)",
        message: `<b>bold</b>${LF}<a href="javascript:alert(1)">click</a> & more`,
      }),
      meta,
    );
    expect(html).not.toMatch(/<script|<img|<b>|<a |javascript:alert\(1\)">/i);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&#39; onmouseover=&#39;alert(1)');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;<br>&lt;a href=&quot;javascript:alert(1)&quot;&gt;click&lt;/a&gt; &amp; more');
  });

  it('renders right-to-left text in the right direction', () => {
    const { html } = buildEmail(message({ message: chars(0x0633, 0x0644, 0x0627, 0x0645) }), meta);
    expect(html).toContain(`<div dir="auto"`);
  });
});
