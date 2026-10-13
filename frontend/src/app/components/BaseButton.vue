<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary';
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { type: 'button', variant: 'primary' },
);
</script>

<template>
  <button
    :type="type"
    class="button"
    :class="`button--${variant}`"
    :disabled="loading || disabled"
    :aria-busy="loading"
  >
    <span v-if="loading" class="button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: var(--control-height);
  padding: 10px 16px;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.1s;
}

.button:active:not(:disabled) {
  transform: scale(0.99);
}

.button:disabled {
  cursor: not-allowed;
}

/* Busy keeps its colours, so the label ("Signing in…") reads as progress rather than as a disabled action. */
.button[aria-busy='true'] {
  cursor: progress;
  opacity: 0.8;
}

.button--primary {
  color: var(--color-primary-text);
  background: var(--color-primary);
}

.button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.button--primary:disabled:not([aria-busy='true']) {
  color: var(--color-muted);
  background: var(--color-hover);
  border-color: var(--color-border);
}

.button--secondary {
  color: var(--color-text-emphasis);
  background: transparent;
  border-color: var(--color-border);
}

.button--secondary:hover:not(:disabled) {
  background: var(--color-hover);
  border-color: var(--color-input-border);
}

.button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
