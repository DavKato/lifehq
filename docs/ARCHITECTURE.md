# Architecture

## Domain-Driven Design (DDD - Lite)

This project follows a simplified DDD approach:

- **Domain**: Core business logic (subscriptions, tasks, documents)
- **Application (Services)**: Use cases and orchestration
- **Infrastructure**: DB, external services (S3, AWS)
- **Interface Layer**: tRPC routers (API boundary)

## Multi-Tenancy Rule

This is a **multi-tenant system** using `householdId`.

### Rule

> All household-scoped data must be accessed through the service layer and filtered using the authenticated session's `householdId`.

### Enforcement Strategy

- No direct DB access from routers
- All queries go through **services**
- Services require `session`
- Services enforce `householdId` filtering

## Service Layer

All business logic lives in the service layer.

Example:
```ts
subscriptionService.getAll(session);
```

### Responsibilities

- Enforce householdId
- Implement business rules
- Interact with DB

### Rule

> Routers must NOT access the database directly.

## Session Design

A domain-level session object is used in the backend:

```ts
type Session = {
	userId: string;
	householdId: string;
	role: 'admin' | 'member';
};
```

### Session Flow

1. User authenticates via Google OAuth
2. Backend receives authenticated user info
3. System finds or creates user, loads household membership
4. Constructs `Session`
5. Passes `Session` into service layer

### Session Storage

- Stored using HTTP-only cookies
- Managed by better-auth
- No use of localStorage

## Authorization

Authorization is enforced in the **service layer**.

Example:
```ts
if (session.role !== 'admin') {
	throw new Error('Unauthorized');
}
```

## Request Flow

```
API Gateway
   ↓
Lambda
   ↓
Fastify
   ↓
tRPC Router
   ↓
Service Layer
   ↓
Database
```

## Backend Folder Structure

```
apps/api/src/
├── routers/
│   ├── subscriptionRouter.ts
│   ├── taskRouter.ts
│   ├── documentRouter.ts
│   └── householdRouter.ts
├── services/
│   ├── subscriptionService.ts
│   ├── taskService.ts
│   ├── documentService.ts
│   └── householdService.ts
├── db/
│   ├── client.ts
│   └── schema.ts
└── workers/
```

## Frontend Responsibilities

- UI rendering
- State management
- API interaction via tRPC client

## Development Philosophy

> Build a working product first, then add complexity.

- Start simple
- Ship features early
- Add infra only when needed
- Avoid premature optimization
