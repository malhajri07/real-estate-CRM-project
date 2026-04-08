# Aqarkom (عقاركم) — Real Estate CRM Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          عقاركم — Aqarkom Platform                         │
│                    Saudi Real Estate CRM & Marketplace                      │
│                      REGA Compliant · Arabic RTL · FAL                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
│    Public Website     │    │   Agent Platform      │    │   Admin Panel      │
│                       │    │                        │    │                    │
│  Landing Page         │    │  Dashboard             │    │  User Management   │
│  Property Search/Map  │    │  Properties            │    │  Moderation Queue  │
│  Listing Detail       │    │  Leads & Pipeline      │    │  Unverified Listings│
│  Agent Profiles       │    │  Calendar & Activities │    │  CMS Editor        │
│  Signup/Login         │    │  Broker Requests       │    │  Analytics         │
│                       │    │  Campaign Management   │    │  System Settings   │
│                       │    │  Promotions            │    │  Role Management   │
│                       │    │  Buyer Pool            │    │  Billing           │
│                       │    │  Forum                 │    │  Security          │
│                       │    │  Settings              │    │                    │
└──────────┬───────────┘    └──────────┬─────────────┘    └────────┬───────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │   React SPA     │
                              │   Vite + TS     │
                              │   Tailwind CSS  │
                              │   shadcn/ui     │
                              │   RTL (Arabic)  │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Express.js API │
                              │   Port 3000     │
                              │  REST Endpoints │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
           ┌────────▼───────┐ ┌───────▼────────┐ ┌──────▼──────┐
           │  PostgreSQL    │ │  Prisma ORM    │ │  File Store │
           │  Database      │ │  Schema + Client│ │  Uploads    │
           └────────────────┘ └────────────────┘ └─────────────┘
```

## Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND                                                        │
│                                                                 │
│  React 18 ─── Vite ─── TypeScript ─── Tailwind CSS v3.4        │
│  shadcn/ui ─── Radix UI ─── Lucide Icons                       │
│  TanStack React Query ─── React Hook Form ─── Zod              │
│  Recharts (shadcn ChartContainer) ─── date-fns                 │
│  IBM Plex Sans Arabic ─── tweakcn Emerald Theme (hue 160)      │
│  Radix DirectionProvider (RTL) ─── CSS Logical Properties       │
├─────────────────────────────────────────────────────────────────┤
│ BACKEND                                                         │
│                                                                 │
│  Express.js ─── TypeScript ─── tsx (runtime)                    │
│  Prisma ORM ─── PostgreSQL ─── pg driver adapter                │
│  Zod (validation) ─── bcrypt (auth) ─── JWT (sessions)         │
│  pino (logging) ─── i18n (ar/en)                                │
├─────────────────────────────────────────────────────────────────┤
│ TESTING                                                         │
│                                                                 │
│  Playwright ─── E2E (41 tests) ─── Video + Screenshot capture  │
├─────────────────────────────────────────────────────────────────┤
│ COMPLIANCE                                                      │
│                                                                 │
│  REGA (الهيئة العامة للعقار) ─── FAL License Enforcement        │
│  Commission Cap 2.5% ─── REGA Ad License ─── Earnest Money 5%  │
│  RETT Tax 5% ─── Saudi National Address ─── Ejar Integration   │
│  SAMA Saudi Riyal SVG ─── Saudi Phone Validation                │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema (Key Models)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   users      │────▶│ agent_profiles│     │  organizations  │
│              │     │              │     │                 │
│ id           │     │ falLicense#  │     │ tradeName       │
│ firstName    │     │ falType      │     │ legalName       │
│ lastName     │     │ falStatus    │     │ crNumber        │
│ email        │     │ falIssuedAt  │     │ vatNumber       │
│ phone        │     │ falExpiresAt │     │ falLicense#     │
│ roles (JSON) │     │ nationalId   │     │ nationalAddress │
│ organizationId│    │ specialties  │     │ city / region   │
│ metadata     │     │ territories  │     │                 │
│ isActive     │     │ bio          │     │                 │
└──────┬───────┘     │ experience   │     └────────┬────────┘
       │             └──────────────┘              │
       │                                           │
       ▼                                           ▼
┌──────────────┐  ┌────────────┐  ┌──────────────────────────┐
│  properties  │──│  listings  │  │  leads                   │
│              │  │            │  │                          │
│ title        │  │ listingType│  │ agentId                  │
│ type         │  │ price      │  │ firstName / lastName     │
│ city/district│  │ status     │  │ phone / email            │
│ price        │  │ falLicense#│  │ status (NEW→WON/LOST)    │
│ bedrooms     │  │ regaAdLic# │  │ interestType / budget    │
│ bathrooms    │  │ agentId    │  │ city / source            │
│ areaSqm      │  │ adStartDate│  │ lastContactAt            │
│ photos       │  │ adEndDate  │  │                          │
│ deedNumber   │  │            │  │                          │
│ legalStatus  │  └─────┬──────┘  └────────────┬─────────────┘
│ latitude/lng │        │                      │
└──────────────┘        │                      │
                        ▼                      ▼
              ┌─────────────────┐    ┌─────────────────────┐
              │  deals          │    │  appointments       │
              │                 │    │                     │
              │ stage           │    │ scheduledAt         │
              │ value           │    │ status              │
              │ agreedPrice     │    │ agentId             │
              │ commission      │    │ customerId          │
              │ earnestMoney    │    │ listingId           │
              │ source          │    │ notes               │
              └─────────────────┘    └─────────────────────┘
```

