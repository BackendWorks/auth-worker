import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";

import { EmailService } from "./email.service";
import { UserRegisteredEvent } from "./events/user-registered.event";

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Handles the 'user.registered' event emitted by auth-service after signup.
   *
   * Flow:
   *   auth-service (signup) → RabbitMQ (user.registered) → auth-worker (this handler)
   *
   * Manual ACK is used to guarantee at-least-once delivery:
   * - If processing succeeds, the message is ACK'd and removed from the queue.
   * - If processing fails, the message is NACK'd and re-queued for retry.
   */
  @EventPattern("user.registered")
  async handleUserRegistered(
    @Payload() data: UserRegisteredEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.logger.log(
        `[user.registered] Received event for userId: ${data.userId}`,
      );

      await this.emailService.sendWelcomeEmail(data);

      // ACK — remove message from queue after successful processing
      channel.ack(originalMessage);

      this.logger.log(
        `[user.registered] Successfully processed for userId: ${data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[user.registered] Failed to process event for userId: ${data?.userId}`,
        error,
      );

      // NACK — re-queue the message for retry (requeue: true)
      // Set requeue: false to send to dead-letter queue if configured
      channel.nack(originalMessage, false, true);
    }
  }
}
