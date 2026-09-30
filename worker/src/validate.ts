// Parses and sanitizes a contact submission. Nothing from the request reaches
// the email without passing through here.

/** Maximum lengths, in UTF-16 code units to match the form's `maxlength` attributes. */
export const LIMITS = {
  name: 100,
  email: 254,
  company: 120,
  subject: 150,
  message: 5000,
  turnstileToken: 2048,
  timeZone: 64,
} as const;

export type Field = 'name' | 'email' | 'company' | 'subject' | 'when' | 'message' | 'turnstile';
export type FieldErrors = Partial<Record<Field, string>>;

export interface ContactMessage {
  name: string;
  email: string;
  /** Empty when not given, as are `subject`, `when`, and `timeZone`. */
  company: string;
  subject: string;
  message: string;
  /** Preferred meeting time exactly as entered, `YYYY-MM-DDTHH:MM` (no time zone). */
  when: string;
  /** The visitor's IANA time zone as reported by their browser. Only kept alongside `when`. */
  timeZone: string;
}

export interface Submission {
  message: ContactMessage;
  turnstileToken: string;
}

export type ParseResult = { ok: true; value: Submission } | { ok: false; errors: FieldErrors };

// Characters that can hide or reorder text: C0/C1 controls (tab, LF, and CR are
// handled separately), zero-width space, word joiners and invisible operators,
// bidi embeddings/overrides/isolates, and the BOM. ZWJ/ZWNJ and LRM/RLM are kept
// because Persian text and emoji legitimately rely on them.
const INVISIBLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/** One line of plain text: every run of whitespace, including line breaks, becomes one space. */
export function cleanLine(value: string): string {
  return value.normalize('NFC').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
}

/** Multi-line plain text with normalized line endings and no runaway blank space. */
export function cleanText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\r\n?|[\u0085\u2028\u2029]/g, '\n')
    .replace(INVISIBLE, '')
    .replace(/[^\S\n]+$/gm, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

// RFC 5321 dot-atom local part and LDH domain labels, ASCII only. Deliberately
// excludes quotes, spaces, commas, and angle brackets, so a value can only ever
// be a single address when it's used as the Reply-To.
const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

export function isEmail(value: string): boolean {
  if (value.length > LIMITS.email) return false;
  const at = value.lastIndexOf('@');
  if (at < 1) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (local.length > 64 || !LOCAL_PART.test(local)) return false;
  if (domain.length > 253) return false;
  const labels = domain.split('.');
  if (labels.length < 2 || !labels.every((label) => DOMAIN_LABEL.test(label))) return false;
  // Top-level domains are never all digits; this also rules out bare IP addresses.
  return /[A-Za-z]/.test(labels[labels.length - 1]!);
}

const WHEN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?$/;

/** Returns `YYYY-MM-DDTHH:MM` for a real calendar date and time, or null. */
export function parseWhen(value: string): string | null {
  const match = WHEN.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1, 6).map(Number) as [number, number, number, number, number];
  if (year < 2000 || year > 2100) return null;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const real =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute;
  return real ? value.slice(0, 16) : null;
}

const TIME_ZONE = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){0,2}$/;

export function isTimeZone(value: string): boolean {
  if (value.length > LIMITS.timeZone || !TIME_ZONE.test(value)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const TOKEN = /^[\x21-\x7E]+$/;

export function parseSubmission(input: Record<string, unknown>): ParseResult {
  const errors: FieldErrors = {};

  // Every field is optional at the type level; missing and null both mean "not given".
  // Anything that isn't a string is rejected rather than coerced.
  const read = (key: string, field: Field): string => {
    const value = Object.hasOwn(input, key) ? input[key] : undefined;
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    errors[field] = 'This field is not valid.';
    return '';
  };

  const name = cleanLine(read('name', 'name'));
  const email = cleanLine(read('email', 'email'));
  const company = cleanLine(read('company', 'company'));
  const subject = cleanLine(read('subject', 'subject'));
  const message = cleanText(read('message', 'message'));
  const whenRaw = cleanLine(read('when', 'when'));
  const timeZoneRaw = cleanLine(read('timeZone', 'when'));
  const turnstileToken = read('turnstileToken', 'turnstile').trim();

  if (!errors.name) {
    if (!name) errors.name = 'Please enter your name.';
    else if (name.length > LIMITS.name) errors.name = `Please keep your name to ${LIMITS.name} characters or fewer.`;
  }
  if (!errors.email) {
    if (!email) errors.email = 'Please enter your email address.';
    else if (!isEmail(email)) errors.email = 'Please enter a valid email address.';
  }
  if (!errors.company && company.length > LIMITS.company) {
    errors.company = `Please keep the company name to ${LIMITS.company} characters or fewer.`;
  }
  if (!errors.subject && subject.length > LIMITS.subject) {
    errors.subject = `Please keep the subject to ${LIMITS.subject} characters or fewer.`;
  }
  if (!errors.message) {
    if (!message) errors.message = 'Please enter a message.';
    else if (message.length > LIMITS.message) {
      errors.message = `Please keep your message to ${LIMITS.message.toLocaleString('en-US')} characters or fewer.`;
    }
  }

  let when = '';
  if (!errors.when && whenRaw) {
    const parsed = parseWhen(whenRaw);
    if (parsed) when = parsed;
    else errors.when = 'Please choose a valid date and time.';
  }
  // The time zone comes from the browser, not the visitor, so a bad one is dropped, not reported.
  const timeZone = when && isTimeZone(timeZoneRaw) ? timeZoneRaw : '';

  if (!errors.turnstile) {
    const valid = turnstileToken.length <= LIMITS.turnstileToken && TOKEN.test(turnstileToken);
    if (!valid) errors.turnstile = 'Please complete the verification challenge.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { message: { name, email, company, subject, message, when, timeZone }, turnstileToken },
  };
}