## Agent Platform Pages

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT SIDEBAR NAVIGATION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ الرئيسية (Main) ──────────────────────────────────────┐    │
│  │  📊 لوحة التحكم     /home/platform                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─ العقارات والسوق (Properties) ──────────────────────────┐   │
│  │  🏠 العقارات         /home/platform/properties           │   │
│  │  📋 حوض الطلبات      /home/platform/pool                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ إدارة العملاء (CRM) ───────────────────────────────────┐   │
│  │  👥 جهات الاتصال     /home/platform/leads                │   │
│  │  📈 الصفقات          /home/platform/pipeline              │   │
│  │  👤 العملاء          /home/platform/clients               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ الجدولة (Scheduling) ──────────────────────────────────┐   │
│  │  📅 المواعيد         /home/platform/calendar              │   │
│  │  ✅ المهام           /home/platform/activities             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ التعاون (Collaboration) ───────────────────────────────┐   │
│  │  🤝 طلبات التعاون    /home/platform/broker-requests       │   │
│  │  💬 المنتدى          /home/platform/forum                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ السوق (Marketplace) ──────────────────────────────────┐   │
│  │  📢 ترويج الإعلانات  /home/platform/marketing-requests    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ التحليلات (Analytics) ─────────────────────────────────┐   │
│  │  📊 التقارير         /home/platform/reports               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ الإعدادات (Settings) ──────────────────────────────────┐   │
│  │  ⚙️ الإعدادات        /home/platform/settings              │   │
│  │  📢 الحملات          /home/platform/notifications         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## API Routes Architecture

