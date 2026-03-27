# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm lint:fix                  # Biome (runs across all workspaces from root)
pnpm --filter api db:generate              # Generate Drizzle migrations after schema changes
pnpm --filter api db:migrate               # Run pending migrations
pnpm --filter api db:seed                  # Seed the database
pnpm --filter api build                    # TypeScript compile
pnpm --filter web build                    # Next.js production build
```

See README.md for development startup commands.

Always run `pnpm lint:fix` before staging any changes.

## Browser automation (playwright-cli)

The app uses Google OAuth so protected routes (`/dashboard`, `/subscriptions`) require a real session. Use the test auth setup to inject one:

```bash
pnpm auth:setup                                   # create test user + session in DB, write e2e/.auth/session.json
playwright-cli open http://localhost:3000
playwright-cli state-load e2e/.auth/session.json  # inject session cookie
playwright-cli goto http://localhost:3000/dashboard
```

- Test user: `test@lifehq.dev` (name: `Test User`), household ID `00000000-0000-0000-0000-000000000001`
- Session expires after 1 day — re-run `pnpm auth:setup` to refresh it
- Running `pnpm test:e2e` deletes `e2e/.auth/` via teardown — re-run `pnpm auth:setup` afterwards if needed

**Temporary files:** Save all screenshots and other scratch output to `.claude-temp/` (gitignored). Delete the directory when the session is done:
```bash
playwright-cli screenshot --filename=.claude-temp/my-screenshot.png
# ... when done:
rm -rf .claude-temp/
```

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
