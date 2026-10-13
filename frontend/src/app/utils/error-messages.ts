import { ApiError } from '../api/api-error';

export const toErrorMessages = (error: unknown): string[] =>
  error instanceof ApiError ? error.messages : ['Something went wrong, please try again.'];
