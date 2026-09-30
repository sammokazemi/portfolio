import { describe, expect, it } from 'vitest';
import { cleanLine, cleanText, isEmail, isTimeZone, LIMITS, parseSubmission, parseWhen } from '../src/validate';
import { chars, validBody } from './helpers';

const CR = chars(0x0d);
const LF = chars(0x0a);

describe('isEmail', () => {
  it.each([
    'jane@example.com',
    'first.last+tag@mail.example.co.uk',
    "o'brien@example.ie",
    'x@xn--80ak6aa92e.com',
    'UPPER@EXAMPLE.COM',
  ])('accepts %s', (value) => {
    expect(isEmail(value)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['no at sign', 'plain'],
    ['no local part', '@example.com'],
    ['no domain', 'jane@'],
    ['single-label domain', 'jane@localhost'],
    ['double at', 'jane@@example.com'],
    ['space', 'jane doe@example.com'],
    ['address list', 'jane@example.com,evil@example.net'],
    ['address list with space', 'jane@example.com, evil@example.net'],
    ['header injection', `jane@example.com${CR}${LF}Bcc: evil@example.net`],
    ['quoted local part', '"jane"@example.com'],
    ['angle brackets', '<jane@example.com>'],
    ['display name', 'Jane <jane@example.com>'],
    ['consecutive dots', 'jane..doe@example.com'],
    ['leading dot', '.jane@example.com'],
    ['label starting with hyphen', 'jane@-example.com'],
    ['numeric TLD', 'jane@example.123'],
    ['IP literal', 'jane@[127.0.0.1]'],
    ['bare IP', 'jane@1.2.3.4'],
    ['non-ASCII', `j${chars(0xe4)}ne@example.com`],
    ['local part over 64', `${'a'.repeat(65)}@example.com`],
    ['over 254 overall', `jane@${['a', 'b', 'c', 'd', 'e'].map((c) => c.repeat(60)).join('.')}.com`],
  ])('rejects %s', (_, value) => {
    expect(isEmail(value)).toBe(false);
  });
});

describe('cleanLine', () => {
  it('turns line breaks into a single space so nothing can start a new header line', () => {
    expect(cleanLine(`Hello${CR}${LF}Bcc: evil@example.net`)).toBe('Hello Bcc: evil@example.net');
    expect(cleanLine(`a${chars(0x2028)}b${chars(0x2029)}c`)).toBe('a b c');
  });

  it('collapses whitespace and trims', () => {
    expect(cleanLine(`  Jane \t  Doe  `)).toBe('Jane Doe');
  });

  it('strips control, zero-width, and bidi override characters', () => {
    const sneaky = `Jane${chars(0x00)}${chars(0x07)}${chars(0x200b)} ${chars(0x202e)}eoD${chars(0x2066)}${chars(0xfeff)}`;
    expect(cleanLine(sneaky)).toBe('Jane eoD');
  });

  it('keeps the joiners Persian text and emoji depend on', () => {
    const persian = `${chars(0x0645, 0x06cc)}${chars(0x200c)}${chars(0x062e, 0x0648, 0x0627, 0x0647, 0x0645)}`;
    expect(cleanLine(persian)).toBe(persian);
    const family = chars(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467);
    expect(cleanLine(family)).toBe(family);
  });

  it('normalizes to NFC', () => {
    expect(cleanLine(`Jose${chars(0x0301)}`)).toBe(`Jos${chars(0xe9)}`);
  });
});

describe('cleanText', () => {
  it('normalizes line endings', () => {
    expect(cleanText(`one${CR}${LF}two${CR}three${chars(0x2028)}four`)).toBe(`one${LF}two${LF}three${LF}four`);
  });

  it('keeps paragraphs but caps runs of blank lines', () => {
    expect(cleanText(`a${LF.repeat(2)}b${LF.repeat(9)}c`)).toBe(`a${LF.repeat(2)}b${LF.repeat(3)}c`);
  });

  it('drops trailing whitespace on each line and invisible characters', () => {
    expect(cleanText(`hi   ${LF}there${chars(0x202d)}${chars(0x0b)}  `)).toBe(`hi${LF}there`);
  });
});

describe('parseWhen', () => {
  it('accepts datetime-local values', () => {
    expect(parseWhen('2026-10-03T14:30')).toBe('2026-10-03T14:30');
    expect(parseWhen('2026-10-03T14:30:15')).toBe('2026-10-03T14:30');
    expect(parseWhen('2028-02-29T09:05')).toBe('2028-02-29T09:05');
  });

  it.each(['2026-02-30T10:00', '2027-02-29T10:00', '2026-13-01T10:00', '2026-10-03T24:00', '2026-10-03T12:60', '1999-12-31T23:59', '2101-01-01T00:00', '2026-10-03', 'tomorrow', '2026-10-03T14:30Z'])(
    'rejects %s',
    (value) => {
      expect(parseWhen(value)).toBeNull();
    },
  );
});

describe('isTimeZone', () => {
  it.each(['America/Los_Angeles', 'Asia/Tehran', 'UTC', 'America/Argentina/Buenos_Aires', 'Etc/GMT+8'])('accepts %s', (value) => {
    expect(isTimeZone(value)).toBe(true);
  });

  it.each(['Not/AZone', '../etc/passwd', "America/Los_Angeles'", '', 'A'.repeat(65)])('rejects %s', (value) => {
    expect(isTimeZone(value)).toBe(false);
  });
});

describe('parseSubmission', () => {
  it('returns a clean message for valid input', () => {
    const result = parseSubmission(
      validBody({
        name: '  Jane   Doe ',
        company: 'Acme',
        subject: 'Hello',
        when: '2026-10-03T14:30',
        timeZone: 'America/Los_Angeles',
      }),
    );
    expect(result).toEqual({
      ok: true,
      value: {
        message: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: 'Acme',
          subject: 'Hello',
          message: 'Hello! I would love to talk about a role on our team.',
          when: '2026-10-03T14:30',
          timeZone: 'America/Los_Angeles',
        },
        turnstileToken: '0.real-turnstile-token',
      },
    });
  });

  it('treats null and missing optional fields as empty', () => {
    const result = parseSubmission(validBody({ company: null, subject: undefined }));
    expect(result.ok && result.value.message.company).toBe('');
    expect(result.ok && result.value.message.subject).toBe('');
  });

  it('reports every missing required field', () => {
    const result = parseSubmission({});
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['email', 'message', 'name', 'turnstile']);
  });

  it('treats whitespace-only values as missing', () => {
    const result = parseSubmission(validBody({ name: ` ${chars(0x200b)} `, message: `${LF}${LF}` }));
    expect(!result.ok && result.errors).toEqual({ name: 'Please enter your name.', message: 'Please enter a message.' });
  });

  it('rejects non-string values instead of coercing them', () => {
    const result = parseSubmission(validBody({ name: { toString: 'x' }, email: ['jane@example.com'], message: 42 }));
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['email', 'message', 'name']);
  });

  it('enforces length limits exactly', () => {
    expect(parseSubmission(validBody({ message: 'a'.repeat(LIMITS.message) })).ok).toBe(true);
    const tooLong = parseSubmission(validBody({ message: 'a'.repeat(LIMITS.message + 1) }));
    expect(!tooLong.ok && tooLong.errors.message).toMatch(/5,000 characters/);

    for (const field of ['name', 'company', 'subject'] as const) {
      const result = parseSubmission(validBody({ [field]: 'a'.repeat(LIMITS[field] + 1) }));
      expect(!result.ok && result.errors[field]).toBeTruthy();
    }
  });

  it('rejects an invalid email address', () => {
    const result = parseSubmission(validBody({ email: 'jane@example.com, evil@example.net' }));
    expect(!result.ok && result.errors).toEqual({ email: 'Please enter a valid email address.' });
  });

  it('rejects an invalid preferred time', () => {
    const result = parseSubmission(validBody({ when: '2026-02-30T10:00' }));
    expect(!result.ok && result.errors).toEqual({ when: 'Please choose a valid date and time.' });
  });

  it('keeps the time zone only with a preferred time, and drops a bad one', () => {
    const noWhen = parseSubmission(validBody({ timeZone: 'Asia/Tehran' }));
    expect(noWhen.ok && noWhen.value.message.timeZone).toBe('');
    const badZone = parseSubmission(validBody({ when: '2026-10-03T14:30', timeZone: 'Mars/Olympus' }));
    expect(badZone.ok && badZone.value.message.timeZone).toBe('');
  });

  it('requires a well-formed Turnstile token', () => {
    for (const turnstileToken of ['', 'has space', 'x'.repeat(LIMITS.turnstileToken + 1), `tok${chars(0xe9)}n`]) {
      const result = parseSubmission(validBody({ turnstileToken }));
      expect(!result.ok && result.errors).toEqual({ turnstile: 'Please complete the verification challenge.' });
    }
  });

  it('ignores fields it does not know about, including prototype keys', () => {
    // JSON.parse makes "__proto__" an own property, exactly as a hostile request body would.
    const input = JSON.parse(
      JSON.stringify(validBody()).replace('{', '{"__proto__":{"admin":true},"to":"evil@example.net",'),
    );
    const result = parseSubmission(input);
    expect(result.ok).toBe(true);
    expect(result.ok && Object.keys(result.value.message).sort()).toEqual(
      ['company', 'email', 'message', 'name', 'subject', 'timeZone', 'when'],
    );
    expect(({} as Record<string, unknown>).admin).toBeUndefined();
  });
});
