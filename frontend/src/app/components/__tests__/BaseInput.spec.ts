import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BaseInput from '../BaseInput.vue';

const mountInput = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(BaseInput, { props: { id: 'field', label: 'Field', modelValue: '', ...props }, slots });

describe('BaseInput', () => {
  it('labels the input', () => {
    const wrapper = mountInput();

    expect(wrapper.get('label').attributes('for')).toBe('field');
    expect(wrapper.get('input').attributes('id')).toBe('field');
  });

  it('ties the error to the input for assistive technology', () => {
    const wrapper = mountInput({ error: 'Required' });
    const input = wrapper.get('input');

    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe('field-error');
    expect(wrapper.get('#field-error').text()).toBe('Required');
  });

  it('describes the input with the description slot', () => {
    const wrapper = mountInput({}, { description: '<p>Rules</p>' });

    expect(wrapper.get('input').attributes('aria-describedby')).toBe('field-description');
  });

  it('updates the model while typing', async () => {
    const wrapper = mountInput();

    await wrapper.get('input').setValue('hello');

    expect(wrapper.emitted('update:modelValue')).toEqual([['hello']]);
  });

  it('shows and hides a password', async () => {
    const wrapper = mountInput({ type: 'password' });
    const toggle = wrapper.get('button');

    expect(wrapper.get('input').attributes('type')).toBe('password');
    expect(toggle.attributes('aria-pressed')).toBe('false');

    await toggle.trigger('click');

    expect(wrapper.get('input').attributes('type')).toBe('text');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    expect(toggle.attributes('aria-label')).toBe('Hide password');
  });

  it('warns when Caps Lock is on in a password field', async () => {
    const wrapper = mountInput({ type: 'password' });
    const input = wrapper.get('input');

    await input.trigger('keydown', { modifierCapsLock: true });

    expect(wrapper.text()).toContain('Caps Lock is on');
    expect(input.attributes('aria-describedby')).toBe('field-caps-lock');

    await input.trigger('blur');

    expect(wrapper.text()).not.toContain('Caps Lock is on');
  });

  it('opens the email keyboard on mobile for email fields', () => {
    expect(mountInput({ type: 'email' }).get('input').attributes('inputmode')).toBe('email');
  });
});
