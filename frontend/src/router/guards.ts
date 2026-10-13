import { nextTick } from 'vue';
import type { NavigationGuard, NavigationHookAfter, RouteLocationNormalized } from 'vue-router';
import { RouteName } from '@/app/constants/route-names';
import { useSessionStore } from '@/app/stores/session.store';

const APP_TITLE = 'Auth App';

/** On the first navigation, asks the server (via the refresh cookie) whether we are still signed in, then gates routes. */
export const sessionGuard: NavigationGuard = async to => {
  const session = useSessionStore();
  await session.restoreSession();

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    // Come back here after signing in; the home page is the default anyway.
    return { name: RouteName.SignIn, query: to.fullPath === '/' ? {} : { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && session.isAuthenticated) return { name: RouteName.Home };
};

/**
 * Sets the document title, and after in-app navigations moves focus to the page heading so screen readers announce
 * the new page (an SPA does not trigger the page-load announcement a full navigation would).
 */
export const announcePage: NavigationHookAfter = (to: RouteLocationNormalized, from, failure) => {
  if (failure) return;

  document.title = to.meta.title ? `${to.meta.title} · ${APP_TITLE}` : APP_TITLE;

  if (from.matched.length) {
    void nextTick(() => document.getElementById('page-title')?.focus());
  }
};

/** A lazy route chunk fails to load after a deploy replaced it: load the page fresh instead of breaking. */
export const isChunkLoadError = (error: unknown) =>
  error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message);
