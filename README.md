# auth-worker

[![CI](https://github.com/BackendWorks/auth-worker/actions/workflows/ci.yml/badge.svg)](https://github.com/BackendWorks/auth-worker/actions/workflows/ci.yml)
[![Tests](https://github.com/BackendWorks/auth-worker/actions/workflows/test.yml/badge.svg)](https://github.com/BackendWorks/auth-worker/actions/workflows/test.yml)

NestJS async worker for the auth domain. Consumes jobs from `auth-service` via gRPC and Redis queue — handles transactional email dispatch and scheduled cleanup tasks.

## Responsibilities

- **Email module** — Send transactional emails (welcome, password reset, verification) triggered by auth events
- **Cleanup module** — Scheduled token revocation and soft-deleted user record purging

## Ports

| Protocol | Address |
|---|---|
| gRPC | `:50053` |

No HTTP server — this is a pure worker process.

## Tech Stack

NestJS 11 · TypeScript · gRPC (`nestjs-grpc`) · Redis (queue) · Nodemailer · `@backendworks/auth-db` · Jest

## Getting Started

```bash
npm install
npm run dev       # nest start --watch
```

## Environment Variables

```env
NODE_ENV=local
APP_NAME=@backendworks/auth-worker

DATABASE_URL=postgresql://admin:master123@localhost:5432/postgres?schema=public

REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=auth-worker:
REDIS_TTL=3600

GRPC_URL=0.0.0.0:50053
GRPC_PACKAGE=auth-worker

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
SMTP_FROM=noreply@example.com
```

## gRPC

Proto file: `src/protos/auth-worker.proto`
Generated types: `src/generated/auth-worker.ts` — **do not edit manually**

Worker-specific RPCs triggered asynchronously by `auth-service` events.

## Project Structure

```
src/
├── app/
│   ├── app.module.ts                  # Root module
│   └── worker.grpc.controller.ts      # gRPC server endpoints
├── common/
│   ├── config/                        # app, grpc, redis configs
│   └── services/
│       └── queue.service.ts           # Redis-backed job queue consumer
├── modules/
│   ├── email/                         # Email dispatch jobs
│   │   ├── email.module.ts
│   │   ├── email.service.ts
│   │   ├── email.controller.ts
│   │   └── events/                    # Email event definitions
│   └── cleanup/                       # Scheduled cleanup jobs
├── protos/
└── generated/
```

## Scripts

```bash
npm run dev       # Watch mode
npm run build     # Production build
npm run lint      # ESLint --fix
npm run format    # Prettier --write
npm test          # Unit tests (100% coverage enforced)
```

## Testing

Tests live in `test/unit/`. Coverage thresholds are enforced at **100%** for branches, functions, lines, and statements.

```bash
npm test
```

## License

[MIT](LICENSE)
