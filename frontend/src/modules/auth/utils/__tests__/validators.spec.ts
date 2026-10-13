import { describe, expect, it } from 'vitest';
import { validateEmail, validateName, validateNewPassword, validateRequiredPassword } from '../validators';

describe('validateEmail', () => {
  it.each(['john@example.com', '  john@example.com  '])('accepts %p', email => {
    expect(validateEmail(email)).toBeUndefined();
  });

  it.each(['', 'john', 'john@', 'john@example', 'jo hn@example.com'])('rejects %p', email => {
    expect(validateEmail(email)).toBeDefined();
  });
});

describe('validateName', () => {
  it('accepts 3 characters', () => {
    expect(validateName('Bob')).toBeUndefined();
  });

  it.each(['', 'Jo', '  Jo  '])('rejects %p', name => {
    expect(validateName(name)).toBeDefined();
  });
});

describe('validateRequiredPassword', () => {
  it('only checks presence, so sign in does not leak the sign-up rules', () => {
    expect(validateRequiredPassword('x')).toBeUndefined();
    expect(validateRequiredPassword('')).toBeDefined();
  });
});

describe('validateNewPassword', () => {
  it('accepts a password meeting every rule', () => {
    expect(validateNewPassword('P@ssw0rd')).toBeUndefined();
  });

  it.each([
    ['too short', 'P@ss1'],
    ['no letter', '12345678!'],
    ['no number', 'Password!'],
    ['no special character', 'Passw0rd'],
    ['too long', `P@ssw0rd${'a'.repeat(70)}`],
  ])('rejects a password with %s', (_, password) => {
    expect(validateNewPassword(password)).toBeDefined();
  });
});
