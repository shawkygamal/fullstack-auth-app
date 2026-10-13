// @vitest-environment node
// The store needs no DOM, and Node's BroadcastChannel only works with its own Event class.
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/api-error';
import { sessionService } from '../../api/SessionService';
import { useSessionStore } from '../session.store';

vi.mock('../../api/SessionService', () => ({
  sessionService: { refresh: vi.fn(), signOut: vi.fn(), getProfile: vi.fn() },
}));

const user = { id: '1', email: 'john@example.com', name: 'John' };

describe('session store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(sessionService.refresh).mockReset();
    vi.mocked(sessionService.getProfile).mockReset();
    vi.mocked(sessionService.signOut).mockReset();
  });

  describe('restoreSession', () => {
    it('restores the session from the refresh cookie', async () => {
      vi.mocked(sessionService.refresh).mockResolvedValue({ accessToken: 'token' });
      vi.mocked(sessionService.getProfile).mockResolvedValue(user);
      const session = useSessionStore();

      await session.restoreSession();

      expect(session).toMatchObject({ isAuthenticated: true, accessToken: 'token', user });
    });

    it('is anonymous when there is no session', async () => {
      vi.mocked(sessionService.refresh).mockRejectedValue(new ApiError(401));
      const session = useSessionStore();

      await session.restoreSession();

      expect(session.status).toBe('anonymous');
      expect(sessionService.getProfile).not.toHaveBeenCalled();
    });

    it('asks the server only once', async () => {
      vi.mocked(sessionService.refresh).mockRejectedValue(new ApiError(401));
      const session = useSessionStore();

      await Promise.all([session.restoreSession(), session.restoreSession()]);
      await session.restoreSession();

      expect(sessionService.refresh).toHaveBeenCalledOnce();
    });
  });

  it('shares one refresh between concurrent callers', async () => {
    vi.mocked(sessionService.refresh).mockResolvedValue({ accessToken: 'fresh' });
    const session = useSessionStore();

    const tokens = await Promise.all([session.refreshAccessToken(), session.refreshAccessToken()]);

    expect(tokens).toEqual(['fresh', 'fresh']);
    expect(sessionService.refresh).toHaveBeenCalledOnce();
  });

  it('lets a network failure during refresh through, rather than signing the user out', async () => {
    vi.mocked(sessionService.refresh).mockRejectedValue(new ApiError(0));

    await expect(useSessionStore().refreshAccessToken()).rejects.toMatchObject({ status: 0 });
  });

  it('signs out locally even when the server cannot be reached', async () => {
    vi.mocked(sessionService.signOut).mockRejectedValue(new ApiError(0));
    const session = useSessionStore();
    session.startSession('token', user);

    await expect(session.signOut()).rejects.toBeInstanceOf(ApiError);

    expect(session).toMatchObject({ isAuthenticated: false, accessToken: null, user: null });
  });

  it('mirrors sign-in and sign-out between tabs', async () => {
    vi.mocked(sessionService.refresh).mockResolvedValue({ accessToken: 'tab-b-token' });
    vi.mocked(sessionService.getProfile).mockResolvedValue(user);
    vi.mocked(sessionService.signOut).mockResolvedValue(undefined);
    const tabA = useSessionStore(createPinia());
    const tabB = useSessionStore(createPinia());
    const changesInB: string[] = [];
    tabA.syncAcrossTabs(() => undefined);
    tabB.syncAcrossTabs(change => changesInB.push(change));

    tabA.startSession('tab-a-token', user);
    await vi.waitFor(() => expect(changesInB).toEqual(['signed-in']));
    expect(tabB).toMatchObject({ isAuthenticated: true, accessToken: 'tab-b-token', user });

    await tabA.signOut();
    await vi.waitFor(() => expect(changesInB).toEqual(['signed-in', 'signed-out']));
    expect(tabB.isAuthenticated).toBe(false);
  });
});
