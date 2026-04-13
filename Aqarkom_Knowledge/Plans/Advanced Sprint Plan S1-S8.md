---
tags: [plan, sprints, advanced, ai, automation, integrations]
created: 2026-04-11
---

# Advanced Sprint Plan S1–S8

> E1-E20 enhanced every page. This plan builds **platform-level capabilities** — AI intelligence, real-time systems, automation, geospatial analytics, Saudi integrations, and mobile. 62 working days across 8 sprints.

## Status

| Sprint | Theme | Days | Status | Note |
|---|---|---|---|---|
| S1 | Intelligence & Scoring | 7 | pending | Lead scoring, agent DNA, revenue attribution, CMA, commission calc |
| S2 | Real-Time & Notifications | 7 | pending | WebSocket, push notifications, PWA, agent presence |
| S3 | Documents & Campaigns | 8 | pending | PDF generation, drip campaigns, deal rooms |
| S4 | AI Core | 8 | pending | Claude chatbot, smart matching, AI follow-up writer |
| S5 | Automation Engine | 10 | pending | Workflow builder, cron jobs, report builder v2 |
| S6 | Analytics & Geospatial | 6 | pending | Cohort analysis, forecasting, heat maps, market alerts |
| S7 | Saudi Integrations | 8 | pending | Payment gateway, WhatsApp production, REGA API |
| S8 | Identity & Polish | 8 | pending | Nafath KYC, Ejar sync, Thiqah score, mobile capture |

## Cost Tier

| Symbol | Meaning |
|---|---|
| `$0` | Zero cost — pure code, runs locally |
| `$free` | Free tier of external service |
| `$$` | Paid API — costs money at scale |

---

## Sprint 1 — Intelligence & Scoring (7 days)

> Turn raw data into actionable intelligence. Every feature here is `$0` — pure SQL/JS on existing data.

### Day 1 — Lead Scoring Engine
- [ ] Add `score` (Int, 0-100) + `scoreFactors` (Json) columns to `leads` table `/db-push`
- [ ] Create scoring function: weighted formula (recency 25%, engagement 20%, budget fit 20%, response speed 15%, profile completeness 20%)
- [ ] API: `GET /api/leads/scores` — batch-recalculate scores
- [ ] API: `POST /api/leads/:id/recalculate-score` — single lead
- [ ] Cron: nightly score recalculation `/add-cron-job`
- [ ] Frontend: Score badge (color-coded 0-30 cold / 31-60 warm / 61-100 hot) on leads table + pipeline cards
- **Skill:** `/add-cron-job`

### Day 2 — Commission Auto-Calculator
- [ ] New Prisma model: `commissions` (dealId, agentId, orgId, grossAmount, agentRate, agentAmount, orgAmount, vatAmount, status, paidAt)
- [ ] Trigger: when deal stage → WON, auto-create commission record
- [ ] API: `GET /api/commissions` — list with filters (agent, period, status)
- [ ] API: `PATCH /api/commissions/:id/mark-paid` — mark as paid
- [ ] Frontend: new "العمولات" page under Analytics sidebar group
- [ ] Dashboard widget: monthly commission earned
- **Skills:** `/add-prisma-model` → `/add-api-route` → `/add-page`

### Day 3 — Agent Performance DNA
- [ ] API: `GET /api/analytics/agent-dna/:id` — returns radar dimensions: response speed, conversion rate, deal size, client satisfaction, listing quality, activity volume
- [ ] Compute each dimension from existing data (leads, deals, appointments, properties, activity_log)
- [ ] Frontend: Radar chart component using Recharts RadarChart
- [ ] Add to team page agent detail drawer + agent profile page
- **Skill:** `/add-analytics-widget`

### Day 4 — Revenue Attribution
- [ ] API: `GET /api/analytics/attribution` — lead source → conversion → revenue pipeline
- [ ] Query: JOIN leads → deals (WON) → GROUP BY source, compute total revenue per source
- [ ] Frontend: Sankey or stacked bar chart — source → leads → deals → revenue
- [ ] Add as new tab in Reports page
- **Skill:** `/add-analytics-widget`

