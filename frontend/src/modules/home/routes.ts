import type { RouteRecordRaw } from 'vue-router';
import { RouteName } from '@/app/constants/route-names';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: RouteName.Home,
    component: () => import('./views/HomeView.vue'),
    meta: { requiresAuth: true, title: 'Home' },
  },
];

export default routes;
