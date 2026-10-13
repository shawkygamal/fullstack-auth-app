import { ApiError, networkError } from './api-error';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** A request that hangs would otherwise leave a spinner up forever; past this it fails like a lost connection. */
const REQUEST_TIMEOUT_MS = 15_000;

export interface HttpAuth {
  getAccessToken: () => string | null;
  /** Resolves a fresh access token, or null when the session is over. */
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void;
}

export interface RequestOptions {
  /** Send the access token, and on a 401 refresh it once and retry. Off for the auth routes themselves. */
  authenticated?: boolean;
}

let auth: HttpAuth | null = null;

export const configureHttpAuth = (httpAuth: HttpAuth) => {
  auth = httpAuth;
};

async function send(method: string, path: string, body: unknown, accessToken: string | null): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      // The refresh cookie is httpOnly and scoped to /api/auth; the browser attaches it, scripts never see it.
      credentials: 'include',
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw networkError();
  }
}

async function parse<T>(response: Response): Promise<T> {
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);

  if (!response.ok) {
    const retryAfter = Number(response.headers.get('Retry-After'));
    throw new ApiError(response.status, data, retryAfter > 0 ? retryAfter : undefined);
  }

  return data as T;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  { authenticated = true }: RequestOptions = {},
): Promise<T> {
  const accessToken = authenticated ? (auth?.getAccessToken() ?? null) : null;
  const response = await send(method, path, body, accessToken);

  if (response.status === 401 && accessToken && auth) {
    const freshToken = await auth.refreshAccessToken();

    if (freshToken) return parse<T>(await send(method, path, body, freshToken));

    auth.onSessionExpired();
  }

  return parse<T>(response);
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
};

export type HttpClient = typeof http;
