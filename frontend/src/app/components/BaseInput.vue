<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    type?: 'text' | 'email' | 'password';
    autocomplete?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    maxlength?: number;
  }>(),
  { type: 'text', autocomplete: undefined, error: undefined, maxlength: undefined },
);

const model = defineModel<string>({ required: true });

const emit = defineEmits<{ blur: [] }>();

const slots = useSlots();

const isPassword = computed(() => props.type === 'password');
const revealed = ref(false);
const capsLockOn = ref(false);

const inputType = computed(() => (isPassword.value && revealed.value ? 'text' : props.type));
const inputMode = computed(() => (props.type === 'email' ? 'email' : undefined));

const errorId = computed(() => `${props.id}-error`);
const descriptionId = computed(() => `${props.id}-description`);
const capsLockId = computed(() => `${props.id}-caps-lock`);

const describedBy = computed(
  () =>
    [props.error && errorId.value, capsLockOn.value && capsLockId.value, slots.description && descriptionId.value]
      .filter(Boolean)
      .join(' ') || undefined,
);

const detectCapsLock = (event: KeyboardEvent) => {
  if (isPassword.value) capsLockOn.value = event.getModifierState?.('CapsLock') ?? false;
};

const onBlur = () => {
  capsLockOn.value = false;
  emit('blur');
};
</script>

<template>
  <div class="field">
    <label :for="id" class="field__label">
      {{ label }}
    </label>
    <div class="field__control">
      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :inputmode="inputMode"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :maxlength="maxlength"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="describedBy"
        autocapitalize="off"
        spellcheck="false"
        class="field__input"
        :class="{ 'field__input--invalid': error, 'field__input--with-toggle': isPassword }"
        @keydown="detectCapsLock"
        @keyup="detectCapsLock"
        @blur="onBlur"
      />
      <button
        v-if="isPassword"
        type="button"
        class="field__toggle"
        :aria-pressed="revealed"
        :aria-controls="id"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        @click="revealed = !revealed"
      >
        {{ revealed ? 'Hide' : 'Show' }}
      </button>
    </div>
    <p v-if="error" :id="errorId" class="field__error">
      {{ error }}
    </p>
    <p v-if="capsLockOn" :id="capsLockId" class="field__hint" role="status">Caps Lock is on</p>
    <div v-if="$slots.description" :id="descriptionId">
      <slot name="description" />
    </div>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
}

.field__label {
  color: var(--color-text-emphasis);
  font-size: 0.875rem;
  font-weight: 500;
}

.field__control {
  position: relative;
}

.field__input {
  width: 100%;
  min-height: var(--control-height);
  padding: 10px 12px;
  font: inherit;
  /* 16px or more stops iOS Safari from zooming into the field on focus. */
  font-size: max(1rem, 16px);
  color: var(--color-text-emphasis);
  caret-color: var(--color-text-emphasis);
  background: var(--color-field);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  transition:
    border-color 0.15s,
    outline-color 0.15s;
}

.field__input:hover:not(:disabled, :focus-visible) {
  border-color: var(--color-input-border-hover);
}

/* The ring is an outline, so the autofill rule below can keep using box-shadow. */
.field__input:focus-visible {
  border-color: var(--color-text-emphasis);
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Browsers paint autofilled fields light blue or yellow; keep them on the dark field colour. */
.field__input:autofill {
  -webkit-text-fill-color: var(--color-text-emphasis);
  box-shadow: 0 0 0 1000px var(--color-field) inset;
}

.field__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field__input--with-toggle {
  padding-right: 72px;
}

.field__input--invalid,
.field__input--invalid:hover:not(:disabled, :focus-visible) {
  border-color: var(--color-danger);
}

.field__input--invalid:focus-visible {
  outline-color: var(--color-danger);
}

.field__toggle {
  position: absolute;
  top: 50%;
  right: 4px;
  min-width: 56px;
  min-height: 36px;
  transform: translateY(-50%);
  padding: 0 10px;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-muted);
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.field__toggle:hover {
  color: var(--color-text-emphasis);
  background: var(--color-hover);
}

.field__error {
  color: var(--color-danger);
  font-size: 0.8125rem;
}

.field__hint {
  color: var(--color-muted);
  font-size: 0.8125rem;
}
</style>
