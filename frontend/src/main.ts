import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { configureHttpAuth } from './app/api/http';
import { RouteName } from './app/constants/route-names';
import { useSessionStore } from './app/stores/session.store';
// Self-hosted fonts (bundled, so no third-party request and nothing to add to the CSP): Inter for text, Cal Sans for headings.
import '@fontsource-variable/inter/wght.css';
import '@fontsource/cal-sans/latin-400.css';
import './app/styles/main.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const session = useSessionStore(pinia);

configureHttpAuth({
  getAccessToken: () => session.accessToken,
  refreshAccessToken: session.refreshAccessToken,
  onSessionExpired: () => {
    session.clearSession();
    const { fullPath } = router.currentRoute.value;
    const redirect = fullPath === '/' ? {} : { redirect: fullPath };
    void router.replace({ name: RouteName.SignIn, query: { reason: 'expired', ...redirect } });
  },
});

session.syncAcrossTabs(change => {
  if (change === 'signed-out') void router.replace({ name: RouteName.SignIn, query: { reason: 'signed-out' } });
  else void router.replace({ name: RouteName.Home });
});

app.use(router);

// The single place unexpected errors surface; an error tracker (e.g. Sentry) would hook in here.
app.config.errorHandler = (error, _instance, info) => {
  console.error(`[app] ${info}`, error);
};

app.mount('#app');
