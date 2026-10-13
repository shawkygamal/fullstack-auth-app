export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** Failed attempts are counted over this window, and sign-in stays paused this long once the limit is hit. */
export const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** The 401 starts warning how many attempts are left once this few remain. */
export const WARN_WHEN_ATTEMPTS_LEFT = 2;

export const REFRESH_TOKEN_BYTES = 32;

/**
 * How long a just-rotated refresh token is still accepted. Tabs that refresh at the same moment all send the
 * same cookie; only the first rotates it, the others ride on the grace period instead of being signed out.
 */
export const REFRESH_ROTATION_GRACE_MS = 30 * 1000;