### Day 5 — Comparable Sales Engine (CMA)
- [ ] API: `GET /api/properties/:id/comparables` — find similar properties by: same city, same type, area ±20%, bedrooms ±1, sold in last 12 months
- [ ] Response: list of comps with price/sqm, distance, similarity score
- [ ] API: `GET /api/properties/:id/cma-report` — returns PDF buffer
- [ ] PDF template: branded header, subject property, 5 comps table, price range analysis, map
- [ ] Frontend: "تقرير مقارنة" button on property detail page → downloads PDF
- **Skills:** `/add-api-route` → `/add-pdf-report`

### Day 6 — Custom Dashboard Widgets
- [ ] New model: `dashboard_widgets` (userId, widgetType, position, config Json)
- [ ] API: CRUD for widget layout per user
- [ ] Widget types: metric-card, chart, recent-list, leaderboard, commission-summary
- [ ] Frontend: drag-and-drop grid on dashboard using `react-grid-layout`
- [ ] Save/restore layout per user

### Day 7 — Sprint 1 Review & Polish
- [ ] Run `/typecheck` — 0 errors
- [ ] Run `/audit-rtl` — fix any LTR-only classes
- [ ] Test all new endpoints with admin + corp_owner + corp_agent
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S1 - Intelligence]] retro note

---

## Sprint 2 — Real-Time & Notifications (7 days)

> Make the platform feel alive. WebSocket events, push notifications, PWA. All `$0`.

### Day 8 — WebSocket Infrastructure
- [ ] Install `socket.io` on Express server
- [ ] Auth middleware: verify JWT on WebSocket handshake
- [ ] Room strategy: per-user room + per-org room
- [ ] Event types: `lead:new`, `deal:stage-changed`, `appointment:reminder`, `message:new`, `notification:new`
- [ ] Frontend: `useSocket()` hook — auto-connect, auto-reconnect, typed events
- **Skill:** `/add-websocket-event`

### Day 9 — Live Dashboard Counters
- [ ] Emit WebSocket events from API mutations (lead create, deal update, appointment create)
- [ ] Dashboard: real-time counter animation on metric cards (count up effect)
- [ ] Toast notifications for team events: "أحمد أضاف عميل جديد"
- [ ] Activity feed: live stream of org activity (WebSocket-powered)

### Day 10 — Firebase Push Notifications
- [ ] Set up Firebase project + FCM
- [ ] Service worker registration (`firebase-messaging-sw.js`)
- [ ] API: `POST /api/notifications/subscribe` — save FCM token
- [ ] API: `POST /api/notifications/send` — send push via FCM Admin SDK
- [ ] Trigger push on: new lead assigned, deal stage change, appointment in 1h, new message
- [ ] Settings page: notification preferences (per-event toggle)

### Day 11 — PWA + Offline Mode
- [ ] Add `manifest.json` with Saudi branding (Arabic name, theme color, icons)
- [ ] Service worker: cache shell + API responses (stale-while-revalidate)
- [ ] Offline indicator banner: "أنت غير متصل — البيانات قد لا تكون محدثة"
- [ ] Queue offline mutations (lead status change, notes) → sync when back online
- [ ] "Install App" prompt on mobile browsers

### Day 12 — Agent Presence System
- [ ] WebSocket: heartbeat every 30s, track online/offline/idle per user
- [ ] API: `GET /api/presence` — list online agents in org
- [ ] Frontend: green/gray dot on agent avatars (team page, inbox, pipeline)
- [ ] "Last seen" timestamp for offline agents
- [ ] Typing indicator in inbox chat

### Day 13 — Notification Center Redesign
- [ ] New model: `user_notifications` (userId, type, title, body, entityType, entityId, read, createdAt)
- [ ] API: `GET /api/notifications` — paginated, unread count
- [ ] API: `PATCH /api/notifications/mark-read` — batch mark as read
- [ ] Frontend: bell icon in header with unread badge
- [ ] Dropdown panel: grouped by today/yesterday/older, click → navigate to entity
- [ ] WebSocket: push new notifications in real-time

### Day 14 — Sprint 2 Review & Polish
- [ ] Test WebSocket on multiple browser tabs simultaneously
- [ ] Test push notifications on mobile Safari + Chrome
- [ ] Test offline mode: disconnect WiFi, make changes, reconnect
- [ ] Run `/typecheck` + `/audit-rtl`
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S2 - Real-Time]] retro note

---

## Sprint 3 — Documents & Campaigns (8 days)

> Automate paperwork and nurture sequences. `$0` except email sending (`$free` tier).

