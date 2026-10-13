import { describe, expect, it } from 'vitest';
import { safeRedirect } from '../safe-redirect';

describe('safeRedirect', () => {
  it.each(['/', '/settings', '/a/b?c=d#e'])('keeps the in-app path %p', path => {
    expect(safeRedirect(path)).toBe(path);
  });

  it.each(['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'relative', '', null, undefined])(
    'drops %p',
    value => {
      expect(safeRedirect(value)).toBeUndefined();
    },
  );

  it('drops a repeated parameter', () => {
    expect(safeRedirect(['/a', '/b'])).toBeUndefined();
  });
});
