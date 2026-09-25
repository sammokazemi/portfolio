const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefixes an internal path with the configured base path. */
export function url(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** True when `current` is `href` or a page nested under it. */
export function isActive(current: string, href: string): boolean {
  const strip = (p: string) => p.replace(base, '').replace(/\/$/, '') || '/';
  const c = strip(current);
  const h = strip(href);
  return h === '/' ? c === '/' : c === h || c.startsWith(`${h}/`);
}
