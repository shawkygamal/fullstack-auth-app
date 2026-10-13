import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ApiError } from '../api-error';
import { configureHttpAuth, http, type HttpAuth } from '../http';

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

describe('http', () => {
  let fetchMock: Mock<typeof fetch>;
  let auth: { [K in keyof HttpAuth]: Mock<HttpAuth[K]> };

  const authorizationOf = (call: number) =>
    ((fetchMock.mock.calls.at(call)?.[1] as RequestInit).headers as Record<string, string>).Authorization;

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    auth = {
      getAccessToken: vi.fn<HttpAuth['getAccessToken']>().mockReturnValue('expired-token'),
      refreshAccessToken: vi.fn<HttpAuth['refreshAccessToken']>().mockResolvedValue('fresh-token'),
      onSessionExpired: vi.fn<HttpAuth['onSessionExpired']>(),
    };
    configureHttpAuth(auth);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('refreshes the access token once on a 401 and retries the request', async () => {
    fetchMock.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(200, { name: 'John' }));

    await expect(http.get('/users/me')).resolves.toEqual({ name: 'John' });
    expect(authorizationOf(0)).toBe('Bearer expired-token');
    expect(authorizationOf(1)).toBe('Bearer fresh-token');
  });

  it('ends the session when the refresh token is no longer valid', async () => {
    auth.refreshAccessToken.mockResolvedValue(null);
    fetchMock.mockResolvedValueOnce(json(401, { messages: ['Unauthorized'] }));

    await expect(http.get('/users/me')).rejects.toBeInstanceOf(ApiError);
    expect(auth.onSessionExpired).toHaveBeenCalledOnce();
  });

  it('never sends the access token nor refreshes for the auth routes', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { messages: ['Invalid email or password'] }));

    await expect(http.post('/auth/login', {}, { authenticated: false })).rejects.toMatchObject({ status: 401 });
    expect(authorizationOf(0)).toBeUndefined();
    expect(auth.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('reads Retry-After from a 429', async () => {
    fetchMock.mockResolvedValueOnce(json(429, { messages: ['Too many'] }, { 'Retry-After': '90' }));

    await expect(http.post('/auth/login', {}, { authenticated: false })).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 90,
    });
  });

  it('gives every request a timeout, so a hanging server cannot leave the UI waiting forever', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));

    await http.get('/users/me');

    expect((fetchMock.mock.calls.at(0)?.[1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it('turns a failed fetch into a readable network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(http.get('/users/me')).rejects.toMatchObject({ status: 0 });
  });
});
