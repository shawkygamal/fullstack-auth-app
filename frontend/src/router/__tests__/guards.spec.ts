import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { RouteName } from '@/app/constants/route-names';
import { useSessionStore } from '@/app/stores/session.store';
import { isChunkLoadError, sessionGuard } from '../guards';

const Empty = { template: '<div />' };

const createTestRouter = (): Router => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: RouteName.Home, component: Empty, meta: { requiresAuth: true } },
      { path: '/settings', name: 'settings', component: Empty, meta: { requiresAuth: true } },
      { path: '/sign-in', name: RouteName.SignIn, component: Empty, meta: { guestOnly: true } },
    ],
  });
  router.beforeEach(sessionGuard);
  return router;
};

describe('sessionGuard', () => {
  beforeEach(() => setActivePinia(createPinia()));

  const signedIn = (value: boolean) => {
    const session = useSessionStore();
    vi.spyOn(session, 'restoreSession').mockResolvedValue();
    if (value) session.startSession('token', { id: '1', email: 'john@example.com', name: 'John' });
    else session.clearSession();
  };

  it('sends a signed-out user to sign in, remembering where they were going', async () => {
    signedIn(false);
    const router = createTestRouter();

    await router.push('/settings');

    expect(router.currentRoute.value.name).toBe(RouteName.SignIn);
    expect(router.currentRoute.value.query.redirect).toBe('/settings');
  });

  it('does not add a redirect for the home page, which is the default anyway', async () => {
    signedIn(false);
    const router = createTestRouter();

    await router.push('/');

    expect(router.currentRoute.value.fullPath).toBe('/sign-in');
  });

  it('keeps a signed-in user away from the sign-in page', async () => {
    signedIn(true);
    const router = createTestRouter();

    await router.push('/sign-in');

    expect(router.currentRoute.value.name).toBe(RouteName.Home);
  });

  it('waits for the session to be restored before deciding', async () => {
    const session = useSessionStore();
    vi.spyOn(session, 'restoreSession').mockImplementation(() => {
      session.startSession('token', { id: '1', email: 'john@example.com', name: 'John' });
      return Promise.resolve();
    });
    const router = createTestRouter();

    await router.push('/settings');

    expect(router.currentRoute.value.name).toBe('settings');
  });
});

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: /assets/HomeView-123.js',
    'Importing a module script failed.',
  ])('recognizes %p', message => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isChunkLoadError(new Error('boom'))).toBe(false);
  });
});