### Day 15 — PDF Report Engine
- [ ] Create `libs/pdf-engine.ts` — HTML template → PDF using Puppeteer
- [ ] Branded templates: org logo, Arabic typography (IBM Plex Sans Arabic), RTL layout
- [ ] Template registry: invoice, contract, CMA report, agent card, commission statement
- [ ] API: `GET /api/documents/generate` — params: templateId, entityId → returns PDF buffer
- **Skill:** `/add-pdf-report`

### Day 16 — Contract Auto-Generation
- [ ] Template: Saudi sale/rent contract with REGA terms (Arabic legal text)
- [ ] Auto-fill: buyer name, seller name, property details, price, commission, dates
- [ ] API: `POST /api/deals/:id/generate-contract` — creates PDF, stores in `documents` table
- [ ] Frontend: "إنشاء العقد" button on deal detail → preview → download
- [ ] Digital signature placeholder (name + date + "أوافق على الشروط")

### Day 17 — Invoice & Commission Statements
- [ ] Invoice template: commission invoice with VAT (15%), ZATCA QR code placeholder
- [ ] Commission statement: monthly summary per agent — deals, rates, amounts, VAT
- [ ] API: `GET /api/commissions/statement?agentId=&month=` → PDF
- [ ] Frontend: download button on commissions page per row and monthly summary

### Day 18 — Drip Campaign Engine (Backend)
- [ ] New models: `campaigns` (name, status, steps Json, triggerType, triggerFilter)
- [ ] New model: `campaign_enrollments` (campaignId, leadId, currentStep, nextRunAt, status)
- [ ] Step types: send_whatsapp, send_email, wait_days, condition_check, assign_agent
- [ ] Cron: every 15 min, process due enrollments → execute step → advance to next
- **Skills:** `/add-prisma-model` → `/add-cron-job`

### Day 19 — Drip Campaign Engine (Frontend)
- [ ] Campaign builder page: name, trigger (new lead, status change, manual), steps list
- [ ] Step editor: drag to reorder, configure each step (template, delay, condition)
- [ ] Campaign dashboard: active campaigns, enrollment counts, conversion funnel
- [ ] Pause/resume/delete campaigns
- **Skill:** `/add-page`

### Day 20 — Collaborative Deal Rooms
- [ ] New model: `deal_rooms` (dealId), `deal_room_messages` (roomId, userId, content, type)
- [ ] API: CRUD for room messages + file attachments
- [ ] Frontend: Chat-like interface inside deal detail sheet
- [ ] Participants: listing agent, buyer agent, org owner
- [ ] WebSocket: real-time messages in deal room
- **Skill:** `/add-websocket-event`

### Day 21 — Email Integration
- [ ] Resend/Brevo SDK integration (free tier: 300/day)
- [ ] Email templates: welcome, lead assigned, deal update, campaign step, appointment reminder
- [ ] Arabic email templates with RTL HTML
- [ ] API: `POST /api/email/send` — internal service
- [ ] Settings: email notification preferences per user

### Day 22 — Sprint 3 Review & Polish
- [ ] Test PDF generation in Arabic (font rendering, RTL tables)
- [ ] Test drip campaign: create → enroll lead → verify steps execute
- [ ] Test deal room messaging between two users
- [ ] Run `/typecheck` + `/audit-rtl`
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S3 - Documents]] retro note

---

## Sprint 4 — AI Core (8 days)

> Add Claude-powered intelligence. `$$` — Claude API costs ~$3-15/1K conversations.

### Day 23 — AI Service Layer
- [ ] Create `libs/ai-service.ts` — Claude API client with retry, rate limiting, token tracking
- [ ] System prompts: Saudi real estate domain, Arabic-first, REGA-aware
- [ ] Token usage tracking: per-user, per-org, daily limits
- [ ] API: `GET /api/ai/usage` — token consumption dashboard
- **Skill:** `/add-ai-endpoint`

### Day 24 — AI Chatbot (Backend)
- [ ] New model: `chatbot_conversations` (visitorId, leadId, messages Json, status)
- [ ] API: `POST /api/chatbot/message` — public endpoint, no auth required
- [ ] Claude system prompt: property expert, qualifies leads, answers in Saudi Arabic
- [ ] Tool use: search properties (by type/city/budget), check availability, book viewing
- [ ] Auto-create lead when visitor provides contact info

