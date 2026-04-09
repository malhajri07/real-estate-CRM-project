---
tags: [architecture, database, prisma]
created: 2026-04-10
---

# Database Schema

**Source of truth:** `data/schema/prisma/schema.prisma`
**Tables:** 78 (snapshot 2026-04-10)

## High-level domains

### Identity & access
- `users` — auth, roles, organization membership
- `organizations` — agencies (CORP_OWNER scope)
- `user_roles` — many-to-many roles
- `user_invitations` — pending invites

### CRM
- `customers` — people (buyer/seller/tenant)
- `leads` — opportunity wrapper around a customer + intent
- `activities` — calls, viewings, follow-ups
- `contact_log` — communication history
- `appointments` — scheduled meetings/viewings

### Properties
- `listings` — REGA/GASTAT classified inventory
- `projects` — off-plan developments
- `project_units` — units inside a project
- `property_price_history` *(planned E8)*

### Pipeline
- `deals` — has `stage`, `stageEnteredAt`, `agreedPrice`
- `deal_stage_history` — transition log
- `deal_documents` — attached files

### Marketing
- `campaigns` — bulk WhatsApp/SMS
- `messages` — inbound/outbound, ties to inbox
- `community_posts` — forum
- `chatbot_conversations`

### Pool
- `buyer_requests` — buyer-side pool entries
- `owner_requests` — owners looking for an agent
- `claims` — agent reservations (7-day expiry)

### Tenancy
- `tenancies` — active rentals
- `rent_payments` — schedule + status
- `viewing_feedback` — post-viewing agent rating *(planned E15)*

### Compliance / billing
- `subscriptions`, `invoices`, `transactions`
- `audit_logs`

## Conventions
- IDs: `String @id @default(cuid())`
- Timestamps: `createdAt`, `updatedAt`
- Soft delete: many tables use `deletedAt DateTime?`
- Org scoping: `organizationId` on every multi-tenant table — enforced by [[Architecture/Org Isolation]]

## Recent additions
- `deals.stageEnteredAt` — added for [[Sessions/E3 - Pipeline]]
- `deal_stage_history` — added for [[Sessions/E3 - Pipeline]]
