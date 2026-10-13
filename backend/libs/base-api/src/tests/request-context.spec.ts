import type { NextFunction, Request, Response } from "express";

import { REQUEST_ID_HEADER, currentRequestId, requestContextMiddleware } from "../request-context/request-context";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("requestContextMiddleware", () => {
  const run = (incomingId?: string) => {
    const req = { get: jest.fn().mockReturnValue(incomingId) } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    let idInsideRequest: string | undefined;
    const next: NextFunction = () => {
      idInsideRequest = currentRequestId();
    };

    requestContextMiddleware(req, res, next);

    return { idInsideRequest, setHeader: jest.mocked(res.setHeader) };
  };

  it("gives a request without an id a new UUID, sends it back and makes it current while handling", () => {
    const { idInsideRequest, setHeader } = run();

    expect(idInsideRequest).toMatch(UUID);
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, idInsideRequest);
  });

  it("keeps a well-formed id set by the proxy, so its logs and the API's line up", () => {
    const { idInsideRequest, setHeader } = run("3f9c2a7b1e4d4c0a9b8e7f6a5d4c3b2a");

    expect(idInsideRequest).toBe("3f9c2a7b1e4d4c0a9b8e7f6a5d4c3b2a");
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, "3f9c2a7b1e4d4c0a9b8e7f6a5d4c3b2a");
  });

  it.each([["has spaces\nand a forged log line"], ["x".repeat(65)], [""]])("replaces a malformed id (%#)", incomingId => {
    expect(run(incomingId).idInsideRequest).toMatch(UUID);
  });

  it("has no current id outside a request", () => {
    expect(currentRequestId()).toBeUndefined();
  });
});
