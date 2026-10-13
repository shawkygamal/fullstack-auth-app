export const NAME_MIN_LENGTH = 3;

export const NAME_MAX_LENGTH = 100;

export const PASSWORD_MIN_LENGTH = 8;

// bcrypt only hashes the first 72 bytes, so anything longer would be silently truncated.
export const PASSWORD_MAX_LENGTH = 72;

// At least one letter, one number and one special character (anything that is not a letter, digit or space).
export const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).*$/;

export const PASSWORD_HASH_ROUNDS = 12;
