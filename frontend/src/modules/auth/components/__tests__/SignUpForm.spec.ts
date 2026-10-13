import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiError } from '@/app/api/api-error';
import { RouteName } from '@/app/constants/route-names';
import { authService } from '../../apis/AuthService';
import SignUpForm from '../SignUpForm.vue';

vi.mock('../../apis/AuthService', () => ({ authService: { signIn: vi.fn(), signUp: vi.fn() } }));

describe('SignUpForm', () => {
  let router: ReturnType<typeof createRouter>;

  const mountForm = async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: RouteName.Home, component: { template: '<div />' } },
        { path: '/sign-up', name: RouteName.SignUp, component: SignUpForm },
      ],
    });
    await router.push('/sign-up');
    return mount(SignUpForm, { global: { plugins: [router] }, attachTo: document.body });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(authService.signUp).mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('ticks off the password rules as the user types, and describes the password field with them', async () => {
    const wrapper = await mountForm();
    const metRules = () => wrapper.findAll('.password-rules__item--met').map(item => item.text());

    expect(metRules()).toEqual([]);
    expect(wrapper.get('#password').attributes('aria-describedby')).toBe('password-description');

    await wrapper.get('#password').setValue('abc1');
    expect(metRules()).toEqual([
      expect.stringContaining('At least one letter'),
      expect.stringContaining('At least one number'),
    ]);

    await wrapper.get('#password').setValue('abcd123!');
    expect(metRules()).toHaveLength(4);
  });

  it('enforces the task rules before calling the API', async () => {
    const wrapper = await mountForm();

    await wrapper.get('#email').setValue('not-an-email');
    await wrapper.get('#name').setValue('Jo');
    await wrapper.get('#password').setValue('password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(authService.signUp).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Enter a valid email address');
    expect(wrapper.text()).toContain('Name must be at least 3 characters');
    expect(wrapper.text()).toContain('Password needs: at least one number');
  });

  it('creates the account with trimmed values and opens the application page', async () => {
    vi.mocked(authService.signUp).mockResolvedValue({
      accessToken: 'token',
      user: { id: '1', email: 'jane@example.com', name: 'Jane Doe' },
    });
    const wrapper = await mountForm();

    await wrapper.get('#email').setValue(' jane@example.com ');
    await wrapper.get('#name').setValue('  Jane Doe ');
    await wrapper.get('#password').setValue('P@ssw0rd!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(authService.signUp).toHaveBeenCalledWith({
      email: 'jane@example.com',
      name: 'Jane Doe',
      password: 'P@ssw0rd!',
    });
    expect(router.currentRoute.value.name).toBe(RouteName.Home);
  });

  it('points the user at the email when it is already registered', async () => {
    vi.mocked(authService.signUp).mockRejectedValue(
      new ApiError(409, { messages: ['This email is already registered'] }),
    );
    const wrapper = await mountForm();

    await wrapper.get('#email').setValue('jane@example.com');
    await wrapper.get('#name').setValue('Jane Doe');
    await wrapper.get('#password').setValue('P@ssw0rd!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe('This email is already registered');
    expect(document.activeElement?.id).toBe('email');
  });
});
