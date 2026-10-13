/** For a ticking display: 75 → "1:15", 9 → "0:09" */
export const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/** For a sentence read once: 45 → "45 seconds", 61 → "2 minutes" (rounded up, never promising too short a wait) */
export const humanizeDuration = (totalSeconds: number): string => {
  if (totalSeconds < 60) return `${totalSeconds} ${totalSeconds === 1 ? 'second' : 'seconds'}`;
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
};
