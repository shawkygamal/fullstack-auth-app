<script setup lang="ts">
import BaseBrand from '@/app/components/BaseBrand.vue';

defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <main class="card-layout" aria-labelledby="page-title">
    <BaseBrand />
    <section class="card">
      <header class="card__header">
        <!-- tabindex=-1: the router moves focus here after each navigation, so screen readers announce the new page. -->
        <h1 id="page-title" class="card__title" tabindex="-1">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="card__subtitle">
          {{ subtitle }}
        </p>
      </header>
      <slot />
    </section>
    <footer v-if="$slots.footer" class="card-layout__footer">
      <slot name="footer" />
    </footer>
  </main>
</template>

<style scoped>
.card-layout {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  min-height: 100vh;
  min-height: 100svh;
  padding: 32px 16px;
  background: radial-gradient(ellipse 26rem 18rem at 50% 42%, rgb(124 92 220 / 12%), transparent 78%), var(--color-bg);
}

.card {
  position: relative;
  display: grid;
  gap: 24px;
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 24px 80px rgb(0 0 0 / 32%);
}

@media (max-width: 480px) {
  .card {
    padding: 24px 20px;
  }
}

.card__header {
  display: grid;
  gap: 6px;
}

.card__title {
  color: var(--color-text-emphasis);
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.card__title:focus {
  outline: none;
}

.card__subtitle {
  color: var(--color-muted);
  font-size: 0.9375rem;
  overflow-wrap: anywhere;
}

.card-layout__footer {
  color: var(--color-muted);
  font-size: 0.875rem;
  text-align: center;
}
</style>
