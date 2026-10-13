<template>
  <div class="brand">
    <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2.5 19.8 12.2 29.5 16l-9.7 3.8L16 29.5l-3.8-9.7L2.5 16l9.7-3.8L16 2.5Z" fill="currentColor" />
      <circle cx="16" cy="16" r="2.5" fill="var(--color-bg)" />
    </svg>
    <span>Studio</span>
  </div>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-emphasis);
  font-family: var(--font-display);
  font-size: 1.125rem;
  letter-spacing: 0.01em;
}

.brand__mark {
  width: 28px;
  height: 28px;
  color: var(--color-accent);
}
</style>
