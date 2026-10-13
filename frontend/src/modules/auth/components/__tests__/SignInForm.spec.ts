import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiError } from '@/app/api/api-error';
import { RouteName } from '@/app/constants/route-names';
import { authService } from '../../apis/AuthService';
import SignInForm from '../SignInForm.vue';

vi.mock('../../apis/AuthService', () => ({ authService: { signIn: vi.fn(), signUp: vi.fn() } }));

const user = { id: '1', email: 'john@example.com', name: 'John' };

describe('SignInForm', () => {
  let router: ReturnType<typeof createRouter>;

  const mountForm = async (path = '/sign-in') => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: RouteName.Home, component: { template: '<div />' } },
        { path: '/settings', name: 'settings', component: { template: '<div />' } },
        { path: '/sign-in', name: RouteName.SignIn, component: SignInForm },
      ],
    });
    await router.push(path);
    return mount(SignInForm, { global: { plugins: [router] }, attachTo: document.body });
  };

  const fill = async (wrapper: Awaited<ReturnType<typeof mountForm>>, email: string, password: string) => {
    await wrapper.get('#email').setValue(email);
    await wrapper.get('#password').setValue(password);
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(authService.signIn).mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('does not call the API with an invalid form, shows every error and focuses the first invalid field', async () => {
    const wrapper = await mountForm();

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(authService.signIn).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Enter your email address');
    expect(wrapper.text()).toContain('Enter your password');
    expect(document.activeElement?.id).toBe('email');
  });

  it('stays quiet when empty fields are only tabbed through', async () => {
    const wrapper = await mountForm();

    await wrapper.get('#email').trigger('blur');
    await wrapper.get('#password').trigger('blur');

    expect(wrapper.find('.field__error').exists()).toBe(false);
  });

  it('shows a field error only once the field is left, not while typing', async () => {
    const wrapper = await mountForm();

    await wrapper.get('#email').setValue('john@');
    expect(wrapper.text()).not.toContain('Enter a valid email');

    await wrapper.get('#email').trigger('blur');
    expect(wrapper.text()).toContain('Enter a valid email');
  });

  it('signs in with a trimmed email and goes to the page the user came for', async () => {
    vi.mocked(authService.signIn).mockResolvedValue({ accessToken: 'token', user });
    const wrapper = await mountForm('/sign-in?redirect=/settings');

    await fill(wrapper, '  john@example.com ', 'P@ssw0rd!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(authService.signIn).toHaveBeenCalledWith({ email: 'john@example.com', password: 'P@ssw0rd!' });
    expect(router.currentRoute.value.path).toBe('/settings');
  });

  it('never redirects to another site after signing in', async () => {
    vi.mocked(authService.signIn).mockResolvedValue({ accessToken: 'token', user });
    const wrapper = await mountForm('/sign-in?redirect=//evil.com');

    await fill(wrapper, 'john@example.com', 'P@ssw0rd!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.name).toBe(RouteName.Home);
  });

  it('on wrong credentials keeps the email, clears the password and focuses it', async () => {
    const messages = ['Invalid email or password', '2 attempts left before sign-in is paused for 15 minutes'];
    vi.mocked(authService.signIn).mockRejectedValue(new ApiError(401, { messages }));
    const wrapper = await mountForm();

    await fill(wrapper, 'john@example.com', 'wrong');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain('2 attempts left');
    expect((wrapper.get('#email').element as HTMLInputElement).value).toBe('john@example.com');
    expect((wrapper.get('#password').element as HTMLInputElement).value).toBe('');
    expect(document.activeElement?.id).toBe('password');
    expect(wrapper.text()).not.toContain('Enter your password');
  });

  it('when rate-limited, disables the button with a live countdown until the wait is over', async () => {
    vi.useFakeTimers();
    vi.mocked(authService.signIn).mockRejectedValue(new ApiError(429, { messages: ['Too many'] }, 65));
    const wrapper = await mountForm();

    await fill(wrapper, 'john@example.com', 'P@ssw0rd!');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    const button = () => wrapper.get('button[type="submit"]');
    expect(button().attributes('disabled')).toBeDefined();
    expect(button().text()).toBe('Try again in 1:05');
    expect(wrapper.get('[role="alert"]').text()).toBe('Too many attempts. Please try again in 2 minutes.');

    vi.advanceTimersByTime(5_000);
    await flushPromises();
    expect(button().text()).toBe('Try again in 1:00');

    vi.advanceTimersByTime(60_000);
    await flushPromises();
    expect(button().attributes('disabled')).toBeUndefined();
    expect(button().text()).toBe('Sign in');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
});
