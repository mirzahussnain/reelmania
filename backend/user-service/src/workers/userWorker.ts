import { rabbitMQService } from "../utils/rabbitmq";
import { UserService } from "../services/userService";

export const startUserWorker = async () => {
  await rabbitMQService.connect();
  const channel = rabbitMQService.getChannel();

  if (!channel) {
    console.error("[UserWorker] Failed to get RabbitMQ channel. Retrying in 5s...");
    setTimeout(startUserWorker, 5000);
    return;
  }

  const exchange = "user_events";
  const queue = "user_webhook_queue";
  const deadLetterQueue = "user_webhook_dlq";
  const MAX_RETRIES = 5;

  // Bind this service's queue to the shared fanout exchange so it receives a
  // copy of every user event (the video-service binds its own queue too).
  await channel.assertExchange(exchange, "fanout", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, "");
  // Dead-letter queue for messages that exhaust their retries, so a single
  // poison message can be inspected instead of looping forever (the old
  // `nack(requeue=true)` requeued bad messages indefinitely).
  await channel.assertQueue(deadLetterQueue, { durable: true });

  // Process only 10 messages at a time to prevent DB overwhelming
  channel.prefetch(10);

  console.log(`[UserWorker] Listening for messages on queue: ${queue}`);

  channel.consume(queue, async (msg: any) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { eventType, data } = payload;

      if (eventType === "user.created") {
        await UserService.createUser(data);
      } else if (eventType === "user.updated") {
        await UserService.updateUser(data.id, data);
      } else if (eventType === "user.deleted") {
        await UserService.deleteUser(data.id);
      }

      channel.ack(msg);
    } catch (error) {
      const retries = (msg.properties.headers?.["x-retry-count"] ?? 0) as number;

      if (retries < MAX_RETRIES) {
        // Re-enqueue with an incremented retry counter, then ack the original
        // so we don't hot-loop on a transient failure.
        channel.sendToQueue(queue, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-retry-count": retries + 1 },
        });
        channel.ack(msg);
        console.warn(`[UserWorker] Retry ${retries + 1}/${MAX_RETRIES} for message`, error);
      } else {
        // Retries exhausted → park in the DLQ for manual inspection.
        channel.sendToQueue(deadLetterQueue, msg.content, {
          persistent: true,
          headers: { ...msg.properties.headers, "x-error": String(error) },
        });
        channel.ack(msg);
        console.error("[UserWorker] Message exhausted retries, moved to DLQ:", error);
      }
    }
  });
};
