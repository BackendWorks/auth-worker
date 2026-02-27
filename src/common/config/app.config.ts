import { registerAs } from "@nestjs/config";

export interface IWorkerAppConfig {
  env: string;
  name: string;
  debug: boolean;
  logLevel: string;
}

export default registerAs(
  "app",
  (): IWorkerAppConfig => ({
    env: process.env.NODE_ENV || "development",
    name: process.env.APP_NAME || "auth-worker",
    debug: process.env.APP_DEBUG === "true",
    logLevel: process.env.LOG_LEVEL || "log",
  }),
);
