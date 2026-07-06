import prisma from "../utils/dbconnection.config";
import { StorageFactory } from "../providers/StorageFactory";
import { rabbitMQService, VIDEO_EXCHANGE } from "../utils/rabbitmq";
import { getRedisClient } from "../utils/redis";
import { logger } from "../utils/logger";

// Reaps abandoned drafts. A creator can upload/import and never publish — the row
// stays DRAFT (invisible to every feed, which require PUBLIC+READY) but its stored
// file lingers in the bucket forever. This sweep deletes DRAFTs older than the
// grace period along with their storage object, and emits video.deleted so
// curation/marketplace drop any soft refs.
//
// Runs both ways: an in-process daily scheduler (guarded by a Redis lock so only
// one replica sweeps) AND a standalone script (npm run reap:drafts) for a k8s
// CronJob. reapStaleDrafts itself is idempotent and safe to run concurrently.
const DRAFT_TTL_DAYS = Number(process.env.DRAFT_TTL_DAYS) || 30;
const BATCH_LIMIT = 200;

export const reapStaleDrafts = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Backed by @@index([visibility, uploaded_at desc]).
  const stale = await prisma.videos.findMany({
    where: { visibility: "DRAFT", uploaded_at: { lt: cutoff } },
    take: BATCH_LIMIT,
  });
  if (stale.length === 0) return 0;

  const storage = StorageFactory.getProvider();
  let reaped = 0;

  for (const v of stale) {
    try {
      // Only NATIVE drafts own a stored file; embeds live on the provider.
      if (v.source_type === "NATIVE" && v.video_url) {
        const key = v.video_url.split("/").pop();
        if (key) await storage.deleteFile(key).catch(() => {});
      }
      await prisma.videos.delete({ where: { id: v.id } });
      rabbitMQService
        .publish(VIDEO_EXCHANGE, "video.deleted", {
          videoId: v.id,
          uploaderId: v.uploaded_by.id,
        })
        .catch((err) => logger.error({ err, videoId: v.id }, "[DraftReaper] publish failed"));
      reaped++;
    } catch (err) {
      logger.error({ err, videoId: v.id }, "[DraftReaper] failed to reap draft");
    }
  }

  logger.info({ reaped, cutoff, ttlDays: DRAFT_TTL_DAYS }, "[DraftReaper] sweep complete");
  return reaped;
};

const LOCK_KEY = "lock:draft-reaper";
const DAY_MS = 24 * 60 * 60 * 1000;

// Daily in-process scheduler. The Redis lock (NX, ~23h) ensures only one replica
// actually sweeps each day even when several are running.
export const startDraftReaper = () => {
  const runGuarded = async () => {
    try {
      const locked = (await getRedisClient().set(LOCK_KEY, "1", { NX: true, PX: DAY_MS - 60_000 })) === "OK";
      if (locked) await reapStaleDrafts();
    } catch (err) {
      logger.error({ err }, "[DraftReaper] scheduled run failed");
    }
  };

  // First sweep a minute after boot, then once a day.
  setTimeout(runGuarded, 60_000);
  setInterval(runGuarded, DAY_MS);
};
