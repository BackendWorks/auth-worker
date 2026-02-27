import { registerAs } from "@nestjs/config";

export interface IRedisConfig {
  url: string;
  keyPrefix: string;
  ttl: number;
}

export default registerAs(
  "redis",
  (): IRedisConfig => ({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    keyPrefix: process.env.REDIS_KEY_PREFIX || "auth-worker:",
    ttl: parseInt(process.env.REDIS_TTL || "3600"),
  }),
);