### Day 25 — AI Chatbot (Frontend Widget)
- [ ] Floating chat widget component (bottom-left, RTL)
- [ ] Embed on public pages: landing, property listing, search
- [ ] Conversation UI: message bubbles, typing indicator, quick-reply buttons
- [ ] "تحدث مع مساعد عقاركم" trigger button
- [ ] Handoff to human agent button → creates inbox conversation

### Day 26 — Smart Property Matching
- [ ] Generate embeddings for all properties (title + description + features → vector)
- [ ] Store in `property_embeddings` table (propertyId, vector Float[])
- [ ] API: `POST /api/ai/match` — buyer requirements → cosine similarity → top 10 matches
- [ ] Frontend: "عقارات مقترحة لك" section on lead detail + buyer pool detail
- [ ] Nightly cron: re-embed new/updated properties
- **Skill:** `/add-embedding-search`

### Day 27 — AI Follow-Up Writer
- [ ] API: `POST /api/ai/draft-followup` — input: leadId → Claude generates personalized message
- [ ] Context: lead history, last contact, property interests, days since last touch
- [ ] Output: Arabic WhatsApp message draft (editable before sending)
- [ ] Frontend: "اكتب متابعة" button on lead detail → shows draft → edit → send
- [ ] Batch mode: select multiple leads → generate drafts for all

### Day 28 — AI Property Description Generator
- [ ] API: `POST /api/ai/generate-description` — input: property features → Arabic marketing copy
- [ ] REGA compliant: includes FAL number, ad license, accurate measurements
- [ ] Tone options: formal, friendly, luxury, investment-focused
- [ ] Frontend: "توليد وصف" button on post-listing form → fills description field
- [ ] SEO optimization: generates meta title + description

### Day 29 — Predictive Deal Forecasting
- [ ] API: `GET /api/ai/forecast` — analyzes pipeline deals, predicts close probability
- [ ] Claude structured output: { dealId, probability, expectedCloseDate, riskFactors, recommendation }
- [ ] Input: deal age, stage, last activity, similar historical deals
- [ ] Frontend: probability badge on pipeline cards, forecast chart on dashboard
- [ ] Weekly forecast email digest for org owners

### Day 30 — Sprint 4 Review & Polish
- [ ] Test chatbot: Arabic conversation, lead creation, property search
- [ ] Test matching accuracy: create buyer → verify relevant matches
- [ ] Test follow-up writer: generate for 10 leads, verify quality
- [ ] Load test AI endpoints (rate limiting works)
- [ ] Run `/typecheck` + `/audit-rtl`
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S4 - AI Core]] retro note

---

## Sprint 5 — Automation Engine (10 days)

> Visual workflow builder + advanced reporting. `$0`.

### Day 31 — Workflow Engine (Data Model)
- [ ] New models: `workflows` (name, trigger, status, steps Json, orgId)
- [ ] `workflow_runs` (workflowId, entityId, currentStep, status, startedAt, completedAt)
- [ ] Trigger types: lead_created, deal_stage_changed, appointment_missed, lead_score_above, time_based
- [ ] Action types: send_whatsapp, send_email, assign_agent, create_task, update_field, wait, condition
- **Skill:** `/add-prisma-model`

### Day 32 — Workflow Engine (Executor)
- [ ] Cron: every 5 min, process pending workflow runs
- [ ] Step executor: switch on action type, execute, advance to next step
- [ ] Condition evaluator: if/else branching based on entity fields
- [ ] Error handling: retry 3x, then mark as failed with error log
- [ ] API: CRUD for workflows + manual trigger
- **Skill:** `/add-cron-job`

### Day 33 — Workflow Builder UI (Canvas)
- [ ] Install `reactflow` (MIT license, free)
- [ ] Node types: trigger (green), action (blue), condition (yellow), wait (gray)
- [ ] Drag from sidebar palette → drop on canvas → connect with edges
- [ ] Node config panel: click node → edit parameters in side sheet
- [ ] Save/load workflow as JSON

### Day 34 — Workflow Builder UI (Polish)
- [ ] Validation: ensure trigger exists, all paths end, no orphan nodes
- [ ] Test run: execute workflow on a sample entity, show step-by-step result
- [ ] Templates: pre-built workflows (new lead follow-up, stale deal alert, appointment reminder)
- [ ] Workflow list page: status, last run, success rate, enable/disable toggle

