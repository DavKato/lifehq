# Authentication & Household Management

## Authentication

- **Provider**: Google OAuth
- **Library**: better-auth
- **Session**: HTTP-only cookies (no localStorage)

### V1 Scope

- Google OAuth only
- No email/password authentication
- No passkey/WebAuthn

## Household Model

Users belong to a household.

### Household Structure

```
Household
  ├ members
  ├ subscriptions
  ├ tasks
  └ documents
```

## First-Time User Flow

After authentication:

### If user has no household

1. Redirect to onboarding
2. Options:
   - Create new household
   - Join via invite link

### If user has a household

- Redirect to dashboard

## Inviting Members

Households use **invite links**.

### Invite Link Flow

1. User generates invite link (admin only)
2. Link contains a token:
   ```
   https://lifehq.app/invite?token=abc123
   ```
3. Invitee:
   - Logs in with Google
   - Token is validated
   - User is added to household

### Invite Table

```ts
household_invites - id, householdId, token, expiresAt, createdBy
```

## Role-Based Access

| Role | Permissions |
|------|-------------|
| admin | Full access, can invite members, manage household |
| member | Access household data, manage own tasks/subscriptions |

## Authentication UI

- No dedicated login/signup page
- Header contains:
  - "Login with Google" (unauthenticated)
  - User menu/avatar (authenticated)
