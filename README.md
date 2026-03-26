# LifeHQ

A multi-tenant household management platform for tracking subscriptions, managing shared documents, and organizing household tasks.

## Features

**Subscription Tracker** - Track recurring services with spending analytics by category.

**Document Vault** - Secure shared storage for household documents (insurance, passports, tax docs) with direct S3 upload.

**Shared Tasks** - Collaborative task management with assignment and due date tracking.

**Multi-Household Support** - Create or join households via invite links with role-based access (admin/member).

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | Next.js (App Router), TypeScript, tRPC, TanStack Query |
| Backend  | Fastify, tRPC, Drizzle ORM, PostgreSQL (Neon)          |
| Runtime  | AWS Lambda, API Gateway                                |
| Storage  | Amazon S3                                              |
| Auth     | Google OAuth via better-auth                           |
| IaC      | AWS CDK                                                |

## Project Structure

```
lifehq/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # tRPC API on Lambda
└── infra/            # AWS CDK stacks
```

## Local Development

| Context | Command |
|---------|---------|
| Docker | `docker compose watch` |
| Host | `docker compose up postgres` && `pnpm --filter api dev` && `pnpm --filter web dev` |

## Architecture

- **Domain-driven design** with service layer for business logic
- **Multi-tenant isolation** - all household data filtered by `householdId`
- **Service layer pattern** - business logic separated from API routers
- **HTTP-only cookie sessions** for authentication

### API Request Flow

```
API Gateway → Lambda → Fastify → tRPC Router → Service Layer → Database
```

## Possible Ehnahancement

- [ ] Email/password authentication
- [ ] Passkey (WebAuthn) support
- [ ] Notifications
- [ ] Enhanced analytics dashboard
- [ ] Automated task generation

## Documentation

Detailed architecture and internal docs are in the [`docs/`](docs/) folder.