```
/api
├── /auth
│   ├── POST   /login                    Login (JWT)
│   ├── POST   /register                 Signup (individual/corporate)
│   ├── GET    /user                     Current user + agent_profiles
│   ├── PUT    /user                     Update profile + whatsapp
│   ├── PUT    /agent-profile            Update FAL, specialties, bio, IBAN
│   ├── PUT    /password                 Change password
│   ├── GET    /preferences              Notification preferences (9 categories)
│   └── PUT    /preferences              Update preferences
│
├── /listings
│   ├── GET    /                          List (filter, search, paginate)
│   ├── GET    /featured                  Featured listings
│   ├── GET    /:id                       Detail
│   ├── POST   /                         Create [FAL + REGA compliance gate]
│   └── PUT    /:id                       Update
│
├── /leads
│   ├── GET    /                          List (org-scoped)
│   ├── POST   /                         Create
│   ├── PUT    /:id                       Update / status change
│   └── DELETE /:id                       Delete
│
├── /deals
│   ├── GET    /                          Pipeline (org-scoped)
│   ├── POST   /                         Create [commission cap validated]
│   └── PUT    /:id                       Update stage
│
├── /broker-requests
│   ├── GET    /                          List open + own
│   ├── POST   /                         Create [FAL required]
│   ├── POST   /:id/accept               Apply to collaborate
│   ├── PATCH  /:id/acceptances/:aid      Approve/reject
│   ├── POST   /:id/acceptances/:aid/generate-agreement   Generate contract
│   ├── PATCH  /:id/acceptances/:aid/sign                  Digital signature
│   └── GET    /:id/acceptances/:aid/agreement             Get agreement data
│
├── /campaigns
│   ├── GET    /                          List agent's campaigns
│   ├── POST   /                         Send campaign [updates lastContactAt]
│   ├── GET    /:id                       Campaign detail + recipients
│   ├── GET    /stats/summary             Aggregated metrics
│   ├── GET    /rules                     Automation rules
│   ├── POST   /rules                     Create rule
│   ├── PATCH  /rules/:id                 Toggle / update rule
│   └── DELETE /rules/:id                 Delete rule
│
├── /promotions
│   ├── GET    /                          Agent's promotions
│   ├── GET    /stats                     Impressions, clicks, spend
│   ├── GET    /listings                  Available listings to promote
│   ├── POST   /                         Create promotion (bid)
│   └── PATCH  /:id                       Pause/resume/cancel
│
├── /appointments                         Calendar CRUD
├── /activities                           Task management
├── /notifications                        System notifications
├── /nearby-places                        POI cache (mosques, schools, etc.)
├── /reports                              Dashboard metrics
├── /community                            Forum posts/comments
└── /buyer-pool                           Buyer request marketplace
```

