import { logger } from "./logger";

/**
 * Internal sync-resolution client for video-service (messaging-contract §1).
 *
 * curation-service stores only soft `videoId` refs; to render previews it
 * hydrates display fields by batch-calling video-service. This is the RARE sync
 * path — kept cheap (one batched call) and, crucially, FAIL-SOFT: hydration is an
 * enhancement, never a hard dependency. A video-service blip or timeout must
 * degrade to "no video details" (items render as skeletons), not a 5xx.
 */

// Minimal shape we rely on; video-service owns the full schema.
export interface VideoDetail {
  id: string;
  title: string;
  video_url: string;
  uploaded_by?: { id: string; username: string };
  [key: string]: unknown;
}

// Internal Docker hostname by default — NOT the browser-facing VITE_ URL.
const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_INTERNAL_URL || "http://video-service:8001";
const TIMEOUT_MS = 2500;

/**
 * Resolve videos by id. Returns a Map keyed by videoId for O(1) merge back onto
 * collection items; ids with no video (deleted/orphaned) are simply absent.
 * On any failure returns an EMPTY map so callers degrade gracefully.
 */
export const fetchVideosByIds = async (ids: string[]): Promise<Map<string, VideoDetail>> => {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/videos/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unique }),
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "[videoClient] batch fetch non-OK; degrading");
      return new Map();
    }
    const body = (await res.json()) as { data?: VideoDetail[] };
    const videos = Array.isArray(body?.data) ? body.data : [];
    return new Map(videos.map((v) => [v.id, v]));
  } catch (err) {
    // Timeout/abort/network — never fail the caller's request over hydration.
    logger.warn({ err }, "[videoClient] batch fetch failed; degrading to no details");
    return new Map();
  } finally {
    clearTimeout(timer);
  }
};
