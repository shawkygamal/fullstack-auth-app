import { describe, expect, it } from 'vitest';
import { formatDuration, humanizeDuration } from '../format-duration';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [9, '0:09'],
    [75, '1:15'],
    [900, '15:00'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('humanizeDuration', () => {
  it.each([
    [1, '1 second'],
    [45, '45 seconds'],
    [60, '1 minute'],
    [61, '2 minutes'],
    [900, '15 minutes'],
  ])('reads %i seconds as %s', (seconds, expected) => {
    expect(humanizeDuration(seconds)).toBe(expected);
  });
});
