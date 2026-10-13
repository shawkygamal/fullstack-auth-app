/** Route names are referenced, never URLs, so paths can change in one place. */
export const RouteName = {
  Home: 'home',
  SignIn: 'sign-in',
  SignUp: 'sign-up',
  NotFound: 'not-found',
} as const;

export type RouteName = (typeof RouteName)[keyof typeof RouteName];
