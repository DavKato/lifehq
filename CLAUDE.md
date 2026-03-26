# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm lint / pnpm lint:fix                  # Biome (runs across all workspaces from root)
pnpm --filter api db:generate              # Generate Drizzle migrations after schema changes
pnpm --filter api db:migrate               # Run pending migrations
pnpm --filter api db:seed                  # Seed the database
pnpm --filter api build                    # TypeScript compile
pnpm --filter web build                    # Next.js production build
```

See README.md for development startup commands.

## Architecture

See `docs/ARCHITECTURE.md` for the full architecture spec. Key rules:

- **Routers must NOT access the database directly** — all DB access goes through the service layer
- **All household-scoped queries must filter by `session.householdId`** — enforced in services, not routers
- **Role-based authorization lives in the service layer**, not in tRPC middleware

### Shared package (`@lifehq/shared`)

The `packages/shared` package is the source of truth for:
- DB schema and Drizzle types (`@lifehq/shared/db`)
- tRPC primitives — `router`, `publicProcedure`, `protectedProcedure`, `createContext` (`@lifehq/shared/trpc`)
- `Session` type: `{ userId, householdId, role }` (`@lifehq/shared/session`)

`apps/api/src/trpc/index.ts` re-exports from `@lifehq/shared/trpc` — add tRPC primitives to the shared package, not in the API.

### Adding a new feature domain

1. Add tables to `packages/shared/src/db/schema.ts`
2. `pnpm --filter api db:generate` then `db:migrate`
3. Create `apps/api/src/services/<domain>Service.ts` (enforce `householdId` here)
4. Create `apps/api/src/routers/<domain>.ts` using procedures from `./trpc`
5. Register in `apps/api/src/trpc/router.ts`
6. Consume via `api.<domain>.<procedure>` in the web app (end-to-end type-safe, no codegen)