### Day 35 — Advanced Report Builder v2
- [ ] Dimension picker: entity (leads, deals, properties), time (day/week/month), group-by fields
- [ ] Measure picker: count, sum, avg, min, max on numeric fields
- [ ] Filter builder: WHERE conditions with AND/OR logic
- [ ] Live preview: chart updates as you build the query
- [ ] Save report: name, schedule (daily/weekly/monthly email)

### Day 36 — Report Builder (Chart Types & Export)
- [ ] Chart types: bar, line, area, pie, radar, table, KPI card
- [ ] Pivot tables: row/column/value dimensions
- [ ] Export: PDF (branded), CSV, Excel
- [ ] Share: generate link, embed iframe
- [ ] Scheduled delivery: cron sends PDF to email list

### Day 37 — Cron Job Dashboard
- [ ] New page: "المهام المجدولة" — list all cron jobs with status
- [ ] Shows: job name, schedule, last run, next run, success/fail count
- [ ] Manual trigger button per job
- [ ] Error log viewer: last 50 errors per job
- [ ] Health check: alert if a job hasn't run in expected interval

### Day 38 — Audit Trail & Activity Log v2
- [ ] Enhanced `activity_log`: add `beforeJson` for diff comparison
- [ ] API: `GET /api/audit-trail` — filterable by entity, user, action, date range
- [ ] Frontend: timeline view with expandable diffs (before/after JSON viewer)
- [ ] Export audit trail as CSV/PDF for compliance
- [ ] Retention policy: auto-archive logs older than 1 year

### Day 39 — Template Library
- [ ] New model: `templates` (name, type, content, variables, orgId)
- [ ] Types: whatsapp_message, email, contract, invoice, sms
- [ ] Variable system: `{{lead.firstName}}`, `{{property.price}}`, `{{agent.name}}`
- [ ] Frontend: template editor with variable autocomplete + preview
- [ ] CRUD API + use in drip campaigns and workflow actions

### Day 40 — Sprint 5 Review & Polish
- [ ] Test workflow: create "new lead → wait 1h → send WhatsApp" → verify execution
- [ ] Test report builder: build a revenue-by-source report → verify data
- [ ] Test cron dashboard: verify all scheduled jobs visible
- [ ] Run `/typecheck` + `/audit-rtl`
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S5 - Automation]] retro note

---

## Sprint 6 — Analytics & Geospatial (6 days)

> Deep analytics and map intelligence. `$0` (Mapbox free tier: 50K loads/month).

### Day 41 — Cohort Analysis
- [ ] API: `GET /api/analytics/cohorts` — leads grouped by acquisition month
- [ ] Track: conversion rate, time-to-convert, retention (still active after 30/60/90 days)
- [ ] Frontend: cohort table (heatmap style) + line chart overlay
- [ ] Add as new tab in Reports page

### Day 42 — Funnel Analytics
- [ ] API: `GET /api/analytics/funnel` — lead → qualified → deal → won conversion rates
- [ ] Per-source breakdown: which channels have best funnel performance
- [ ] Frontend: funnel visualization (wide-to-narrow bars) with drop-off percentages
- [ ] Time-based: compare this month vs last month funnel

### Day 43 — Neighborhood Heat Maps
- [ ] API: `GET /api/analytics/price-heatmap` — price/sqm by district
- [ ] Mapbox GL heatmap layer: color intensity = price density
- [ ] Toggle layers: for-sale prices, rental prices, transaction volume
- [ ] Click district → tooltip with avg price, listing count, trend (up/down)
- **Skill:** `/add-map-layer`

### Day 44 — Market Trend Alerts
- [ ] Cron: weekly, compute price changes by city/district (vs 4 weeks ago)
- [ ] API: `GET /api/analytics/market-trends` — trending districts, price movements
- [ ] Alert system: notify agents when their listing area prices change >5%
- [ ] Frontend: "اتجاهات السوق" card on dashboard + dedicated trends page
- [ ] Claude summary: "أسعار حي النرجس ارتفعت 8% — 3 من عقاراتك أقل من السوق"

### Day 45 — Catchment Area Analysis
- [ ] Mapbox isochrone API (free tier) or manual radius calculation
- [ ] API: `GET /api/properties/:id/catchment` — nearby POIs within radius
- [ ] Categories: schools, mosques, hospitals, malls, parks, transit
- [ ] Frontend: map overlay on property detail showing POIs with distance
- [ ] Auto-generate "المرافق القريبة" section in listing description

