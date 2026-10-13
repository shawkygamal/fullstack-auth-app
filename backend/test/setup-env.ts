import { Logger } from "@nestjs/common";

// Config is validated when first imported; give tests a complete environment that never touches a real one.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST ?? "mongodb://localhost:27017/auth-app-test";
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.COOKIE_SECURE = "false";
process.env.TRUST_PROXY_HOPS = "1";

// Keeps test output readable. Tests that assert on a log line spy on Logger.prototype, which still records the call.
Logger.overrideLogger(false);
