import { registerAs } from "@nestjs/config";

export interface IMailConfig {
  host: string;
  port: number;
  from: string;
}

export default registerAs(
  "mail",
  (): IMailConfig => ({
    host: process.env.MAIL_HOST || "localhost",
    port: parseInt(process.env.MAIL_PORT || "1025"),
    from: process.env.MAIL_FROM || "noreply@backendworks.dev",
  }),
);
