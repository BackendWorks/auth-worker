import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv, Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import Joi from 'joi';

import configs from './config';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: configs,
            isGlobal: true,
            cache: true,
            envFilePath: ['.env'],
            expandVariables: true,
            validationSchema: Joi.object({
                // App
                NODE_ENV: Joi.string()
                    .valid('development', 'staging', 'production', 'local')
                    .default('development'),
                APP_NAME: Joi.string().default('auth-worker'),
                APP_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),

                // Database
                DATABASE_URL: Joi.string().uri().required(),

                // Redis
                REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
                REDIS_KEY_PREFIX: Joi.string().default('auth-worker:'),
                REDIS_TTL: Joi.number().default(3600),

                // RabbitMQ
                RABBITMQ_URL: Joi.string().required(),
                RABBITMQ_QUEUE: Joi.string().default('auth_worker_queue'),

                // Mail
                MAIL_HOST: Joi.string().default('localhost'),
                MAIL_PORT: Joi.number().default(1025),
                MAIL_FROM: Joi.string().email().default('noreply@backendworks.dev'),
            }),
        }),

        CacheModule.registerAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const ttl = configService.get<number>('redis.ttl') * 1000;
                const redisUrl = configService.get<string>('redis.url');
                return {
                    stores: [
                        new Keyv({
                            store: new CacheableMemory({ ttl, lruSize: 1000 }),
                        }),
                        createKeyv(redisUrl),
                    ],
                };
            },
            isGlobal: true,
        }),
    ],
    exports: [],
})
export class CommonModule {}
