import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app/app.module';

async function bootstrap() {
    // Create a temporary app instance to access config before starting microservice
    const tempApp = await NestFactory.create(AppModule, { logger: false });
    const configService = tempApp.get(ConfigService);
    await tempApp.close();

    const rabbitmqUrl = configService.getOrThrow<string>('rabbitmq.url');
    const rabbitmqQueue = configService.getOrThrow<string>('rabbitmq.queue');
    const appName = configService.getOrThrow<string>('app.name');
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.RMQ,
        options: {
            urls: [rabbitmqUrl],
            queue: rabbitmqQueue,
            queueOptions: {
                durable: true,
            },
            noAck: false,
            prefetchCount: 1,
        },
    });

    app.enableShutdownHooks();

    await app.listen();

    logger.log(`🚀 ${appName} started — listening on queue: ${rabbitmqQueue}`);
}

bootstrap().catch(err => {
    console.error('Failed to start auth-worker:', err);
    process.exit(1);
});
