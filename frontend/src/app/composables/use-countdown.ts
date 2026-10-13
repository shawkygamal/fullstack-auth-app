import { onScopeDispose, ref } from 'vue';

/** Seconds left until a deadline, ticking every second; 0 when idle or done. */
export const useCountdown = () => {
  const remaining = ref(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  const stop = () => {
    clearInterval(timer);
    timer = undefined;
  };

  const start = (seconds: number) => {
    stop();
    const endsAt = Date.now() + seconds * 1000;
    const tick = () => {
      remaining.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (remaining.value === 0) stop();
    };
    tick();
    timer = setInterval(tick, 1000);
  };

  onScopeDispose(stop);

  return { remaining, start };
};