## REGA Compliance Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   REGA COMPLIANCE ENFORCEMENT                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Agent Signup ──────────────────────────────────────────┐    │
│  │  FAL License # required ─── FAL Type selected           │    │
│  │  SREI certification ─── National ID                     │    │
│  └─────────────────────────────┬───────────────────────────┘    │
│                                │                                │
│                                ▼                                │
│  ┌─ FAL License Middleware ────────────────────────────────┐    │
│  │                                                         │    │
│  │  requireFalLicense() checks:                            │    │
│  │    ✓ Agent has FAL license number                       │    │
│  │    ✓ FAL not expired                                    │    │
│  │    ✓ Warning if <60 days to expiry                      │    │
│  │    ✗ Blocks: listing creation, broker requests          │    │
│  │    ○ Admin bypass                                       │    │
│  │                                                         │    │
│  └─────────────────────────────┬───────────────────────────┘    │
│                                │                                │
│                                ▼                                │
│  ┌─ Listing Publication Gate ──────────────────────────────┐    │
│  │                                                         │    │
│  │  checkListingRegaCompliance() enforces:                 │    │
│  │    ☐ رقم رخصة فال (FAL license #)                       │    │
│  │    ☐ رقم ترخيص الإعلان (REGA ad license #)              │    │
│  │    ☐ المدينة (city)                                      │    │
│  │    ☐ الحي (district)                                     │    │
│  │    ☐ المساحة (area)                                      │    │
│  │    ☐ السعر (price)                                       │    │
│  │    ☐ نوع العقار (property type)                          │    │
│  │    ☐ وصف العقار (description)                            │    │
│  │  Drafts bypass — only enforced on publish                │    │
│  │                                                         │    │
│  └─────────────────────────────┬───────────────────────────┘    │
│                                │                                │
│                                ▼                                │
│  ┌─ Commission Validation ─────────────────────────────────┐    │
│  │                                                         │    │
│  │  Article 14: Max 2.5% (sale & rental)                   │    │
│  │  Rental: first year only                                │    │
│  │  Multi-party: total ≤ 2.5%, split equally               │    │
│  │  Override: requires written signed agreement             │    │
│  │                                                         │    │
│  │  Earnest Money (Article 21): Max 5%                     │    │
│  │  Broker share if deal fails: 25% of earnest             │    │
│  │                                                         │    │
│  │  RETT Tax: 5% (Sakani exemption up to 1M SAR)          │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Co-Brokerage Agreement Flow

```
Agent A                           System                          Agent B
  │                                  │                               │
  │  1. Create Broker Request        │                               │
  │  (property, commission, terms)   │                               │
  │ ────────────────────────────────▶│                               │
  │                                  │  2. Request visible in        │
  │                                  │     marketplace               │
  │                                  │──────────────────────────────▶│
  │                                  │                               │
  │                                  │  3. Apply to collaborate      │
  │                                  │     (notes, proposed rate)    │
  │                                  │◀──────────────────────────────│
  │  4. Review & Approve             │                               │
  │ ────────────────────────────────▶│                               │
  │                                  │                               │
  │  5. Generate Agreement           │                               │
  │  (CBA-2026-XXXXX)               │                               │
  │ ────────────────────────────────▶│                               │
  │                                  │  ┌──────────────────────┐     │
  │                                  │  │ عقد تعاون وساطة عقارية│     │
  │                                  │  │                      │     │
  │                                  │  │ Party 1: Agent A     │     │
  │                                  │  │   FAL: 70XXXXXXXX    │     │
  │                                  │  │ Party 2: Agent B     │     │
  │                                  │  │   FAL: 70XXXXXXXX    │     │
  │                                  │  │                      │     │
  │                                  │  │ Property: Villa...   │     │
  │                                  │  │ Commission: 2.5%     │     │
  │                                  │  │ Split: 50/50         │     │
  │                                  │  │ Duration: 90 days    │     │
  │                                  │  │                      │     │
  │                                  │  │ 8 REGA Articles      │     │
  │                                  │  └──────────────────────┘     │
  │                                  │                               │
  │  6. Sign (timestamp)             │                               │
  │ ────────────────────────────────▶│                               │
  │                                  │  7. Sign (timestamp)          │
  │                                  │◀──────────────────────────────│
  │                                  │                               │
  │                                  │  Status: SIGNED ✓             │
  │                                  │                               │
  │  8. Download PDF / Share WhatsApp│                               │
  │ ────────────────────────────────▶│                               │
```

## Campaign Management System

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMPAIGN MANAGEMENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Smart Dashboard (الذكاء) ──────────────────────────────┐   │
│  │                                                          │   │
│  │  Rule Engine analyzes leads in real-time:                │   │
│  │    🔥 New leads (48h, no contact) → "عاجل"              │   │
│  │    ⏱️  Cold leads (7+ days) → "متابعة"                    │   │
│  │    🔥 Hot leads (qualified) → "فرصة إغلاق"              │   │
│  │    👤 Stale leads (14+ days) → "أعد التفاعل"            │   │
│  │                                                          │   │
│  │  Quick Segments: All active | Buyers | Renters |         │   │
│  │                  Riyadh | Jeddah | High budget           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Automation Rules (الأتمتة) ────────────────────────────┐   │
│  │                                                          │   │
│  │  Visual Rule Builder:                                    │   │
│  │    IF [حالة = جديد] AND [المدينة = الرياض]              │   │
│  │       AND [أيام بدون تواصل > 7]                         │   │
│  │    THEN → Send WhatsApp message                          │   │
│  │                                                          │   │
│  │  10 filter types: status, days no contact, city,         │   │
│  │    interest type, budget min/max, source, has phone/email│   │
│  │                                                          │   │
│  │  Live preview: "12 عميل مطابق"                           │   │
│  │  Persisted to DB: automation_rules table                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Campaign Composer ─────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Step 1: Audience (segment pills + lead checkboxes)      │   │
│  │  Step 2: Channel (WhatsApp / SMS / Email)                │   │
│  │  Step 3: Message (templates + variables {name} {city})   │   │
│  │  → Send to N clients                                     │   │
│  │  → Updates lastContactAt on leads                        │   │
│  │  → Tracks: delivered, opened, responded                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Listing Promotion System

```
┌─────────────────────────────────────────────────────────────────┐
│               LISTING PROMOTION (Google Ads Model)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agent selects listing → Sets budget → Bids on ranking          │
│                                                                 │
│  ┌─ Bid Tiers ─────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  0.5 ر.س  أساسي     → Standard visibility               │   │
│  │  1.0 ر.س  مميز      → Higher ranking                    │   │
│  │  2.0 ر.س  متقدم     → Priority in results               │   │
│  │  5.0 ر.س  بريميوم   → Top position + badge              │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Daily Budget → Total Budget Cap → City Targeting               │
│                                                                 │
│  Metrics: Impressions │ Clicks (CTR%) │ Inquiries │ Spend       │
│                                                                 │
│  Controls: Play ▶ │ Pause ⏸ │ Cancel ✕                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Settings Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SETTINGS (Two-Column)                        │
├────────────────┬────────────────────────────────────────────────┤
│  Sidebar Nav   │  Content Area                                  │
│                │                                                │
│  ┌────────┐   │  Profile Summary Card                          │
│  │الملف    │   │  ┌─ Name ─ FAL Badge ─ Email ─ Progress ──┐   │
│  │الشخصي  │◀──│  │  ████████████████░░░░  70%               │   │
│  ├────────┤   │  │  Missing: واتساب، نبذة مهنية              │   │
│  │المهني   │   │  └──────────────────────────────────────────┘   │
│  ├────────┤   │                                                │
│  │الشركة  │   │  ┌─ Active Section Content ─────────────────┐  │
│  │(corp)  │   │  │                                           │  │
│  ├────────┤   │  │  Profile: name, email, phone, WhatsApp    │  │
│  │المالية  │   │  │  Professional: FAL edit, bio, specs,      │  │
│  ├────────┤   │  │    cities, working hours                   │  │
│  │الأمان  │   │  │  Payments: IBAN, bank (11 Saudi banks)    │  │
│  ├────────┤   │  │  Security: password, active sessions       │  │
│  │الإشعارات│   │  │  Notifications: 9 toggles in 4 groups    │  │
│  └────────┘   │  │                                           │  │
│               │  └───────────────────────────────────────────┘  │
│  Completion   │                                                │
│  checklist    │                                                │
│  ● واتساب    │                                                │
│  ● نبذة مهنية│                                                │
│  ● الآيبان   │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

## Data Flow

```
                    ┌──────────┐
                    │  Client  │
                    │ (Browser)│
                    └────┬─────┘
                         │ HTTPS
                         ▼
                 ┌───────────────┐
                 │  Vite Dev /   │
                 │  Express SSR  │
                 │  Port 3000    │
                 └───────┬───────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
     ┌──────▼─────┐ ┌───▼────┐ ┌────▼──────┐
     │ Auth       │ │ RBAC   │ │ FAL       │
     │ Middleware │ │ Guard  │ │ Middleware │
     │ (JWT)     │ │ (roles)│ │ (license) │
     └──────┬─────┘ └───┬────┘ └────┬──────┘
            │            │           │
            └────────────┼───────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │  Route Handler│
                 │  (Zod valid.) │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │  Prisma ORM   │
                 │  (pg adapter) │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │  PostgreSQL   │
                 │  real_estate  │
                 │  _crm        │
                 └───────────────┘
```
