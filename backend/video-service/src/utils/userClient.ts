import { logger } from "./logger";

/**
 * Internal sync-resolution client for user-service (messaging-contract §1).
 *
 * video-service owns video content but NOT the follow graph — that lives in the
 * user-service database. To build the Following feed we need "the ids I follow",
 * so we read them through this one internal call.
 *
 * FAIL-SOFT: the follow graph is an input to the feed, never a hard dependency.
 * A user-service blip/timeout degrades to an EMPTY id set (→ empty Following
 * feed with an honest empty state), never a 5xx on the feed request.
 */

// Internal Docker hostname by default — NOT the browser-facing VITE_ URL.
const USER_SERVICE_URL = process.env.USER_SERVICE_INTERNAL_URL || "http://user-service:8000";
const TIMEOUT_MS = 2500;

/**
 * Resolve the flat set of creator ids a user follows. Returns [] on any failure
 * so the caller degrades gracefully instead of erroring.
 */
export const fetchFollowingIds = async (userId: string): Promise<string[]> => {
  if (!userId) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${USER_SERVICE_URL}/api/users/${userId}/following-ids`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "[userClient] following-ids non-OK; degrading");
      return [];
    }
    const body = (await res.json()) as { data?: string[] };
    return Array.isArray(body?.data) ? body.data.filter(Boolean) : [];
  } catch (err) {
    logger.warn({ err }, "[userClient] following-ids fetch failed; degrading to empty");
    return [];
  } finally {
    clearTimeout(timer);
  }
};
