---
tags: [index, moc]
created: 2026-04-10
updated: 2026-04-13
---

# 🏠 Aqarkom Knowledge Vault

> Knowledge base for **عقاركم (Aqarkom)** — Saudi real estate CRM platform.
> 539 commits · 117K LOC · 42 skills · 85 tables · 370 routes · 25 pages

## Map of Content

### 📋 Project
- [[00 - Project Overview]]
- [[01 - Tech Stack]]
- [[02 - Glossary]]

### 🏗️ Architecture
- [[Architecture/Database Schema]] — 78 Prisma models
- [[Architecture/API Routes]] — 57 Express endpoints
- [[Architecture/Authentication & RBAC]] — roles, JWT, team page access model
- [[Architecture/Org Isolation]] — multi-tenant scoping
- [[Architecture/Frontend Structure]] — React + shadcn + TanStack Query

### ✨ Features
- [[Features/CRM Core]] · [[Features/Properties & Listings]] · [[Features/Pipeline & Deals]]
- [[Features/Marketing & Campaigns]] · [[Features/Chatbot]] · [[Features/Buyer Pool]]
- [[Features/REGA Compliance]]

### 🛠️ Skills (42 — `/skill-name`)
- [[Skills/Index]] — full catalog + workflow diagram
- **Scaffolding:** `/add-page` · `/add-api-route` · `/add-prisma-model` · `/add-feature` · `/add-react-query` · `/add-adr` · `/add-arabic`
- **Workflow:** `/next-session` · `/complete-session` · `/enhance-page` · `/session-retro` · `/track-change` · `/start-dev` · `/commit-and-track`
- **Quality:** `/typecheck` · `/audit-org-isolation` · `/audit-rtl` · `/audit-tokens` · `/audit-skeleton` · `/rega-check` · `/find-callers`
- **Database:** `/db-push` · `/seed-reset`
- **Documentation:** `/comment-file` · `/comment-batch` · `/coverage-report`
- **Vault:** `/obsidian-markdown` · `/obsidian-bases` · `/json-canvas` · `/obsidian-cli` · `/defuddle`
- **Advanced (S1-S8):** `/add-ai-endpoint` · `/add-websocket-event` · `/add-workflow-trigger` · `/add-pdf-report` · `/add-payment-flow` · `/add-cron-job` · `/add-analytics-widget` · `/add-embedding-search` · `/add-map-layer` · `/add-pwa-feature`

### 📋 Plans
- [[Plans/Enhancement Plan E1-E20]] — page-by-page enhancements — **COMPLETE** ✅
- [[Plans/Comment Plan C1-C20]] — TSDoc on every function — **COMPLETE** ✅ (API 89.1%)
- [[Plans/Advanced Sprint Plan S1-S8]] — AI, real-time, automation, Saudi integrations (62 days)

### 📓 Sessions (E1-E20 retros)
- [[Sessions/E1 - Dashboard]] · [[Sessions/E2 - Leads]] · [[Sessions/E3 - Pipeline]] · [[Sessions/E4 - Calendar]]
- [[Sessions/E5 - Activities]] · [[Sessions/E6 - Tenants]] · [[Sessions/E7 - Properties]] · [[Sessions/E8 - Property Detail]]
- [[Sessions/E9 - Pool]] · [[Sessions/E10 - Broker Requests]] · [[Sessions/E11 - Campaigns]] · [[Sessions/E12 - Inbox]]
- [[Sessions/E13 - Settings]] · [[Sessions/E14 - Tools]] · [[Sessions/E15 - Client Portal]] · [[Sessions/E16 - Landing Map]]
- [[Sessions/E17 - Forum]] · [[Sessions/E18 - Projects]] · [[Sessions/E19 - Report Builder]] · [[Sessions/E20 - Promotions]]

### ⚙️ Engineering
- [[Engineering/Comment Style]] — TSDoc convention (Source/Consumer lineage)
- [[Engineering/Coverage Report]] — API 89.1%, Schema 100%, Overall 59.2%
- [[Engineering/Skeleton Audit]] — 25/25 platform pages with layout-accurate skeletons

### 📜 History
- [[History/Index]] — History MOC
- [[History/Timeline]] — 530 commits, 6 sessions
- [[History/Changelog/Index]] — month-by-month log
- [[History/Conversations/Index]] — per-session retros
- [[History/Incidents/Index]] — post-mortems (team page freeze, seed roles bug)

### 📐 Decisions
- [[Decisions/ADR Index]]
- [[Decisions/008 - TSDoc with Source-Consumer Lineage]]

### 📘 Runbooks
- [[Runbooks/Index]] — operational how-to guides
- [[Runbooks/Useful Commands]] · [[Runbooks/Reset Demo Data]] · [[Runbooks/Debug 403 Errors]] · [[Runbooks/Add a New Page]]

### 🔗 Reference
- [[Reference/Admin Credentials]]
- [[Reference/Demo Data]] — 102 orgs, 1 CORP_OWNER + 9 CORP_AGENT each

---
*Last updated: 2026-04-15 — 539 commits, 42 skills, E1-E20 ✅, C1-C20 ✅, S1-S8 planned, client portal + messaging redesigned*
