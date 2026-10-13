import type { LocationQueryValue } from 'vue-router';

/**
 * The `redirect` query parameter if it points inside this app, otherwise undefined. Only same-origin paths are
 * accepted: `//evil.com` and `/\evil.com` are protocol-relative to browsers and would be an open redirect.
 */
export const safeRedirect = (value: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined => {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined;
  return value;
};
