import type { ApiErrorResponse } from '../models/api-error.interface';

export class ApiError extends Error {
  readonly status: number;

  readonly messages: string[];

  /** From the `Retry-After` header of a 429. */
  readonly retryAfterSeconds?: number;

  constructor(status: number, body?: Partial<ApiErrorResponse>, retryAfterSeconds?: number) {
    const messages = body?.messages?.length ? body.messages : ['Something went wrong, please try again.'];
    super(messages.join(', '));
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export const networkError = () => new ApiError(0, { messages: ['Cannot reach the server, check your connection.'] });
