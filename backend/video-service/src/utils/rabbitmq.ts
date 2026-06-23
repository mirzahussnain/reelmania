import amqp from "amqplib";

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

  getChannel() {
    return this.channel;
  }
}

export const rabbitMQService = new RabbitMQService();
