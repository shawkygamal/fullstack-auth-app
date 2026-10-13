import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { ApiError } from '@/app/api/api-error';
import { useSessionStore } from '@/app/stores/session.store';
import type { AuthenticatedUserInterface } from '../../models';
import { useAuthRequest } from '../use-auth-request';

describe('useAuthRequest', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  const setup = (request: () => Promise<AuthenticatedUserInterface>) =>
    effectScope().run(() => useAuthRequest(request))!;

  it('starts the session on success', async () => {
    const user = { id: '1', email: 'john@example.com', name: 'John' };
    const { submit } = setup(vi.fn().mockResolvedValue({ accessToken: 'token', user }));

    await expect(submit({})).resolves.toBeUndefined();
    expect(useSessionStore()).toMatchObject({ isAuthenticated: true, accessToken: 'token', user });
  });

  it('announces a 429 once, ticks the button label, and blocks submitting until the wait is over', async () => {
    const request = vi.fn().mockRejectedValue(new ApiError(429, { messages: ['Too many'] }, 90));
    const { submit, errors, isRateLimited, retryInLabel } = setup(request);

    await submit({});

    expect(isRateLimited.value).toBe(true);
    expect(errors.value).toEqual(['Too many attempts. Please try again in 2 minutes.']);
    expect(retryInLabel.value).toBe('1:30');

    vi.advanceTimersByTime(30_000);
    expect(retryInLabel.value).toBe('1:00');
    expect(errors.value).toEqual(['Too many attempts. Please try again in 2 minutes.']);

    await submit({});
    expect(request).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(60_000);
    await vi.waitFor(() => expect(errors.value).toEqual([]));
    expect(isRateLimited.value).toBe(false);
  });

  it('shows the server messages for other errors, such as the attempts-left warning', async () => {
    const messages = ['Invalid email or password', '1 attempt left before sign-in is paused for 15 minutes'];
    const { submit, errors } = setup(vi.fn().mockRejectedValue(new ApiError(401, { messages })));

    const error = await submit({});

    expect(error?.status).toBe(401);
    expect(errors.value).toEqual(messages);
  });
});
