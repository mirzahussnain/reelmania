import prisma from "../utils/dbconnection.config";
import { rabbitMQService } from "../utils/rabbitmq";

// user-service consumes video-service's `video.events` to keep each user's
// video_count fresh (Creator badge = video_count > 0; Top Creator ranks by it).
// messaging-contract §2/§8: own queue + paired DLQ, idempotent on eventId.
const VIDEO_EXCHANGE = "video.events";
const QUEUE = "user.video-events.q";
const DLQ = "user.video-events.dlq";
const MAX_RETRIES = 5;

export const startVideoEventsWorker = async () => {
  await rabbitMQService.connect();
  const channel = rabbitMQService.getChannel();

  if (!channel) {
    console.error("[VideoEventsWorker] No RabbitMQ channel. Retrying in 5s...");
    setTimeout(startVideoEventsWorker, 5000);
    return;
  }

  await channel.assertExchange(VIDEO_EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.assertQueue(DLQ, { durable: true });
  await channel.bindQueue(QUEUE, VIDEO_EXCHANGE, "video.created");
  await channel.bindQueue(QUEUE, VIDEO_EXCHANGE, "video.deleted");
  channel.prefetch(10);

  console.log(`[VideoEventsWorker] Listening for messages on queue: ${QUEUE}`);

  channel.consume(QUEUE, async (msg: any) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      const { eventId, eventType, data } = event;
      const uploaderId: string | undefined = data?.uploaderId;

      if (uploaderId && (eventType === "video.created" || eventType === "video.deleted")) {
        // Dedupe + counter update in ONE transaction: record the event first
        // (skipDuplicates → count 0 means already handled) so an at-least-once
        // redelivery can never double-count. updateMany is a no-op if the user
        // isn't present yet (no throw).
        await prisma.$transaction(async (tx) => {
          const ins = await tx.processed_events.createMany({
            data: [{ event_id: eventId }],
            skipDuplicates: true,
          });
          if (ins.count === 0) return;

          if (eventType === "video.created") {
            await tx.users.updateMany({
              where: { id: uploaderId },
              data: { video_count: { increment: 1 } },
            });
          } else {
            await tx.users.updateMany({
              where: { id: uploaderId, video_count: { gt: 0 } },
              data: { video_count: { decrement: 1 } },
            });
          }
        });
      }

      channel.ack(msg);
    } catch (error) {
      const retries = (msg.properties.headers?.["x-retry-count"] ?? 0) as number;

      if (retries < MAX_RETRIES) {
        channel.sendToQueue(QUEUE, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-retry-count": retries + 1 },
        });
        channel.ack(msg);
        console.warn(`[VideoEventsWorker] Retry ${retries + 1}/${MAX_RETRIES}`, error);
      } else {
        channel.sendToQueue(DLQ, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-error": String(error) },
        });
        channel.ack(msg);
        console.error("[VideoEventsWorker] Exhausted retries, moved to DLQ:", error);
      }
    }
  });
};
