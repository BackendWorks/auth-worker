import { Test, TestingModule } from "@nestjs/testing";
import { RmqContext } from "@nestjs/microservices";

import { EmailController } from "src/modules/email/email.controller";
import { EmailService } from "src/modules/email/email.service";
import { UserRegisteredEvent } from "src/modules/email/events/user-registered.event";

describe("EmailController", () => {
  let controller: EmailController;
  let emailService: jest.Mocked<EmailService>;

  const mockChannel = {
    ack: jest.fn(),
    nack: jest.fn(),
  };

  const mockRmqContext = {
    getChannelRef: jest.fn().mockReturnValue(mockChannel),
    getMessage: jest.fn().mockReturnValue({}),
  } as unknown as RmqContext;

  const mockEvent: UserRegisteredEvent = {
    userId: "user-123",
    email: "john@example.com",
    firstName: "John",
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    emailService = {
      sendWelcomeEmail: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [{ provide: EmailService, useValue: emailService }],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleUserRegistered", () => {
    it("should send welcome email and ACK message on success", async () => {
      emailService.sendWelcomeEmail.mockResolvedValueOnce(undefined);

      await controller.handleUserRegistered(mockEvent, mockRmqContext);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(mockEvent);
      expect(mockChannel.ack).toHaveBeenCalledWith({});
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it("should NACK message when email service throws", async () => {
      emailService.sendWelcomeEmail.mockRejectedValueOnce(
        new Error("SMTP error"),
      );

      await controller.handleUserRegistered(mockEvent, mockRmqContext);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(mockEvent);
      expect(mockChannel.nack).toHaveBeenCalledWith({}, false, true);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });
  });
});
