<script setup lang="ts">
withDefaults(defineProps<{ showName?: boolean }>(), { showName: true });
</script>

<template>
  <div class="brand">
    <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="m3.5 24 9-16 7.1 12.5M18.5 24l5.1-9 5 9" />
    </svg>
    <span v-if="showName">Studio</span>
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
  width: 40px;
  height: 32px;
  color: var(--color-accent);
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.8;
}
</style>
