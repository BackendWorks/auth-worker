# Copilot Instructions – Auth Worker

## Overview

Background worker for the auth domain. Has **no HTTP server** and **no Swagger**. Listens on gRPC port `:50053` for async jobs triggered by `auth-service` (e.g. send welcome emails, schedule token revocation, soft-delete cleanup).

Uses `@backendworks/auth-db` at the **same version range** as `auth-service` — never pin them to different versions.

## Developer Workflows

Run all commands from the `auth-worker/` directory:

```bash
npm run dev              # proto:generate → nest start --watch
npm run test             # jest --runInBand, 100% coverage enforced
npm run proto:generate   # regenerates src/generated/auth-worker.ts from src/protos/
```

**Database migrations are NOT run from here.** Schema is owned by `packages/auth-db/`.

## gRPC Server

Defined in `src/protos/auth-worker.proto`, types auto-generated into `src/generated/auth-worker.ts` — never edit generated files.

Workers expose RPCs for async jobs, for example:

```protobuf
service AuthWorkerService {
  rpc SendWelcomeEmail(SendWelcomeEmailRequest) returns (SendWelcomeEmailResponse);
  rpc CleanupExpiredTokens(CleanupRequest) returns (CleanupResponse);
}
```

Controller: `src/app/worker.grpc.controller.ts` using `@GrpcController` / `@GrpcMethod` from `nestjs-grpc`.

## Key Differences from auth-service

| Feature         | auth-service      | auth-worker            |
| --------------- | ----------------- | ---------------------- |
| HTTP server     | ✅ port 9001      | ❌ none                |
| Swagger         | ✅                | ❌ no doc.config       |
| Passport guards | ✅ JWT strategies | ❌ none                |
| i18n            | ✅                | ❌ (no HTTP responses) |
| gRPC            | ✅ port 50051     | ✅ port 50053          |
| Redis queue     | ❌                | ✅ queue.service.ts    |
| auth.config     | ✅ JWT secrets    | ❌ not needed          |

## CommonModule (worker variant)

`CommonModule` in this service registers only:

- `ConfigModule` with Joi validation for `app`, `grpc`, `redis` namespaces (no `auth.*`, no `doc.*`)
- `CacheModule` (Redis via `@keyv/redis`)
- `@backendworks/auth-db` db manager via `createAuthDbManager()`

No guards, no interceptors, no i18n — this is a headless worker.

## Database Access

```typescript
// Inject IUserRepository via IAuthDbManager — never use PrismaClient directly
import { createAuthDbManager, IAuthDbManager } from "@backendworks/auth-db";

const dbManager: IAuthDbManager = createAuthDbManager(connectionString);
const userRepo = dbManager.userRepository;
await userRepo.findById(userId);
```

## Folder Structure

```
src/
  app/
    app.module.ts               # Wires CommonModule, email module, cleanup module, GrpcModule
    worker.grpc.controller.ts   # gRPC server on :50053
  common/
    common.module.ts            # Config (app/grpc/redis), cache, db — no HTTP/Passport/Swagger
    config/
      app.config.ts             # → 'app.*'
      grpc.config.ts            # → 'grpc.*'
      redis.config.ts           # → 'redis.*'
    services/
      queue.service.ts          # Redis-backed job queue consumer
    interfaces/                 # Shared worker interfaces
    constants/                  # Metadata key strings
  modules/
    email/                      # Sends transactional emails on auth events
    cleanup/                    # Revokes expired tokens, runs scheduled soft-delete
  protos/
    auth-worker.proto           # Worker RPC definitions
  generated/
    auth-worker.ts              # AUTO-GENERATED — do not edit
test/
  jest.json
  unit/
    queue.service.spec.ts
    # + one spec per module service
```

## Testing Conventions

- Same 100% coverage rule as all other services
- No `@nestjs/testing` auto-mocking — all dependencies are plain `jest.fn()` objects
- No HTTP to test; focus on gRPC handler logic and queue consumer logic
- Mock `IUserRepository` methods directly: `const mockUserRepo = { findById: jest.fn(), ... }`
