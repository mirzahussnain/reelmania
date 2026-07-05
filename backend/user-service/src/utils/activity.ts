import prisma from "./dbconnection.config";
import { logger } from "./logger";

/**
 * Records that a user was active, so the nightly C-Score job can bound its pool
 * to users active in the last N days (C_SCORE_CALCULATION.md §7).
 *
 * Throttled and fire-and-forget: this runs on every authenticated request, so it
 * MUST NOT add latency or a DB write per request. An in-memory window skips
 * repeat writes for the same user, and the write is never awaited — an activity
 * ping must never affect the request it rode in on.
 */
const THROTTLE_MS = 15 * 60 * 1000; // at most one write per user per 15 min (per process)
const lastBump = new Map<string, number>();

export const touchLastActive = (userId: string): void => {
  const now = Date.now();
  const prev = lastBump.get(userId);
  if (prev && now - prev < THROTTLE_MS) return;
  lastBump.set(userId, now);

  // updateMany (not update) so a not-yet-synced user is a no-op, never a throw.
  prisma.users
    .updateMany({ where: { id: userId }, data: { last_active_at: new Date() } })
    .catch((err) => logger.warn({ err }, "touchLastActive skipped"));
};
