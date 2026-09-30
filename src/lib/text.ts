/**
 * Splits an email address before the @, so markup can put a <wbr> there and a
 * narrow column wraps the address at a natural point instead of mid-word.
 */
export function splitEmail(email: string): [string, string] {
  const at = email.indexOf('@');
  return at > 0 ? [email.slice(0, at), email.slice(at)] : [email, ''];
}
