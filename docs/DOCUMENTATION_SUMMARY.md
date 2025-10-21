# Real Estate CRM Documentation Summary

## Platform Structure
- **Account Hierarchy**: Customer, Individual Broker, and Corporate Company accounts define capabilities and listing/lead limits across personal and organizational contexts, with company owners managing employees and shared data scopes. Limits include 30 active listings and 100 customers for individual brokers, and 100 listings/500 customers per corporate employee.
- **Access Control Model**: RBAC and ABAC layers enforce tenancy, ownership, territory, and status constraints through Express middleware and PostgreSQL RLS. Six roles (WEBSITE_ADMIN, CORP_OWNER, CORP_AGENT, INDIV_AGENT, SELLER, BUYER) govern feature access, impersonation, and buyer-pool interactions.

## Operations & Deployment
- **Production Runbook**: Build both frontend and backend with `npm run build`, serve `dist/index.js` with production environment variables (`NODE_ENV`, `PORT`, `JWT_SECRET`, `PUBLIC_BASE_URL`), and optionally manage the process via PM2. Core endpoints live under `/api/*`, and troubleshooting focuses on missing secrets, build artifacts, and proxy alignment.
- **GCP Deployment Guide**: Recommends Cloud Run for app services, Cloud SQL (PostgreSQL) for data, BigQuery + dbt for analytics, and Cloud Storage for assets. Provides gcloud steps for instance provisioning, enabling APIs, deploying builds, running Prisma migrations, and outlines Dockerfile/Cloud Build configurations with monthly cost estimates ($40–105) and security hardening tips.

## Data & Analytics
- **Analytics Platform**: Uses PostgreSQL warehouse with dbt models, Airflow orchestration, and Metabase dashboards aligned to Asia/Riyadh timezone. Dimensional models cover users, organizations, agents, cities, property types, and dates; fact tables track properties, listings, buyer requests, claims, leads, contacts, payments, audits, security, and web analytics. KPIs span user growth, property activity, claim/lead conversion, agent productivity, revenue, and security signals, with alerting through Slack, email, and webhooks for SLA breaches, backlogs, and data freshness.
- **CSV Import Guide**: Defines customer-lead CSV structure with mandatory first/last name and email columns, optional phone/budget/source/interest/notes fields (Arabic or English headers), UTF-8 encoding, and allowed values for lead status and interest categories.

## Content & UI Management
- **CMS Overview**: Landing page sections and cards support draft/publish workflows, drag-and-drop ordering, role-based permissions (Admin, CMS Admin, Editor, Viewer), media validation, caching rules, and detailed audit/version tables (`LandingSection`, `LandingCard`, `LandingAuditLog`, `LandingVersion`). API endpoints cover section/card CRUD, reordering, publishing, archiving, and public delivery of published content.
- **Admin Sitemap Highlights**: Catalogs 66 admin routes across Overview, User/Role/Organization management, Revenue, Complaints, Integrations, Content, Features, Analytics, Billing, Security, Notifications, and System Settings. Each entry notes status (live/mocked/stub), UI elements, required/proposed endpoints, touched entities, and RBAC role access for implementation planning.

## Project Restructuring
- **Folder Restructure Plan**: Maps legacy directories (`client`, `server`, `shared`, `airflow`, `db`, `prisma`, `models`, `seeds`, `attached_assets`, etc.) into a new layout: `apps/` for deployables, `packages/` for libraries, `data/` for pipelines/schema/warehouse/assets, `docs/` for product/analytics, `infra/` for scripts/deployment, and `output/` for builds. Highlights alias updates (TS, Vite, Prisma), CI/CD adjustments, ignore rules, verification checklist, and automation helpers.

## Implementation Snapshot
- **RBAC Implementation Summary**: Confirms delivery of RBAC/ABAC stack with JWT auth, bcrypt hashing, impersonation, rate limiting, RLS-backed Prisma schema, buyer claim workflow (72-hour exclusivity, 5 active claims per agent, 3 claims per buyer per day), seeded test accounts, API endpoints for auth and buyer pool, UI components for dashboards and buyer search, and layered security controls (masking, encryption, audits).

