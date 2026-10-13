<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <main class="card-layout" aria-labelledby="page-title">
    <div class="brand">
      <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path d="M11 14v-3a5 5 0 0 1 10 0v3" fill="none" stroke="var(--color-bg)" stroke-width="2.5" />
        <rect x="8" y="14" width="16" height="11" rx="2.5" fill="var(--color-bg)" />
      </svg>
      Auth App
    </div>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 100vh;
  padding: 32px 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-emphasis);
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.01em;
}

.brand__mark {
  width: 28px;
  height: 28px;
}

.card {
  display: grid;
  gap: 24px;
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
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
  font-size: 1.625rem;
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
