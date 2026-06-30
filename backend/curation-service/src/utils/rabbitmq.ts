import amqp from "amqplib";
import { randomUUID } from "crypto";
import { logger } from "./logger";

/**
 * RabbitMQ access for curation-service.
 *
 * Follows the broker topology in docs/messaging-contract.md §2: a single shared
 * broker with per-service TOPIC exchanges (`<domain>.events`). curation-service:
 *   · OWNS and publishes to   → `curation.events`     (collection.item.added/removed)
 *   · CONSUMES (own queues)    → `video.events` (video.deleted), `user.events` (user.deleted)
 *
 * A service owns exactly one exchange and its own consumer queues (+ paired DLQ).
 */
export const CURATION_EXCHANGE = "curation.events";

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
      logger.info(`[RabbitMQ] Connecting at ${rabbitUrl}...`);

      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      logger.info("[RabbitMQ] Connected");
    } catch (error) {
      logger.error({ err: error }, "[RabbitMQ] Connection failed, retrying in 5s");
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
    logger.info({ exchange, routingKey, eventId: event.eventId }, "[RabbitMQ] Published event");
  }

  getChannel() {
    return this.channel;
  }
}

export const rabbitMQService = new RabbitMQService();
