# Technical Context

## Technology Stack

### Frontend

- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type safety
- **Wouter 3.3.5** - Client-side routing
- **Vite 5.4.19** - Build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Framer Motion 11.13.1** - Animation library
- **@tanstack/react-query 5.60.5** - Server state management
- **Lucide React 0.453.0** - Icon library
- **Shadcn/UI** - Component library (Radix UI primitives)

### Backend

- **Node.js** - Runtime environment
- **Express.js 4.21.2** - Web framework
- **TypeScript 5.6.3** - Type safety
- **Prisma 6.16.0** - ORM and database toolkit
- **PostgreSQL** - Primary database
- **JWT (jsonwebtoken 9.0.2)** - Authentication tokens
- **Bcryptjs 3.0.2** - Password hashing
- **Express-session 1.18.1** - Session management
- **Connect-pg-simple 10.0.0** - PostgreSQL session store

### Database

- **PostgreSQL** - Primary database
- **Schema**: `real_estate_crm` on database `real_estate_crm`
- **Prisma Client** - Type-safe database access
- **Row-Level Security (RLS)** - Multi-tenancy enforcement

### Development Tools

- **TSX 4.19.1** - TypeScript execution
- **ESLint 9.34.0** - Linting
- **TypeScript Compiler** - Type checking
- **Prisma Studio** - Database GUI

### Deployment & Infrastructure

- **Docker** - Containerization
- **Google Cloud Platform (GCP)**
  - Cloud Run - Application hosting
  - Cloud SQL - PostgreSQL hosting
  - Cloud Storage - Asset storage
  - BigQuery - Analytics warehouse
- **dbt** - Data transformation
- **Metabase** - Analytics dashboards

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Local Development

1. **Database Setup**
   ```bash
   # Create database and schema
   scripts/setup-db.sh
   
   # Run migrations
   npm run db:deploy
   
   # Generate Prisma Client
   npm run db:generate
   ```

2. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Configure `DATABASE_URL`: `postgresql://localhost:5432/real_estate_crm?schema=real_estate_crm`
   - Set `JWT_SECRET`, `SESSION_SECRET`, etc.

3. **Start Development Servers**
   ```bash
   # Unified server (port 3000)
   npm run dev:unified
   
   # Or separate servers
   npm run dev:server  # Backend
   npm run dev:client  # Frontend
   ```

### Project Structure

```
apps/
├── api/                    # Backend Express API
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── middleware/        # Express middleware
│   ├── prismaClient.ts    # Prisma client instance
│   └── index.ts           # Entry point
└── web/                    # Frontend React app
    ├── src/
    │   ├── pages/         # Page components
    │   ├── components/    # Reusable components
    │   ├── lib/           # Utilities and helpers
    │   ├── hooks/         # Custom React hooks
    │   └── App.tsx        # Root component
    └── vite.config.ts     # Vite configuration

data/
├── schema/
│   └── prisma/
│       └── schema.prisma  # Database schema
└── warehouse/              # Analytics warehouse

packages/
└── shared/                 # Shared types and utilities
```

## Technical Constraints

### 1. RTL-First Requirement

- **Constraint**: All UI must be RTL-first
- **Impact**: Must use logical properties, no `left`/`right` usage
- **Enforcement**: Linting rules, code review

### 2. Multi-Tenancy Security

- **Constraint**: Strict data isolation between tenants
- **Impact**: All queries must respect RLS, middleware checks required
- **Enforcement**: Database RLS policies, middleware validation

### 3. Arabic Typography

- **Constraint**: Proper Arabic text rendering
- **Impact**: Line-height 1.6-1.8, proper font weights, no text-transform
- **Enforcement**: Design system guidelines

### 4. Performance Requirements

- **Constraint**: Fast page loads, responsive interactions
- **Impact**: Code splitting, lazy loading, query optimization
- **Enforcement**: Performance budgets, monitoring

### 5. Browser Support

- **Constraint**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Impact**: Can use modern JavaScript features
- **Enforcement**: Build tool configuration

## Dependencies

### Key Production Dependencies

**Frontend:**
- `react`, `react-dom` - Core React library
- `wouter` - Routing
- `@tanstack/react-query` - Data fetching
- `tailwindcss` - Styling
- `framer-motion` - Animations
- `lucide-react` - Icons

**Backend:**
- `express` - Web framework
- `@prisma/client` - Database client
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `express-session` - Sessions
- `connect-pg-simple` - Session store

### Development Dependencies

- `typescript` - Type checking
- `tsx` - TypeScript execution
- `vite` - Build tool
- `eslint` - Linting
- `@types/*` - Type definitions

## Build & Deployment

### Build Process

```bash
# Build both frontend and backend
npm run build

# Frontend builds to apps/web/dist/
# Backend builds to dist/index.js
```

### Production Deployment

1. **Build artifacts**
   ```bash
   npm run build
   ```

2. **Environment variables**
   - Set production `DATABASE_URL`
   - Configure `JWT_SECRET`, `SESSION_SECRET`
   - Set `NODE_ENV=production`
   - Configure `PUBLIC_BASE_URL`

3. **Database migrations**
   ```bash
   npm run db:deploy
   ```

4. **Start server**
   ```bash
   npm start
   # Or with PM2
   pm2 start dist/index.js
   ```

### GCP Deployment

- **Cloud Run**: Containerized app deployment
- **Cloud SQL**: Managed PostgreSQL
- **Cloud Storage**: Static assets and media
- **Cloud Build**: CI/CD pipeline

See `docs/deployment/GCP-DEPLOYMENT.md` for detailed instructions.

## Database Configuration

### Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

**Example:**
```
postgresql://postgres:password@localhost:5432/real_estate_crm?schema=real_estate_crm
```

### Schema Management

- **Prisma Migrate**: Database migrations
- **Prisma Studio**: Database GUI
- **Schema Location**: `data/schema/prisma/schema.prisma`

### Key Tables

- `users` - User accounts
- `organizations` - Corporate companies
- `agent_profiles` - Agent profiles
- `properties` - Property listings
- `listings` - Active listings
- `leads` - Lead records
- `buyer_requests` - Buyer pool requests
- `claims` - Lead/buyer claims
- `landing_sections` - CMS sections
- `landing_cards` - CMS cards
- `agent_memory` - Agent memory/knowledge base

## API Configuration

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: Configured via `PUBLIC_BASE_URL`

### API Routes

- `/api/auth/*` - Authentication
- `/api/listings/*` - Property listings
- `/api/leads/*` - Lead management
- `/api/buyer-pool/*` - Buyer pool
- `/api/cms-landing/*` - CMS operations
- `/api/rbac-admin/*` - Admin operations
- `/api/landing` - Public landing page data
- `/api/knowledge-base/*` - Agent memory system

### Authentication

- **JWT Tokens**: For API authentication
- **Express Sessions**: For stateful operations
- **Middleware**: `authMiddleware`, `rbacMiddleware`

## Environment Variables

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token signing secret
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

### Optional Variables

- `PUBLIC_BASE_URL` - Public base URL for links
- `REDIS_URL` - Redis connection (if using)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `SMTP_*` - Email configuration

## Performance Considerations

### Frontend

- Code splitting by route
- Lazy loading of heavy components
- React Query caching
- Image optimization
- Bundle size optimization

### Backend

- Database query optimization
- Connection pooling
- Response caching headers
- Rate limiting
- Efficient middleware chain

### Database

- Strategic indexes
- Query optimization
- Connection pooling
- RLS policy efficiency
