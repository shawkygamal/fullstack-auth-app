<script setup lang="ts">
import { PASSWORD_RULES } from '../utils/validators';

defineProps<{ password: string }>();
</script>

<template>
  <ul class="password-rules" :class="{ 'visually-hidden': !password }">
    <li
      v-for="rule in PASSWORD_RULES"
      :key="rule.label"
      class="password-rules__item"
      :class="{ 'password-rules__item--met': rule.test(password) }"
    >
      <span class="password-rules__icon" aria-hidden="true">{{ rule.test(password) ? '✓' : '○' }}</span>
      {{ rule.label }}
      <span class="visually-hidden">{{ rule.test(password) ? '(done)' : '(not yet)' }}</span>
    </li>
  </ul>
</template>

<style scoped>
.password-rules {
  display: grid;
  gap: 2px;
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.password-rules__item--met {
  color: var(--color-text-emphasis);
}

.password-rules__item--met .password-rules__icon {
  color: var(--color-success);
}

.password-rules__icon {
  display: inline-block;
  width: 1.25em;
}
</style>