### Day 46 — Sprint 6 Review & Polish
- [ ] Test heat map with real property data
- [ ] Test market alerts: simulate price change → verify notification
- [ ] Test cohort table: verify month boundaries and calculations
- [ ] Run `/typecheck` + `/audit-rtl`
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S6 - Analytics]] retro note

---

## Sprint 7 — Saudi Integrations (8 days)

> Connect to Saudi payment and messaging infrastructure. `$$` at scale.

### Day 47 — Payment Gateway Setup (HyperPay / Moyasar)
- [ ] Create merchant account (sandbox first)
- [ ] Install SDK, create `libs/payment-gateway.ts`
- [ ] API: `POST /api/payments/initiate` — create checkout session
- [ ] API: `POST /api/payments/webhook` — handle payment confirmation
- [ ] New model: `transactions` (amount, currency, status, gatewayRef, entityType, entityId)
- **Skill:** `/add-payment-flow`

### Day 48 — Payment UI & Flows
- [ ] Checkout page: amount, card form (HyperPay embedded), mada/Visa/MC
- [ ] Payment flows: earnest money deposit, commission payment, subscription fee
- [ ] Receipt generation: PDF with ZATCA QR code placeholder
- [ ] Transaction history page for agents and admins
- [ ] Refund flow: admin initiates → gateway processes → status updates

### Day 49 — WhatsApp Business API (Production)
- [ ] Meta Cloud API setup: business verification, phone number registration
- [ ] Template management: submit Arabic templates for approval
- [ ] API: send template messages (notifications, follow-ups, appointment reminders)
- [ ] Webhook: receive inbound messages → route to inbox
- [ ] Message queue: handle rate limits, retry failed sends

### Day 50 — WhatsApp Advanced Features
- [ ] Interactive messages: button replies, list menus
- [ ] Media messages: send property photos, PDF contracts
- [ ] Catalog integration: property listings as WhatsApp catalog items
- [ ] Read receipts: track delivery and read status
- [ ] Opt-in/opt-out management: PDPL compliance

### Day 51 — REGA API Integration
- [ ] Research REGA public endpoints (FAL verification, ad license validation)
- [ ] API: `GET /api/rega/verify-fal/:licenseNo` — verify agent FAL license
- [ ] API: `GET /api/rega/verify-ad/:adLicenseNo` — verify listing ad license
- [ ] Auto-check on agent signup: verify FAL before activation
- [ ] Auto-check on listing post: verify ad license before publishing
- [ ] Cache results: 24h TTL to reduce API calls

### Day 52 — REGA Compliance Dashboard
- [ ] Admin page: compliance overview across all agents and listings
- [ ] Expired FAL alerts: agents with FAL expiring in 30 days
- [ ] Missing ad licenses: listings without valid ad license number
- [ ] Compliance score per agent: % of listings with valid documentation
- [ ] Bulk re-verification: admin triggers re-check of all licenses

### Day 53 — SMS Gateway (Unifonic / Twilio)
- [ ] SMS provider setup (Unifonic for Saudi numbers)
- [ ] API: `POST /api/sms/send` — send OTP, notifications
- [ ] OTP flow: phone verification during signup
- [ ] Appointment reminders via SMS (fallback when WhatsApp unavailable)
- [ ] SMS templates with Arabic support

### Day 54 — Sprint 7 Review & Polish
- [ ] Test payment: sandbox checkout → verify webhook → confirm transaction
- [ ] Test WhatsApp: send template → receive reply → verify inbox routing
- [ ] Test REGA: verify valid FAL → pass, invalid → reject
- [ ] Run `/typecheck` + `/audit-rtl`
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S7 - Integrations]] retro note

---

## Sprint 8 — Identity, Mobile & Polish (8 days)

> Final mile: Saudi identity, advanced mobile, platform polish. `$$` for government APIs.

### Day 55 — Nafath / Absher KYC
- [ ] Research Nafath API access (enterprise partnership required)
- [ ] API: `POST /api/kyc/initiate` — send national ID for verification
- [ ] API: `GET /api/kyc/status/:id` — poll verification result
- [ ] UI flow: enter national ID → redirect to Nafath app → callback with result
- [ ] Store verification status on user profile
- [ ] Require KYC for: posting listings, signing contracts, receiving commissions

### Day 56 — Ejar Integration
- [ ] Research Ejar API (Ministry of Housing platform)
- [ ] API: `POST /api/ejar/register-lease` — register rental contract
- [ ] API: `GET /api/ejar/status/:contractId` — check registration status
- [ ] Auto-register: when tenancy created with all required fields
- [ ] Sync payment records with Ejar platform
- [ ] Tenant page: "مسجل في إيجار" badge on compliant contracts

