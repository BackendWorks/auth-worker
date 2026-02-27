import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { EmailService } from 'src/modules/email/email.service';
import { UserRegisteredEvent } from 'src/modules/email/events/user-registered.event';

// jest.mock() is hoisted above ALL variable declarations by Babel/ts-jest, so
// the factory closure must be self-contained — it cannot reference any const/let
// defined in this file.  We retrieve the mocked sendMail fn after the fact via
// (nodemailer.createTransport as jest.Mock).mock.results[0].value.sendMail.
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
}));

describe('EmailService', () => {
    let service: EmailService;
    let mockSendMail: jest.Mock;

    const mockConfigService = {
        getOrThrow: jest.fn((key: string) => {
            const config: Record<string, string | number> = {
                'mail.from': 'noreply@backendworks.dev',
                'mail.host': 'localhost',
                'mail.port': 1025,
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EmailService, { provide: ConfigService, useValue: mockConfigService }],
        }).compile();

        service = module.get<EmailService>(EmailService);

        // Grab the sendMail mock from the transport that EmailService created
        mockSendMail = (nodemailer.createTransport as jest.Mock).mock.results[0].value
            .sendMail as jest.Mock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendWelcomeEmail', () => {
        it('should send a welcome email with correct recipient and subject', async () => {
            const event: UserRegisteredEvent = {
                userId: 'user-abc',
                email: 'alice@example.com',
                firstName: 'Alice',
                createdAt: new Date().toISOString(),
            };

            await service.sendWelcomeEmail(event);

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: 'noreply@backendworks.dev',
                    to: 'alice@example.com',
                    subject: 'Welcome to BackendWorks!',
                }),
            );
        });

        it('should include firstName in the email body', async () => {
            const event: UserRegisteredEvent = {
                userId: 'user-xyz',
                email: 'bob@example.com',
                firstName: 'Bob',
                createdAt: new Date().toISOString(),
            };

            await service.sendWelcomeEmail(event);

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('Bob');
            expect(callArgs.text).toContain('Bob');
        });

        it('should propagate errors from nodemailer', async () => {
            mockSendMail.mockRejectedValueOnce(new Error('Connection refused'));

            const event: UserRegisteredEvent = {
                userId: 'user-fail',
                email: 'fail@example.com',
                firstName: 'Fail',
                createdAt: new Date().toISOString(),
            };

            await expect(service.sendWelcomeEmail(event)).rejects.toThrow('Connection refused');
        });
    });
});
