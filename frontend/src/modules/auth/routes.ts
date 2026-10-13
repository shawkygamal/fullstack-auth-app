import type { RouteRecordRaw } from 'vue-router';
import { RouteName } from '@/app/constants/route-names';

const routes: RouteRecordRaw[] = [
  {
    path: '/sign-in',
    name: RouteName.SignIn,
    component: () => import('./views/SignInView.vue'),
    meta: { guestOnly: true, title: 'Sign in' },
  },
  {
    path: '/sign-up',
    name: RouteName.SignUp,
    component: () => import('./views/SignUpView.vue'),
    meta: { guestOnly: true, title: 'Sign up' },
  },
];

export default routes;
