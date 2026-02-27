import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

import { UserRegisteredEvent } from "./events/user-registered.event";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.getOrThrow<string>("mail.from");

    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>("mail.host"),
      port: this.configService.getOrThrow<number>("mail.port"),
      // For local Mailhog / development: no TLS, no auth
      secure: false,
      ignoreTLS: true,
    });
  }

  /**
   * Sends a welcome email to a newly registered user.
   * Called by EmailController when a 'user.registered' event is received.
   */
  async sendWelcomeEmail(event: UserRegisteredEvent): Promise<void> {
    const { userId, email, firstName } = event;

    this.logger.log(`Sending welcome email to ${email} (userId: ${userId})`);

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Welcome to BackendWorks!",
      html: this.buildWelcomeHtml(firstName),
      text: this.buildWelcomeText(firstName),
    });

    this.logger.log(`Welcome email delivered to ${email}`);
  }

  private buildWelcomeHtml(firstName: string): string {
    return `
            <h1>Welcome, ${firstName}! 👋</h1>
            <p>Thanks for signing up with <strong>BackendWorks</strong>.</p>
            <p>Your account is ready — get started by exploring the platform.</p>
            <br/>
            <p>Cheers,<br/>The BackendWorks Team</p>
        `;
  }

  private buildWelcomeText(firstName: string): string {
    return `Welcome, ${firstName}! Thanks for signing up with BackendWorks. Your account is ready.`;
  }
}
