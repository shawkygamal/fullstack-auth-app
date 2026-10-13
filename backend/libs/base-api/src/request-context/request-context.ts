import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export const REQUEST_ID_HEADER = "X-Request-Id";

/** Accepted from a proxy or client only when it looks like an id, so log lines cannot be forged or bloated. */
const VALID_REQUEST_ID = /^[\w.-]{1,64}$/;

interface RequestContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** The id of the request being handled, or undefined outside a request (startup, shutdown). */
export function currentRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/**
 * Gives each request an id: the proxy's `X-Request-Id` when present and well-formed, otherwise a new UUID.
 * The id is sent back in the same header and is available to everything that runs for the request, so every
 * log line it produces can carry it.
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get(REQUEST_ID_HEADER);
  const requestId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();

  res.setHeader(REQUEST_ID_HEADER, requestId);
  storage.run({ requestId }, next);
}
