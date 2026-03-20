# Roadmap

## V1 Features

### Subscription Tracker

Track recurring services (Netflix, ChatGPT, Amazon Prime, etc.)

#### Fields

- id, name, price, billingCycle, renewalDate
- categoryId, householdId
- createdAt, updatedAt, deletedAt (soft delete)

#### CRUD

- create subscription
- update subscription
- delete (soft delete)

#### Analytics

- Total monthly spending
- Total yearly spending
- Category breakdown

### Document Vault

Household shared document storage (insurance, passports, tax documents).

#### Storage

Amazon S3 with structure:
```
households/{householdId}/documents/{fileId}
```

#### Metadata

- id, fileName, fileSize, uploadedBy, uploadedAt, s3Key, householdId, deletedAt

#### Permissions

- Household members: read/write

#### Upload Flow

1. Client requests presigned URL
2. Upload directly to S3
3. Store metadata in DB

#### V1 Scope

- upload, list, download

### Shared Tasks

Household task management.

#### Fields

- id, title, description, assignedTo, dueDate, completed
- householdId, createdAt, updatedAt, deletedAt

#### Features

- create task, assign task, mark complete, delete (soft delete)

#### Views

- My tasks, Household tasks, Completed tasks

## Future Enhancements

- [ ] Email/password authentication
- [ ] Passkey (WebAuthn) support
- [ ] Automated task generation
- [ ] Notifications
- [ ] Enhanced analytics dashboard
- [ ] Expanded role-based permissions
- [ ] PostgreSQL Row Level Security (RLS)

## Skills Demonstrated

### Frontend

- React / Next.js
- State management
- API integration (tRPC, TanStack Query)

### Backend

- API design (tRPC)
- Service architecture
- TypeScript backend

### Database

- Relational modeling
- Normalization
- ORM usage (Drizzle)

### Cloud

- AWS Lambda
- API Gateway
- S3
- AWS CDK

### System Design

- Multi-tenancy
- Service layer enforcement
- Monorepo architecture
- Domain separation
