import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { useFormValidation } from '../use-form-validation';

const validateEmail = (value: string) => (value.includes('@') ? undefined : 'Email is invalid');
const validateName = (value: string) => (value.trim() ? undefined : 'Name is required');

const setup = () => {
  const form = reactive({ email: '', name: '' });
  return { form, ...useFormValidation(form, { email: validateEmail, name: validateName }) };
};

describe('useFormValidation', () => {
  it('shows a field error once a filled-in field is left', () => {
    const { form, errors, touch } = setup();
    form.email = 'john';
    expect(errors.value.email).toBeUndefined();

    touch('email');

    expect(errors.value.email).toBe('Email is invalid');
    expect(errors.value.name).toBeUndefined();
  });

  it('stays quiet when an empty field is only tabbed through', () => {
    const { errors, touch } = setup();

    touch('email');
    touch('name');

    expect(errors.value).toEqual({});
  });

  it('shows every error on submit, empty required fields included, and reports invalid', () => {
    const { errors, validate } = setup();

    expect(validate()).toBe(false);
    expect(errors.value).toEqual({ email: 'Email is invalid', name: 'Name is required' });
  });

  it('clears an error as soon as the value becomes valid', () => {
    const { form, errors, validate } = setup();
    validate();

    form.email = 'john@example.com';
    form.name = 'John';

    expect(errors.value.email).toBeUndefined();
    expect(validate()).toBe(true);
  });

  it('hides an error again once the field is untouched', () => {
    const { form, errors, touch, untouch } = setup();
    form.email = 'john';
    touch('email');

    untouch('email');

    expect(errors.value.email).toBeUndefined();
  });
});
