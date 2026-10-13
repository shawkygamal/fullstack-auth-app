<script setup lang="ts">
import BaseBrand from '@/app/components/BaseBrand.vue';

defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <main class="card-layout">
    <section class="card" aria-labelledby="page-title">
      <header class="card__header">
        <BaseBrand :show-name="false" />
        <!-- tabindex=-1: the router moves focus here after each navigation, so screen readers announce the new page. -->
        <h1 id="page-title" class="card__title" tabindex="-1">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="card__subtitle">
          {{ subtitle }}
        </p>
      </header>
      <slot />
      <footer v-if="$slots.footer" class="card__footer">
        <slot name="footer" />
      </footer>
    </section>
  </main>
</template>

<style scoped>
.card-layout {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100svh;
  padding: 32px 16px;
  background:
    radial-gradient(
      ellipse 26rem 18rem at 50% 42%,
      color-mix(in srgb, var(--color-glow) 12%, transparent),
      transparent 78%
    ),
    var(--color-bg);
}

.card {
  position: relative;
  display: grid;
  gap: 22px;
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 24px 80px rgb(0 0 0 / 32%);
}

@media (max-width: 480px) {
  .card-layout {
    padding-right: 28px;
    padding-left: 28px;
  }

  .card {
    padding: 24px 20px;
  }

  .card__title {
    font-size: 1.5rem;
  }

  .card__footer {
    font-size: 0.8125rem;
  }
}

.card__header {
  display: grid;
  justify-items: center;
  gap: 16px;
  text-align: center;
}

.card__title {
  color: var(--color-text-emphasis);
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.card__title:focus {
  outline: none;
}

.card__subtitle {
  color: var(--color-muted);
  font-size: 0.9375rem;
  overflow-wrap: anywhere;
}

.card__footer {
  padding-top: 2px;
  color: var(--color-muted);
  font-size: 0.875rem;
  text-align: center;
}
</style>
