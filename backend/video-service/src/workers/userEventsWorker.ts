import { rabbitMQService } from "../utils/rabbitmq";
import prisma from "../utils/dbconnection.config";

/**
 * Keeps the video-service's denormalized copies of user identity (the embedded
 * `uploaded_by` on videos, and the username/avatar stored on comments & likes)
 * in sync with the user-service by consuming user events from the shared
 * fanout exchange.
 */
export const startUserEventsWorker = async () => {
  await rabbitMQService.connect();
  const channel = rabbitMQService.getChannel();

  if (!channel) {
    console.error("[UserEventsWorker] Failed to get RabbitMQ channel. Retrying in 5s...");
    setTimeout(startUserEventsWorker, 5000);
    return;
  }

  const exchange = "user_events";
  const queue = "video_user_events_queue";
  const deadLetterQueue = "video_user_events_dlq";
  const MAX_RETRIES = 5;

  await channel.assertExchange(exchange, "fanout", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.assertQueue(deadLetterQueue, { durable: true });
  await channel.bindQueue(queue, exchange, "");

  channel.prefetch(10);
  console.log(`[UserEventsWorker] Listening for user events on queue: ${queue}`);

  channel.consume(queue, async (msg: any) => {
    if (!msg) return;

    try {
      const { eventType, data } = JSON.parse(msg.content.toString());

      if (eventType === "user.updated") {
        await syncUpdatedUser(data);
      }
      // user.created: nothing to backfill (the user has no video content yet).
      // user.deleted: intentionally a no-op for now — whether to delete or
      // anonymize a departed user's videos/comments/likes is a product policy
      // decision; revisit once that is defined.

      channel.ack(msg);
    } catch (error) {
      const retries = (msg.properties.headers?.["x-retry-count"] ?? 0) as number;

      if (retries < MAX_RETRIES) {
        channel.sendToQueue(queue, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-retry-count": retries + 1 },
        });
        channel.ack(msg);
        console.warn(`[UserEventsWorker] Retry ${retries + 1}/${MAX_RETRIES}`, error);
      } else {
        channel.sendToQueue(deadLetterQueue, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-error": String(error) },
        });
        channel.ack(msg);
        console.error("[UserEventsWorker] Exhausted retries, moved to DLQ:", error);
      }
    }
  });
};

const syncUpdatedUser = async (data: any) => {
  const { id, username, avatar_url } = data;
  if (!id) return;

  // Update every place the user's identity is denormalized in this service.
  await Promise.all([
    prisma.videos.updateMany({
      where: { uploaded_by: { is: { id } } },
      data: { uploaded_by: { update: { username } } },
    }),
    prisma.comment.updateMany({
      where: { userId: id },
      data: { username, avatar_url },
    }),
    prisma.like.updateMany({
      where: { userId: id },
      data: { username },
    }),
  ]);
};
