import amqp from "amqplib";
import { randomUUID } from "crypto";

/**
 * video-service OWNS and publishes to the `video.events` topic exchange
 * (docs/messaging-contract.md §2). Consumers (curation-service, marketplace-service)
 * bind their own queues to it for orphan cleanup on `video.deleted`.
 */
export const VIDEO_EXCHANGE = "video.events";

class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private isConnecting = false;

  async connect() {
    if (this.connection && this.channel) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
      console.log(`Connecting to RabbitMQ at ${rabbitUrl}...`);

      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      console.log("Successfully connected to RabbitMQ");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      setTimeout(() => this.connect(), 5000); // Retry after 5s
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Publish a domain event to a topic exchange with a routing key. Wraps the
   * payload in the shared DomainEvent envelope (messaging-contract §3) so every
   * consumer can dedupe on `eventId` and read a stable shape.
   */
  async publish<T>(exchange: string, routingKey: string, data: T) {
    if (!this.channel) await this.connect();
    if (!this.channel) return;

    await this.channel.assertExchange(exchange, "topic", { durable: true });
    const event = {
      eventId: randomUUID(),
      eventType: routingKey,
      occurredAt: new Date().toISOString(),
      version: 1,
      data,
    };
    const buffer = Buffer.from(JSON.stringify(event));
    this.channel.publish(exchange, routingKey, buffer, { persistent: true });
    console.log(`[RabbitMQ] Published ${routingKey} to ${exchange} (${event.eventId})`);
  }

  getChannel() {
    return this.channel;
  }
}

export const rabbitMQService = new RabbitMQService();
