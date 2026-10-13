import { createRouter, createWebHistory } from 'vue-router';
import { RouteName } from '@/app/constants/route-names';
import authRoutes from '@/modules/auth/routes';
import homeRoutes from '@/modules/home/routes';
import { announcePage, isChunkLoadError, sessionGuard } from './guards';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    title?: string;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...homeRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: RouteName.NotFound,
      component: () => import('@/app/views/NotFoundView.vue'),
      meta: { title: 'Page not found' },
    },
  ],
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
});

router.beforeEach(sessionGuard);
router.afterEach(announcePage);
router.onError((error, to) => {
  if (isChunkLoadError(error)) window.location.assign(to.fullPath);
});

export default router;
