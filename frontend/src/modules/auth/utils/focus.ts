import { nextTick } from 'vue';

/** Moves focus to the first invalid field once the DOM shows the errors, so keyboard and screen-reader users land on it. */
export const focusFirstInvalidField = async (form: HTMLElement | null) => {
  await nextTick();
  form?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
};

export const focusField = async (id: string) => {
  await nextTick();
  document.getElementById(id)?.focus();
};
