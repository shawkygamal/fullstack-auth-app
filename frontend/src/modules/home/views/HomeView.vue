<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseBrand from '@/app/components/BaseBrand.vue';
import { RouteName } from '@/app/constants/route-names';
import { useSessionStore } from '@/app/stores/session.store';

const router = useRouter();
const session = useSessionStore();
const signingOut = ref(false);

const onSignOut = async () => {
  signingOut.value = true;
  try {
    await session.signOut();
  } finally {
    await router.replace({ name: RouteName.SignIn });
  }
};
</script>

<template>
  <div class="home-page">
    <header class="topbar">
      <div class="topbar__inner">
        <BaseBrand />
        <button
          class="topbar__sign-out"
          type="button"
          :disabled="signingOut"
          :aria-busy="signingOut"
          @click="onSignOut"
        >
          {{ signingOut ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>
    </header>

    <main class="welcome" aria-labelledby="page-title">
      <section class="welcome__content">
        <div class="welcome__art" aria-hidden="true">
          <svg class="welcome__gem" viewBox="0 0 96 112">
            <defs>
              <linearGradient id="gem-front" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#c4a8ff" />
                <stop offset="1" stop-color="#7044df" />
              </linearGradient>
              <linearGradient id="gem-side" x1="0" y1="0" x2="0.9" y2="1">
                <stop offset="0" stop-color="#9d7af7" />
                <stop offset="1" stop-color="#462b98" />
              </linearGradient>
              <linearGradient id="gem-top" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#d8c6ff" />
                <stop offset="1" stop-color="#8b68f4" />
              </linearGradient>
            </defs>
            <path d="m48 8 27 18v54L48 96V8Z" fill="url(#gem-front)" />
            <path d="M48 8 22 27v50l26 19V8Z" fill="url(#gem-side)" />
            <path d="m48 8 27 18-27 18-26-17L48 8Z" fill="url(#gem-top)" />
            <path d="m48 44 27-18v54L48 96V44Z" fill="#774edb" opacity=".34" />
          </svg>
        </div>
        <h1 id="page-title" class="welcome__title" tabindex="-1">You’re in.</h1>
        <p class="welcome__subtitle">Your workspace is ready.</p>
        <div class="welcome__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 12.5 3.2 3.2L17.5 8" />
          </svg>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  min-height: 100svh;
  background: radial-gradient(ellipse 20rem 13rem at 50% 53%, rgb(124 76 238 / 16%), transparent 78%), var(--color-bg);
}

.topbar {
  border-bottom: 1px solid rgb(255 255 255 / 8%);
  background: rgb(11 11 14 / 72%);
  backdrop-filter: blur(16px);
}

.topbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(100% - 40px, 1120px);
  min-height: 76px;
  margin: 0 auto;
}

.topbar__sign-out {
  min-width: 88px;
  min-height: 42px;
  padding: 0 14px;
  color: var(--color-text-emphasis);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgb(255 255 255 / 3%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    opacity 0.15s;
}

.topbar__sign-out:hover:not(:disabled) {
  background: var(--color-hover);
  border-color: #55515f;
}

.topbar__sign-out:disabled {
  cursor: progress;
  opacity: 0.65;
}

.welcome {
  display: grid;
  min-height: calc(100vh - 77px);
  min-height: calc(100svh - 77px);
  padding: 56px 20px;
  place-items: center;
}

.welcome__content {
  display: flex;
  width: min(100%, 520px);
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.welcome__art {
  position: relative;
  display: grid;
  width: 132px;
  height: 148px;
  margin-bottom: 22px;
  place-items: center;
}

.welcome__art::before {
  position: absolute;
  right: 4px;
  bottom: 12px;
  left: 4px;
  height: 28px;
  background: radial-gradient(ellipse, rgb(126 75 239 / 62%), transparent 72%);
  content: '';
  filter: blur(9px);
}

.welcome__gem {
  position: relative;
  width: 76px;
  height: 90px;
  filter: drop-shadow(0 14px 20px rgb(120 71 230 / 35%));
}

.welcome__title {
  color: var(--color-text-emphasis);
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 8vw, 4.5rem);
  font-weight: 400;
  line-height: 1.04;
  letter-spacing: -0.035em;
}

.welcome__title:focus {
  outline: none;
}

.welcome__subtitle {
  margin-top: 14px;
  color: var(--color-muted);
  font-size: 1.0625rem;
  line-height: 1.6;
}

.welcome__check {
  display: grid;
  width: 31px;
  height: 31px;
  margin-top: 28px;
  place-items: center;
  color: #75ebba;
  border: 1px solid currentColor;
  border-radius: 50%;
  box-shadow: 0 0 18px rgb(117 235 186 / 10%);
}

.welcome__check svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

@media (max-width: 520px) {
  .topbar__inner {
    width: min(100% - 32px, 1120px);
    min-height: 68px;
  }

  .welcome {
    min-height: calc(100vh - 69px);
    min-height: calc(100svh - 69px);
    padding: 48px 20px;
  }
}
</style>
