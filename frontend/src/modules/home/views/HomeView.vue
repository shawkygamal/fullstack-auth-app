<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import BaseBrand from '@/app/components/BaseBrand.vue';
import { RouteName } from '@/app/constants/route-names';
import { useSessionStore } from '@/app/stores/session.store';

const router = useRouter();
const session = useSessionStore();
const { user } = storeToRefs(session);
const signingOut = ref(false);

const userInitial = computed(() => user.value?.name.trim().charAt(0).toUpperCase() || 'U');
const welcomeMessage = computed(() =>
  user.value ? `${user.value.name}, your workspace is ready.` : 'Your workspace is ready.',
);

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
        <div class="topbar__actions">
          <div v-if="user" class="topbar__user">
            <span class="topbar__avatar" aria-hidden="true">{{ userInitial }}</span>
            <span class="topbar__user-name">{{ user.name }}</span>
          </div>
          <button
            class="topbar__sign-out"
            type="button"
            :disabled="signingOut"
            :aria-busy="signingOut"
            @click="onSignOut"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M8 4H4.75A.75.75 0 0 0 4 4.75v10.5c0 .41.34.75.75.75H8" />
              <path d="M11.5 6.5 15 10l-3.5 3.5M15 10H7" />
            </svg>
            {{ signingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>
      </div>
    </header>

    <main class="welcome" aria-labelledby="page-title">
      <section class="welcome__content">
        <div class="welcome__spark" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M24 4.5 29.1 18.9 43.5 24l-14.4 5.1L24 43.5l-5.1-14.4L4.5 24l14.4-5.1L24 4.5Z" />
            <circle cx="24" cy="24" r="3.5" />
          </svg>
        </div>
        <p class="welcome__eyebrow"><span class="welcome__status-dot" /> Signed in and ready</p>
        <h1 id="page-title" class="welcome__title" tabindex="-1">You’re in.</h1>
        <p class="welcome__subtitle">{{ welcomeMessage }}</p>

        <div v-if="user" class="account-card">
          <span class="account-card__label">CURRENTLY SIGNED IN AS</span>
          <strong class="account-card__name">{{ user.name }}</strong>
          <span class="account-card__email">{{ user.email }}</span>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  min-height: 100svh;
  background: radial-gradient(ellipse 36rem 25rem at 50% 55%, rgb(124 92 220 / 11%), transparent 78%), var(--color-bg);
}

.topbar {
  border-bottom: 1px solid rgb(255 255 255 / 7%);
  background: rgb(13 13 16 / 76%);
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

.topbar__actions,
.topbar__user {
  display: flex;
  align-items: center;
}

.topbar__actions {
  gap: 18px;
}

.topbar__user {
  gap: 10px;
  color: var(--color-text);
  font-size: 0.875rem;
}

.topbar__avatar {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 600;
  background: #28213a;
  border: 1px solid #4a3b6c;
  border-radius: 50%;
}

.topbar__sign-out {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.topbar__sign-out svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
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

.welcome__spark {
  display: grid;
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  place-items: center;
  color: var(--color-accent);
  background: linear-gradient(145deg, rgb(167 139 250 / 16%), rgb(167 139 250 / 5%));
  border: 1px solid rgb(167 139 250 / 24%);
  border-radius: 20px;
  box-shadow: 0 0 52px rgb(124 92 220 / 16%);
}

.welcome__spark svg {
  width: 34px;
  height: 34px;
  fill: currentColor;
}

.welcome__spark circle {
  fill: var(--color-bg);
}

.welcome__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #c4b5fd;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.welcome__status-dot {
  width: 7px;
  height: 7px;
  background: #4ade80;
  border-radius: 50%;
  box-shadow: 0 0 10px rgb(74 222 128 / 44%);
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
  margin-top: 16px;
  color: var(--color-muted);
  font-size: 1.0625rem;
  line-height: 1.6;
}

.account-card {
  display: grid;
  width: min(100%, 360px);
  gap: 5px;
  margin-top: 36px;
  padding: 18px 20px;
  text-align: left;
  background: rgb(23 23 28 / 86%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.account-card__label {
  margin-bottom: 4px;
  color: var(--color-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.account-card__name {
  color: var(--color-text-emphasis);
  font-size: 0.9375rem;
  font-weight: 500;
}

.account-card__email {
  color: var(--color-muted);
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

@media (max-width: 520px) {
  .topbar__inner {
    width: min(100% - 32px, 1120px);
    min-height: 68px;
  }

  .topbar__user-name {
    display: none;
  }

  .topbar__actions {
    gap: 12px;
  }

  .welcome {
    min-height: calc(100vh - 69px);
    min-height: calc(100svh - 69px);
    padding: 48px 20px;
  }
}
</style>
