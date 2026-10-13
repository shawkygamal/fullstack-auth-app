<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password';
    icon?: 'user' | 'email' | 'lock';
    autocomplete?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    maxlength?: number;
  }>(),
  {
    type: 'text',
    placeholder: undefined,
    icon: undefined,
    autocomplete: undefined,
    error: undefined,
    maxlength: undefined,
  },
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
      <span v-if="icon" class="field__icon" aria-hidden="true">
        <svg v-if="icon === 'user'" viewBox="0 0 20 20">
          <circle cx="10" cy="6.5" r="3" />
          <path d="M3.75 17a6.25 6.25 0 0 1 12.5 0" />
        </svg>
        <svg v-else-if="icon === 'email'" viewBox="0 0 20 20">
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="m3.5 6 6.5 5 6.5-5" />
        </svg>
        <svg v-else viewBox="0 0 20 20">
          <rect x="3.5" y="8.5" width="13" height="9" rx="2" />
          <path d="M6.5 8.5v-3a3.5 3.5 0 0 1 7 0v3" />
        </svg>
      </span>
      <input
        :id="id"
        v-model="model"
        :placeholder="placeholder"
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
        :class="{
          'field__input--invalid': error,
          'field__input--with-icon': icon,
          'field__input--with-toggle': isPassword,
        }"
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
        <svg v-if="!revealed" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M2 10s2.9-5 8-5 8 5 8 5-2.9 5-8 5-8-5-8-5Z" />
          <circle cx="10" cy="10" r="2.25" />
        </svg>
        <svg v-else viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="m3 3 14 14M8.2 5.3c.6-.2 1.2-.3 1.8-.3 5.1 0 8 5 8 5a14.3 14.3 0 0 1-2.1 2.7M5.6 5.6C3.2 7 2 10 2 10s2.9 5 8 5c.9 0 1.8-.2 2.6-.5"
          />
        </svg>
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

.field__icon {
  position: absolute;
  top: 50%;
  left: 12px;
  display: grid;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  color: var(--color-muted);
  pointer-events: none;
}

.field__icon svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.35;
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
  padding-right: 56px;
}

.field__input--with-icon {
  padding-left: 40px;
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
  min-width: 40px;
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

.field__toggle svg {
  display: block;
  width: 18px;
  height: 18px;
  margin: auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.4;
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
