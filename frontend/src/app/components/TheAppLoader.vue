<template>
  <div class="app-loader" role="status">
    <span class="app-loader__spinner" aria-hidden="true" />
    <span class="visually-hidden">Loading…</span>
  </div>
</template>

<style scoped>
.app-loader {
  display: grid;
  place-items: center;
  min-height: 100vh;
}

.app-loader__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-text-emphasis);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
