# System Patterns

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │  React 18 + TypeScript + Wouter
│   (apps/web)    │  Tailwind CSS + Framer Motion
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend API   │  Express.js + TypeScript
│   (apps/api)    │  Prisma ORM + PostgreSQL
└────────┬────────┘
         │
         │ Prisma Client
         │
┌────────▼────────┐
│   PostgreSQL    │  real_estate_crm database
│   Database      │  real_estate_crm schema
└─────────────────┘
```

### Monorepo Structure

```
real-estate-CRM-project/
├── apps/
│   ├── api/          # Backend Express API
│   └── web/          # Frontend React App
├── packages/
│   └── shared/       # Shared types and utilities
├── data/
│   ├── schema/       # Prisma schema
│   └── warehouse/    # Analytics warehouse
├── docs/             # Documentation
└── .cursor/rules/    # Cursor rules and memory bank
```

## Key Technical Decisions

### 1. RTL-First Architecture

**Pattern**: Logical properties throughout
- Use `ms-*`, `me-*`, `ps-*`, `pe-*` instead of `ml-*`, `mr-*`, `pl-*`, `pr-*`
- Use `start-*`, `end-*` instead of `left-*`, `right-*`
- Never use `left`, `right`, `text-left`, `text-right` directly

**Rationale**: Ensures perfect RTL/LTR mirroring without conditional logic

### 2. Centered Main Content Layout

**Pattern**: Admin and Platform shells center main content with `max-w-7xl`
- Main: `flex flex-col items-center min-w-0`
- Inner wrapper: `w-full max-w-7xl` (1280px)
- Admin: `AdminLayout.tsx`; Platform: `PlatformShell.tsx`

**Rationale**: Content floats centered on wide viewports instead of stretching edge-to-edge

### 3. Numeric Display Pattern

**Pattern**: English numerals (en-US) for all numeric values
- Use `toLocaleString("en-US")` or `Intl.NumberFormat("en-US", {...})`
- Export `NUMERIC_LOCALE = "en-US"` from `lib/formatters.ts`
- Applies to: prices, amounts, counts, pagination, area (m²)
- Dates remain language-specific (ar-SA for Arabic, en-US for English)

**Rationale**: Consistent Western digits (0-9) regardless of UI language

### 4. Multi-Tenancy Model

**Pattern**: RBAC + ABAC with PostgreSQL RLS
- Role-based access control (6 roles: WEBSITE_ADMIN, CORP_OWNER, CORP_AGENT, INDIV_AGENT, SELLER, BUYER)
- Attribute-based access control (ownership, territory, status)
- Row-level security in PostgreSQL
- Express middleware for route protection

**Rationale**: Secure multi-tenant isolation with flexible permissions

### 5. CMS Architecture

**Pattern**: Draft/Publish workflow with version control
- `LandingSection` and `LandingCard` tables
- `draftJson` and `publishedJson` fields
- `status` field: `draft`, `published`, `archived`
- Audit logging via `LandingAuditLog` and `LandingVersion`

**Rationale**: Content versioning and approval workflows

### 6. Authentication & Session Management

**Pattern**: JWT + Express Sessions
- JWT tokens for API authentication
- Express sessions stored in PostgreSQL (`connect-pg-simple`)
- Bcrypt for password hashing
- Session middleware for stateful operations

**Rationale**: Secure authentication with session persistence

### 7. State Management

**Pattern**: React Query + Local State
- `@tanstack/react-query` for server state
- `useState`/`useEffect` for local component state
- No global state management library (Redux/Zustand)

**Rationale**: Simpler architecture, React Query handles caching and synchronization

## Design Patterns

### 1. Component Composition

**Pattern**: Small, focused components composed together
- Atomic design principles
- Reusable UI components in `components/ui/`
- Feature-specific components in `components/landing/`, `components/admin/`

**Example**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### 2. Service Layer Pattern

**Pattern**: Business logic in service classes
- Services in `apps/api/services/` and `apps/api/src/services/`
- Routes delegate to services
- Services handle database operations via Prisma

**Example**:
```typescript
export class LandingService {
  async getPublicLanding() { ... }
  async createSection(params) { ... }
}
```

### 3. Middleware Chain Pattern

**Pattern**: Express middleware for cross-cutting concerns
- Authentication middleware
- RBAC middleware
- Locale middleware
- Error handling middleware

**Example**:
```typescript
router.get('/api/protected', 
  authMiddleware, 
  rbacMiddleware(['CORP_OWNER']), 
  handler
);
```

### 4. Error Boundary Pattern

**Pattern**: React error boundaries for graceful error handling
- `LandingErrorBoundary` for landing page
- Catches rendering errors
- Displays user-friendly Arabic error messages

## Component Relationships

### Frontend Component Hierarchy

```
App
├── Router
│   ├── Public Routes
│   │   ├── Landing Page
│   │   └── Login/Signup
│   └── Authenticated Routes
│       ├── PlatformShell (Sidebar + Header)
│       │   ├── Dashboard
│       │   ├── Properties
│       │   ├── Leads
│       │   └── Admin (if admin)
│       └── Admin Routes (if admin)
│           ├── User Management
│           ├── CMS
│           └── Analytics
```

### Backend Route Structure

```
/api/
├── auth/              # Authentication endpoints
├── listings/          # Property listings
├── leads/            # Lead management
├── buyer-pool/        # Buyer pool operations
├── cms-landing/       # CMS endpoints
├── rbac-admin/        # Admin operations
└── knowledge-base/    # Agent memory system
```

## Data Flow Patterns

### 1. CMS Content Flow

```
Admin edits → Draft saved → Review → Publish → Public API → Frontend renders
```

### 2. Lead Management Flow

```
Buyer inquiry → Lead created → Agent claims → Follow-up → Conversion
```

### 3. Buyer Pool Flow

```
Buyer request → Request created → Agents browse → Agent claims → 72h exclusivity
```

## Database Patterns

### 1. Audit Trail Pattern

**Pattern**: Audit logs for critical operations
- `audit_logs` table tracks all changes
- `beforeJson` and `afterJson` for change tracking
- Timestamps and user tracking

### 2. Soft Delete Pattern

**Pattern**: Status-based archiving instead of hard deletes
- `status` field: `active`, `archived`, `deleted`
- Queries filter by status
- Preserves data for audit and recovery

### 3. Version Control Pattern

**Pattern**: Draft/publish with versioning
- `draftJson` and `publishedJson` fields
- `LandingVersion` table for history
- Rollback capability

## Security Patterns

### 1. RBAC Pattern

**Pattern**: Role-based access control
- 6 core roles with hierarchical permissions
- Middleware checks roles before route access
- Database RLS enforces at data level

### 2. Input Validation Pattern

**Pattern**: Zod schemas for validation
- Request validation before processing
- Type-safe schemas
- Clear error messages

### 3. Rate Limiting Pattern

**Pattern**: Express rate limiting middleware
- Prevents abuse
- Configurable limits per route
- IP-based tracking

## Performance Patterns

### 1. Caching Strategy

**Pattern**: Multi-layer caching
- React Query client-side caching
- API response caching headers
- Database query optimization

### 2. Lazy Loading Pattern

**Pattern**: Code splitting and lazy imports
- Route-based code splitting
- Component lazy loading
- Dynamic imports for heavy libraries

### 3. Database Optimization

**Pattern**: Indexes and query optimization
- Strategic indexes on foreign keys and search fields
- Prisma query optimization
- Connection pooling