### Day 57 — Thiqah (Trust) Score
- [ ] Compute agent reputation: deals closed (30%), response time (20%), client reviews (20%), REGA compliance (15%), listing quality (15%)
- [ ] API: `GET /api/agents/:id/thiqah-score` — returns score + breakdown
- [ ] Display on: agent profile, listing cards, search results
- [ ] Badge tiers: برونزي (0-40), فضي (41-70), ذهبي (71-90), ماسي (91-100)
- [ ] Monthly recalculation cron

### Day 58 — Mobile Property Capture
- [ ] Camera component: open device camera, capture photo
- [ ] Image editor: crop, rotate, brightness/contrast adjust (canvas API)
- [ ] AI enhancement: auto-straighten, remove clutter (future — Claude vision)
- [ ] Batch upload: capture multiple photos → auto-add to property form
- [ ] Compression: resize to max 1920px, WebP format, <500KB

### Day 59 — Client Portal Enhancements
- [ ] Buyer dashboard: saved properties, viewing history, agent rating
- [ ] Document center: contracts, invoices, payment receipts (PDF viewer)
- [ ] Appointment self-booking: pick time slot from agent availability
- [ ] Progress tracker: deal stage visualization for buyers/sellers
- [ ] Notifications: push alerts for deal updates, new matches

### Day 60 — Performance Optimization
- [ ] Lighthouse audit: target 90+ on all pages
- [ ] Image optimization: lazy load, WebP, srcset for responsive
- [ ] Bundle analysis: identify and eliminate large dependencies
- [ ] Database: add missing indexes on frequently queried columns
- [ ] API: add Redis caching for expensive queries (analytics, reports)
- [ ] Rate limiting: protect AI endpoints and public APIs

### Day 61 — Security Hardening
- [ ] OWASP audit: check for XSS, CSRF, SQL injection, broken auth
- [ ] Content Security Policy headers
- [ ] API rate limiting per user/IP
- [ ] Input sanitization audit on all user-facing endpoints
- [ ] Secrets management: move all API keys to environment variables
- [ ] PDPL (Saudi data protection) compliance check

### Day 62 — Sprint 8 Review & Final Polish
- [ ] Full regression test: all 24 platform pages
- [ ] Mobile responsive check: all pages on iPhone/Android viewport
- [ ] Arabic text audit: no corrupted Unicode, consistent terminology
- [ ] Run `/typecheck` + `/audit-rtl` + `/audit-tokens` + `/audit-org-isolation`
- [ ] Run `/commit-and-track`
- [ ] Write [[Sessions/S8 - Polish]] retro note
- [ ] Update [[Home]] with new features and skills

---

## Skills Required

| Skill | Sprint | Purpose |
|---|---|---|
| `/add-ai-endpoint` | S4 | Scaffold Claude API powered endpoint |
| `/add-websocket-event` | S2, S3 | Add real-time WebSocket event |
| `/add-workflow-trigger` | S5 | Create automation workflow trigger |
| `/add-pdf-report` | S1, S3 | Generate branded PDF from template |
| `/add-payment-flow` | S7 | Scaffold payment gateway integration |
| `/add-cron-job` | S1, S3, S5 | Create scheduled background job |
| `/add-analytics-widget` | S1, S6 | Add analytics chart/metric |
| `/add-embedding-search` | S4 | Vector similarity search |
| `/add-map-layer` | S6 | Add data layer to map page |
| `/add-pwa-feature` | S2 | PWA/offline capability |

## Existing Skills (still used)

`/add-page` · `/add-api-route` · `/add-prisma-model` · `/add-react-query` · `/add-feature` · `/db-push` · `/typecheck` · `/audit-rtl` · `/audit-tokens` · `/audit-org-isolation` · `/commit-and-track` · `/track-change` · `/complete-session`

---

## Verification Per Sprint

1. `npx tsc --noEmit` — 0 errors
2. All new pages load without crash
3. All new API endpoints return correct data
4. UI renders correctly in RTL Arabic
5. No hardcoded colors (`/audit-tokens`)
6. No LTR-only classes (`/audit-rtl`)
7. Org isolation maintained (`/audit-org-isolation`)
8. Sprint retro note written in vault
