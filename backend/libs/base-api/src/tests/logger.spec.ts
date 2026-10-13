import type { NextFunction, Request, Response } from "express";

import { AppLogger, logLevelsFrom } from "../logger/logger";
import { requestContextMiddleware } from "../request-context/request-context";

describe("logLevelsFrom", () => {
  it("prints the configured level and every more severe one", () => {
    expect(logLevelsFrom("log")).toEqual(["log", "warn", "error", "fatal"]);
    expect(logLevelsFrom("warn")).toEqual(["warn", "error", "fatal"]);
    expect(logLevelsFrom("verbose")).toHaveLength(6);
  });
});

describe("AppLogger", () => {
  const capture = (log: () => void): string[] => {
    const lines: string[] = [];
    const write = jest.spyOn(process.stdout, "write").mockImplementation(chunk => {
      lines.push(String(chunk));
      return true;
    });

    log();
    write.mockRestore();

    return lines;
  };

  const insideRequest = (requestId: string, log: () => void) => {
    const req = { get: () => requestId } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;

    requestContextMiddleware(req, res, log as NextFunction);
  };

  it("adds the request id to JSON lines written while handling a request", () => {
    const logger = new AppLogger("TEST", { json: true });

    const [line] = capture(() => insideRequest("req-123", () => logger.log("Signed in user 42", "AuthService")));

    expect(JSON.parse(line)).toMatchObject({ level: "log", message: "Signed in user 42", context: "AuthService", requestId: "req-123" });
  });

  it("leaves lines written outside a request without one", () => {
    const logger = new AppLogger("TEST", { json: true });

    const [line] = capture(() => logger.log("Listening on port: 3000", "Bootstrap"));

    expect(JSON.parse(line)).not.toHaveProperty("requestId");
  });

  it("shows the request id after the context in text logs", () => {
    const logger = new AppLogger("TEST", { colors: false });

    const [line] = capture(() => insideRequest("req-123", () => logger.log("Signed in user 42", "AuthService")));

    expect(line).toContain("[AuthService] (req-123) Signed in user 42");
  });
});
