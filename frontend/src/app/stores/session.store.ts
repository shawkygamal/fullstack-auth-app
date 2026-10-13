import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ApiError } from '../api/api-error';
import { sessionService } from '../api/SessionService';
import type { UserInterface } from '../models/user.interface';

type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';
export type RemoteSessionChange = 'signed-in' | 'signed-out';

const CHANNEL_NAME = 'auth-app.session';

/**
 * The signed-in session. The access token lives in memory only (never in script-readable storage); a reload restores
 * it from the httpOnly refresh cookie. Sign-in and sign-out are mirrored to other tabs.
 */
export const useSessionStore = defineStore('session', () => {
  const accessToken = ref<string | null>(null);
  const user = ref<UserInterface | null>(null);
  const status = ref<SessionStatus>('unknown');

  const isAuthenticated = computed(() => status.value === 'authenticated');

  let restoring: Promise<void> | null = null;
  let refreshing: Promise<string | null> | null = null;
  let channel: BroadcastChannel | null = null;

  function setSession(token: string, sessionUser: UserInterface) {
    accessToken.value = token;
    user.value = sessionUser;
    status.value = 'authenticated';
  }

  function clearSession() {
    accessToken.value = null;
    user.value = null;
    status.value = 'anonymous';
  }

  /** Single-flight: requests that fail with 401 together share one refresh instead of racing to rotate the cookie. */
  function refreshAccessToken(): Promise<string | null> {
    refreshing ??= sessionService
      .refresh()
      .then(({ accessToken: token }) => {
        accessToken.value = token;
        return token;
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });

    return refreshing;
  }

  async function loadSession() {
    try {
      const token = await refreshAccessToken();
      if (!token) return clearSession();
      setSession(token, await sessionService.getProfile());
    } catch {
      clearSession();
    }
  }

  /** Resolves once we know whether the browser holds a session; only the first call hits the API. */
  function restoreSession(): Promise<void> {
    restoring ??= loadSession();
    return restoring;
  }

  function startSession(token: string, sessionUser: UserInterface) {
    setSession(token, sessionUser);
    channel?.postMessage('signed-in' satisfies RemoteSessionChange);
  }

  /** Ends the session on the server too; still signs out locally when the server cannot be reached. */
  async function signOut() {
    try {
      await sessionService.signOut();
    } finally {
      clearSession();
      channel?.postMessage('signed-out' satisfies RemoteSessionChange);
    }
  }

  /** Mirrors sign-in and sign-out from other tabs, then lets the caller react (e.g. navigate). */
  function syncAcrossTabs(onChange: (change: RemoteSessionChange) => void) {
    if (channel || typeof BroadcastChannel === 'undefined') return;

    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener('message', ({ data }: MessageEvent<RemoteSessionChange>) => {
      void (async () => {
        if (data === 'signed-out') clearSession();
        else await (restoring = loadSession());
        onChange(data);
      })();
    });
  }

  return {
    accessToken,
    user,
    status,
    isAuthenticated,
    clearSession,
    refreshAccessToken,
    restoreSession,
    startSession,
    signOut,
    syncAcrossTabs,
  };
});
