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

  const queue = "user_webhook_queue";
  await channel.assertQueue(queue, { durable: true });

  // Process only 10 messages at a time to prevent DB overwhelming
  channel.prefetch(10);

  console.log(`[UserWorker] Listening for messages on queue: ${queue}`);

  channel.consume(queue, async (msg: any) => {
    if (msg) {
      try {
        const payload = JSON.parse(msg.content.toString());
        const { eventType, data } = payload;

        console.log(`[UserWorker] Processing ${eventType} for user ${data.id}`);

        if (eventType === "user.created") {
          await UserService.createUser(data);
        } else if (eventType === "user.updated") {
          await UserService.updateUser(data.id, data);
        } else if (eventType === "user.deleted") {
          await UserService.deleteUser(data.id);
        }

        // Acknowledge the message to remove it from the queue
        channel.ack(msg);
        console.log(`[UserWorker] Successfully processed and acked ${eventType} for ${data.id}`);

      } catch (error) {
        console.error("[UserWorker] Error processing message, nacking:", error);
        // Nack the message so it goes back to the queue (requeue = false if we want dead-letter, true to retry)
        // For safe retry, let's requeue = false but ideally we should have a dead letter queue.
        // For simple setup: requeue=true
        channel.nack(msg, false, true); 
      }
    }
  });
};
