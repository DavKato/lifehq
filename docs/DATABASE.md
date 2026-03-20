# Database Design

## Core Tables

- users
- households
- household_members
- household_invites
- subscriptions
- tasks
- documents
- categories

## Table Schemas

### households

| Column | Type |
|--------|------|
| id | uuid |
| name | string |
| createdAt | timestamp |

### users

| Column | Type |
|--------|------|
| id | uuid |
| email | string |
| name | string |

### household_members

| Column | Type |
|--------|------|
| id | uuid |
| userId | uuid |
| householdId | uuid |
| role | "admin" \| "member" |
| createdAt | timestamp |

### household_invites

| Column | Type |
|--------|------|
| id | uuid |
| householdId | uuid |
| token | string |
| expiresAt | timestamp |
| createdBy | uuid |

### categories

| Column | Type |
|--------|------|
| id | uuid |
| name | string |

### subscriptions

| Column | Type |
|--------|------|
| id | uuid |
| name | string |
| price | decimal |
| billingCycle | string |
| renewalDate | date |
| categoryId | uuid → categories.id |
| householdId | uuid |
| createdAt | timestamp |
| updatedAt | timestamp |
| deletedAt | timestamp (soft delete) |

### tasks

| Column | Type |
|--------|------|
| id | uuid |
| title | string |
| description | string |
| assignedTo | uuid |
| dueDate | date |
| completed | boolean |
| householdId | uuid |
| createdAt | timestamp |
| updatedAt | timestamp |
| deletedAt | timestamp (soft delete) |

### documents

| Column | Type |
|--------|------|
| id | uuid |
| fileName | string |
| fileSize | number |
| uploadedBy | uuid |
| uploadedAt | timestamp |
| s3Key | string |
| householdId | uuid |
| deletedAt | timestamp (soft delete) |

## Soft Deletes

Soft deletes are applied to:
- subscriptions
- tasks
- documents

Field: `deletedAt TIMESTAMP NULL`

This allows recovery of accidentally deleted items.

## Categories (Normalized)

Subscriptions are categorized for organization:

```
categories ← subscriptions.categoryId
```

Benefits:
- Normalized data model
- Easy to add/modify categories
- Enables category-based spending analytics

## S3 Storage Structure

```
households/{householdId}/documents/{fileId}
```
