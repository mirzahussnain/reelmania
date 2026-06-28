import { Response } from "express";

/**
 * One response envelope for every endpoint (IMPLEMENTATION_PLAN 1.5).
 *
 *   { success, message, data, meta? }
 *
 * `data` is always present (null on failure / no-content); list endpoints put
 * pagination in `meta`. Use `ok`/`fail` instead of hand-rolling `res.json`
 * so the shape can never drift between controllers or services.
 */
export interface Meta {
  nextCursor?: string | null;
  page?: number;
  limit?: number;
  total?: number;
}

export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: Meta;
  error?: string;
}

export const ok = <T>(
  res: Response,
  data: T,
  meta?: Meta,
  message = "OK",
  status = 200
): void => {
  const body: Envelope<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  res.status(status).json(body);
};

export const fail = (
  res: Response,
  status: number,
  message: string,
  error?: unknown
): void => {
  const body: Envelope<null> = { success: false, message, data: null };
  if (error !== undefined) {
    body.error = error instanceof Error ? error.message : String(error);
  }
  res.status(status).json(body);
};
