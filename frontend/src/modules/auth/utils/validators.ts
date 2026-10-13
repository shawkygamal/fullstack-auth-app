// Mirrors the backend RegisterDto rules, so the user sees the same constraints before submitting.
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: password => password.length >= PASSWORD_MIN_LENGTH },
  { label: 'At least one letter', test: password => /[A-Za-z]/.test(password) },
  { label: 'At least one number', test: password => /\d/.test(password) },
  { label: 'At least one special character', test: password => /[^A-Za-z\d\s]/.test(password) },
];

export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Enter your email address';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address, like name@example.com';
};

export const validateName = (name: string): string | undefined => {
  const length = name.trim().length;
  if (length < NAME_MIN_LENGTH) return `Name must be at least ${NAME_MIN_LENGTH} characters`;
  if (length > NAME_MAX_LENGTH) return `Name must be at most ${NAME_MAX_LENGTH} characters`;
};

export const validateRequiredPassword = (password: string): string | undefined => {
  if (!password) return 'Enter your password';
};

export const validateNewPassword = (password: string): string | undefined => {
  if (!password) return 'Choose a password';
  if (password.length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  const failed = PASSWORD_RULES.find(rule => !rule.test(password));
  if (failed) return `Password needs: ${failed.label.toLowerCase()}`;
};
