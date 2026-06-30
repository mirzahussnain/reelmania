import { rabbitMQService } from "../utils/rabbitmq";
import prisma from "../utils/dbconnection.config";
import { deleteCoverByUrl } from "../utils/coverStorage";
import { logger } from "../utils/logger";

const MAX_RETRIES = 5;

/**
 * Bind a durable queue (+ paired DLQ) to a topic exchange/routing key and drain
 * it with the given handler. Implements the reliability rules in
 * messaging-contract §8: bounded retries via an x-retry-count header, then park
 * in the DLQ — a poison message must never loop forever.
 */
async function consume(
  channel: any,
  exchange: string,
  routingKey: string,
  queue: string,
  handler: (data: any) => Promise<void>
) {
  const deadLetterQueue = `${queue}.dlq`;

  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);
  await channel.assertQueue(deadLetterQueue, { durable: true });
  channel.prefetch(10);

  logger.info(`[CurationWorker] Listening on ${queue} (${exchange}:${routingKey})`);

  channel.consume(queue, async (msg: any) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      // Tolerate both the DomainEvent envelope ({ data }) and a bare payload.
      await handler(payload?.data ?? payload);
      channel.ack(msg);
    } catch (error) {
      const retries = (msg.properties.headers?.["x-retry-count"] ?? 0) as number;
      if (retries < MAX_RETRIES) {
        channel.sendToQueue(queue, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-retry-count": retries + 1 },
        });
        channel.ack(msg);
        logger.warn({ err: error }, `[CurationWorker] Retry ${retries + 1}/${MAX_RETRIES} on ${queue}`);
      } else {
        channel.sendToQueue(deadLetterQueue, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-error": String(error) },
        });
        channel.ack(msg);
        logger.error({ err: error }, `[CurationWorker] Exhausted retries on ${queue}, moved to DLQ`);
      }
    }
  });
}

export const startCurationWorker = async () => {
  await rabbitMQService.connect();
  const channel = rabbitMQService.getChannel();
  if (!channel) {
    logger.error("[CurationWorker] No RabbitMQ channel. Retrying in 5s...");
    setTimeout(startCurationWorker, 5000);
    return;
  }

  // video.deleted → unlink: delete CollectionItem rows for that videoId. The
  // soft videoId ref can't cascade, so this is the orphan cleanup. deleteMany is
  // idempotent, so a redelivered event is a harmless no-op.
  await consume(
    channel,
    "video.events",
    "video.deleted",
    "curation.video-events.q",
    async (data) => {
      const videoId = data?.videoId ?? data?.id;
      if (!videoId) throw new Error("video.deleted event missing videoId");
      const { count } = await prisma.collectionItem.deleteMany({ where: { videoId } });
      logger.info({ videoId, count }, "[CurationWorker] Unlinked items for deleted video");
    }
  );

  // user.deleted → delete that user's Collections (items cascade). Past affiliate
  // attribution lives on Order.curatorId in marketplace, so this does not erase
  // sales history (messaging-contract §6/§7).
  await consume(
    channel,
    "user.events",
    "user.deleted",
    "curation.user-events.q",
    async (data) => {
      const ownerId = data?.id ?? data?.userId;
      if (!ownerId) throw new Error("user.deleted event missing user id");
      // Collect cover URLs first so we can clean their storage objects (the DB
      // cascade can't reach the bucket), then delete the collections.
      const owned = await prisma.collection.findMany({
        where: { ownerId },
        select: { coverImageUrl: true },
      });
      const { count } = await prisma.collection.deleteMany({ where: { ownerId } });
      for (const c of owned) if (c.coverImageUrl) void deleteCoverByUrl(c.coverImageUrl);
      logger.info({ ownerId, count }, "[CurationWorker] Deleted collections for removed user");
    }
  );
};
