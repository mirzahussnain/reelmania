import pino from "pino";

/**
 * Shared structured logger (Phase 9 observability).
 *
 * Emits JSON so logs are queryable in aggregation (no pino-pretty dependency in
 * the image). Level is env-driven. Request-scoped logging is provided by
 * `pino-http` in app.ts, which attaches a child logger with a request id to
 * `req.log` — prefer that inside request handlers so lines correlate per request.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "video-service" },
});
