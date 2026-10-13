import { computed, ref, watch } from 'vue';
import { ApiError } from '@/app/api/api-error';
import { useCountdown } from '@/app/composables/use-countdown';
import { useSessionStore } from '@/app/stores/session.store';
import { toErrorMessages } from '@/app/utils/error-messages';
import { formatDuration, humanizeDuration } from '@/app/utils/format-duration';
import type { AuthenticatedUserInterface } from '../models';

/**
 * Runs a sign-in or sign-up request and starts the session on success.
 *
 * While the server rate-limits the user it counts down the `Retry-After` it sent: the alert announces the wait once
 * (a live region updated every second would be re-read by screen readers every second), and `retryInLabel` ticks for
 * the submit button, which stays disabled until the wait is over.
 */
export const useAuthRequest = <T>(request: (body: T) => Promise<AuthenticatedUserInterface>) => {
  const session = useSessionStore();
  const { remaining: retryIn, start: startCountdown } = useCountdown();

  const loading = ref(false);
  const errors = ref<string[]>([]);

  const isRateLimited = computed(() => retryIn.value > 0);
  const retryInLabel = computed(() => formatDuration(retryIn.value));

  watch(isRateLimited, limited => {
    if (!limited) errors.value = [];
  });

  /** @returns the error on failure, nothing on success */
  const submit = async (body: T): Promise<ApiError | undefined> => {
    if (isRateLimited.value || loading.value) return;

    loading.value = true;
    errors.value = [];
    try {
      const { accessToken, user } = await request(body);
      session.startSession(accessToken, user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429 && error.retryAfterSeconds) {
        startCountdown(error.retryAfterSeconds);
        errors.value = [`Too many attempts. Please try again in ${humanizeDuration(error.retryAfterSeconds)}.`];
      } else {
        errors.value = toErrorMessages(error);
      }
      return error instanceof ApiError ? error : new ApiError(0);
    } finally {
      loading.value = false;
    }
  };

  return { submit, loading, errors, isRateLimited, retryInLabel };
};
