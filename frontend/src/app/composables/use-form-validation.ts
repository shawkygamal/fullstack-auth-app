import { computed, ref } from 'vue';

type Validators<T> = { [K in keyof T]: (value: T[K]) => string | undefined };
type Errors<T> = Partial<Record<keyof T, string>>;
type Field<T> = Extract<keyof T, string>;

/**
 * "Reward early, punish late" inline validation:
 * - leaving a field shows its error only if something was typed in it, so tabbing through an empty form stays quiet;
 * - submitting shows every error, including empty required fields;
 * - once shown, an error updates live and disappears the moment the value becomes valid.
 */
export const useFormValidation = <T extends Record<string, string>>(form: T, validators: Validators<T>) => {
  const fields = Object.keys(validators) as Field<T>[];
  const touched = ref(new Set<string>());

  const allErrors = computed(
    () => Object.fromEntries(fields.map(field => [field, validators[field](form[field])])) as Errors<T>,
  );

  const errors = computed(
    () =>
      Object.fromEntries(
        fields.filter(field => touched.value.has(field)).map(field => [field, allErrors.value[field]]),
      ) as Errors<T>,
  );

  /** For blur: starts showing the field's error, unless the field was left empty. */
  const touch = (field: Field<T>) => {
    if (form[field] !== '') touched.value.add(field);
  };

  /** Hides a field's error again, e.g. after the app clears the field itself. */
  const untouch = (field: Field<T>) => {
    touched.value.delete(field);
  };

  /** For submit: shows every error and tells whether the form is valid. */
  const validate = (): boolean => {
    fields.forEach(field => touched.value.add(field));
    return fields.every(field => !allErrors.value[field]);
  };

  return { errors, touch, untouch, validate };
};
