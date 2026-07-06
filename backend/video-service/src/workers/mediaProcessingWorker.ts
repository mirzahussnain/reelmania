import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { mkdtemp, rm, stat } from "fs/promises";
import { rabbitMQService, VIDEO_EXCHANGE } from "../utils/rabbitmq";
import prisma from "../utils/dbconnection.config";
import { StorageFactory } from "../providers/StorageFactory";
import { probeMedia, extractThumbnail } from "../utils/mediaProbe";
import { getRedisClient } from "../utils/redis";
import { bumpExploreVersion } from "../utils/exploreCache";
import { logger } from "../utils/logger";

/**
 * The NATIVE ingestion worker (ADR 0002). A native upload lands directly in the
 * bucket via presigned PUT — its bytes never touch the request path — so the
 * TRUSTED media metadata (duration/width/height/fps) and the poster frame can't
 * be produced inline. This worker pulls the object off storage, runs ffprobe +
 * a thumbnail extract, and flips the row PROCESSING → READY (or FAILED).
 *
 * Trigger: `video.uploaded` on the `video.events` topic exchange, published by
 * createVideo for NATIVE uploads. Embeds never enter here (they're READY on
 * import with provider-sourced metadata).
 */
const QUEUE = "video_media_processing_queue";
const DLQ = "video_media_processing_dlq";
const ROUTING_KEY = "video.uploaded";
const MAX_RETRIES = 3;

// Hard ceiling on a stored native file. The client caps at this too, but that's
// only UX — a caller can bypass the client and PUT straight to the presigned URL.
// This is the authoritative check: because a video can't be published until the
// worker marks it READY, an oversized upload can NEVER reach a feed even if it
// slips into the bucket — the worker fails it here and deletes the object.
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 50 * 1024 * 1024;

export const startMediaProcessingWorker = async () => {
  await rabbitMQService.connect();
  const channel = rabbitMQService.getChannel();

  if (!channel) {
    logger.error("[MediaWorker] No RabbitMQ channel. Retrying in 5s...");
    setTimeout(startMediaProcessingWorker, 5000);
    return;
  }

  await channel.assertExchange(VIDEO_EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.assertQueue(DLQ, { durable: true });
  await channel.bindQueue(QUEUE, VIDEO_EXCHANGE, ROUTING_KEY);

  // ffmpeg is CPU/IO heavy — process a couple at a time, not the default 10.
  channel.prefetch(2);
  logger.info(`[MediaWorker] Listening for ${ROUTING_KEY} on ${QUEUE}`);

  channel.consume(QUEUE, async (msg: any) => {
    if (!msg) return;
    try {
      const { data } = JSON.parse(msg.content.toString());
      await processVideo(data);
      channel.ack(msg);
    } catch (error) {
      const retries = (msg.properties.headers?.["x-retry-count"] ?? 0) as number;
      if (retries < MAX_RETRIES) {
        channel.sendToQueue(QUEUE, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-retry-count": retries + 1 },
        });
        channel.ack(msg);
        logger.warn({ err: error }, `[MediaWorker] Retry ${retries + 1}/${MAX_RETRIES}`);
      } else {
        // Give up: mark the Kine FAILED so the UI can surface it, and shelve the
        // message for inspection instead of hot-looping.
        await markFailed(msg).catch((e) =>
          logger.error({ err: e }, "[MediaWorker] markFailed after DLQ failed")
        );
        channel.sendToQueue(DLQ, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-error": String(error) },
        });
        channel.ack(msg);
        logger.error({ err: error }, "[MediaWorker] Exhausted retries, moved to DLQ");
      }
    }
  });
};

const processVideo = async (data: { videoId?: string; fileName?: string }) => {
  const { videoId, fileName } = data;
  if (!videoId || !fileName) {
    throw new Error(`Missing videoId/fileName in event: ${JSON.stringify(data)}`);
  }

  await prisma.videos.update({
    where: { id: videoId },
    data: { processing_status: "PROCESSING" },
  });

  const storage = StorageFactory.getProvider();
  const workDir = await mkdtemp(path.join(os.tmpdir(), "kinetix-media-"));
  const srcPath = path.join(workDir, path.basename(fileName));
  const thumbName = `thumb-${randomUUID()}.jpg`;
  const thumbPath = path.join(workDir, thumbName);

  try {
    await storage.downloadToFile(fileName, srcPath);

    // Trusted byte size straight off the downloaded object (not client-reported).
    const { size: fileSizeBytes } = await stat(srcPath);

    // Authoritative size enforcement: reject oversized files that bypassed the
    // client cap. Mark FAILED (keeps it out of feeds) and delete the bucket
    // object so a bypass can't be used to dump storage.
    if (fileSizeBytes > MAX_UPLOAD_BYTES) {
      await prisma.videos.update({
        where: { id: videoId },
        data: { processing_status: "FAILED", file_size_bytes: fileSizeBytes },
      });
      await storage.deleteFile(fileName).catch((e) =>
        logger.error({ err: e, videoId }, "[MediaWorker] oversized-file delete failed")
      );
      logger.warn({ videoId, fileSizeBytes, MAX_UPLOAD_BYTES }, "[MediaWorker] rejected oversized upload");
      return;
    }

    const meta = await probeMedia(srcPath);

    // Thumbnail is best-effort — a probe-able file with no extractable frame
    // (e.g. audio-only edge case) should still land READY with trusted metadata.
    let thumbnailUrl: string | undefined;
    try {
      const seekAt = meta.duration && meta.duration < 2 ? 0 : 1;
      await extractThumbnail(srcPath, thumbPath, seekAt);
      thumbnailUrl = await storage.uploadFile(thumbName, thumbPath, "image/jpeg");
    } catch (thumbErr) {
      logger.warn({ err: thumbErr, videoId }, "[MediaWorker] Thumbnail extraction failed");
    }

    await prisma.videos.update({
      where: { id: videoId },
      data: {
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        fps: meta.fps,
        file_size_bytes: fileSizeBytes,
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
        processing_status: "READY",
      },
    });

    // The explore cache holds pre-serialized video rows; drop it so the freshly
    // processed thumbnail/metadata surface on the next feed read.
    await bustExploreCache();

    logger.info({ videoId, meta, thumbnailUrl: !!thumbnailUrl }, "[MediaWorker] READY");
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
};

// Mark the row FAILED using the id embedded in the message (best-effort).
const markFailed = async (msg: any) => {
  const { data } = JSON.parse(msg.content.toString());
  if (!data?.videoId) return;
  await prisma.videos.update({
    where: { id: data.videoId },
    data: { processing_status: "FAILED" },
  });
};

const bustExploreCache = async () => {
  await bumpExploreVersion(getRedisClient());
};
