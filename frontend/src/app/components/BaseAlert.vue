<script setup lang="ts">
withDefaults(defineProps<{ messages: string[]; variant?: 'error' | 'info' }>(), { variant: 'error' });
</script>

<template>
  <!--
    Rendered only with messages, so it takes no space otherwise. An inserted role=alert is announced right away;
    role=status is read politely, which suits notices already present when the page opens.
  -->
  <div
    v-if="messages.length"
    class="alert"
    :class="`alert--${variant}`"
    :role="variant === 'error' ? 'alert' : 'status'"
  >
    <p v-for="message in messages" :key="message">
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.alert {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  font-size: 0.875rem;
  border: 1px solid;
  border-radius: var(--radius-sm);
}

.alert--error {
  color: var(--color-danger);
  background: var(--color-danger-bg);
  border-color: var(--color-danger-border);
}

.alert--info {
  color: var(--color-text);
  background: var(--color-info-bg);
  border-color: var(--color-info-border);
}
</style>
