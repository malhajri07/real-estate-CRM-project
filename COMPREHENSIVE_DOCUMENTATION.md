# 🏢 Real Estate CRM - Comprehensive Documentation

This document consolidates all documentation for the Real Estate CRM application, providing a complete reference for development, deployment, and maintenance.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema](#database-schema)
4. [Platform Structure & RBAC](#platform-structure--rbac)
5. [Development Setup](#development-setup)
6. [Deployment Guides](#deployment-guides)
7. [Styling & UI Guidelines](#styling--ui-guidelines)
8. [API Documentation](#api-documentation)
9. [Troubleshooting](#troubleshooting)
10. [Security & Best Practices](#security--best-practices)

---

## 🎯 Project Overview

### Core Features
- **Multi-tenant Real Estate CRM** with role-based access control
- **Property Management** with listing, search, and comparison tools
- **Lead Management** with automated workflows and contact tracking
- **Analytics Platform** with comprehensive reporting and KPIs
- **Content Management System** for landing pages and marketing content
- **Google Maps Integration** for property visualization
- **Multi-language Support** (Arabic/English) with RTL layout

### Account Hierarchy
- **Customer Accounts**: Basic access to property search and inquiries
- **Individual Broker Accounts**: 30 active listings, 100 customers limit
- **Corporate Company Accounts**: 100 listings, 500 customers per employee
- **Website Administrator**: Full system access and management

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **React Query** for server state management
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT Authentication** with bcrypt password hashing
- **Session Management** with PostgreSQL store

### Database
- **PostgreSQL** with Prisma schema
- **Row Level Security (RLS)** for multi-tenancy
- **Audit Logging** for compliance
- **Analytics Tables** for reporting

### Infrastructure
- **Docker** for containerization
- **Google Cloud Platform** for production deployment
- **Cloud Run** for application hosting
- **Cloud SQL** for managed PostgreSQL
- **Cloud Storage** for file uploads

---

## 🗄️ Database Schema

### Core Entities

#### Users & Authentication
- **users**: User accounts with roles and preferences
- **organizations**: Corporate entities with verification status
- **agent_profiles**: Real estate agent licensing and specialties
- **audit_logs**: Security and compliance tracking

#### Property Management
- **properties**: Property details with location and specifications
- **listings**: Published property listings with status tracking
- **property_media**: Images and documents for properties
- **inquiries**: Property inquiry and contact information

#### Customer Management
- **customers**: Customer profiles with contact information
- **leads**: Sales leads with status and priority tracking
- **contact_logs**: Communication history and notes
- **appointments**: Scheduled meetings and viewings

#### Business Operations
- **deals**: Sales pipeline with stages and values
- **buyer_requests**: Customer property requirements
- **seller_submissions**: Property listing submissions
- **support_tickets**: Customer service requests

#### Analytics & Reporting
- **analytics_event_logs**: User behavior tracking
- **revenue_stats**: Financial performance metrics
- **audit_logs**: System activity monitoring

### Key Relationships
- Users belong to Organizations (optional)
- Properties have multiple Listings
- Customers generate Leads and Inquiries
- Deals connect Customers, Properties, and Users
- All entities support audit logging

---

## 🔐 Platform Structure & RBAC

### Role-Based Access Control

#### Core Roles
1. **WEBSITE_ADMIN**: Full system access, user management, analytics
2. **CORP_OWNER**: Corporate management, team oversight, reporting
3. **CORP_AGENT**: Corporate agent with team collaboration
4. **INDIV_AGENT**: Independent agent with personal workspace
5. **SELLER**: Property listing and agent contact
6. **BUYER**: Property search and inquiry submission

#### Permission Matrix

| Feature | Admin | Corp Owner | Corp Agent | Indiv Agent | Seller | Buyer |
|---------|-------|------------|------------|-------------|--------|-------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Organization Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Property Management | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Lead Management | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Analytics & Reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Content Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Property Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favorites & Saved Searches | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Navigation Structure

#### Admin Console (`/admin`)
- Overview dashboards and statistics
- User and role management
- Organization administration
- Revenue and billing management
- System settings and security

#### Platform Shell (`/home/platform`)
- Customer workbench (customers, properties, leads, pipeline)
- Corporate management (agencies, customer requests)
- Cross-role utilities (favorites, compare, saved searches)
- Property detail and listing management

#### Public Experience
- Landing page with marketing content
- Property search and discovery
- Signup and authentication flows
- Marketing request submission

---

## 🚀 Development Setup

### Prerequisites
- **Node.js 18+** with npm
- **PostgreSQL 15+** database
- **Docker** (optional, for containerized development)
- **Git** for version control

### Environment Configuration

#### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/real_estate_crm?schema=public"

# Security
JWT_SECRET="your-super-secure-jwt-secret-key"
SESSION_SECRET="your-super-secure-session-secret-key"

# Application
NODE_ENV="development"
PORT=3000

# Google Maps (for property search)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
VITE_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### Quick Start Commands

#### 1. Clean Port Management
```bash
# Kill all development processes
./clean-ports.sh

# Start fresh development server
./start-dev.sh
```

#### 2. Manual Setup
```bash
# Install dependencies
npm install

# Set up database
npm run db:setup

# Start development server
npm run dev
```

#### 3. Docker Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start production environment
docker-compose up --build
```

### Database Setup

#### Local Development
```bash
# Create database
createdb real_estate_crm

# Run migrations
npx prisma migrate dev

# Seed initial data
npm run db:seed
```

#### Docker Database
```bash
# Start PostgreSQL container
docker-compose up postgres

# Run migrations
docker-compose exec app npx prisma migrate dev
```

---

## 🚀 Deployment Guides

### Google Cloud Platform Deployment

#### Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed for image building

#### Quick Deployment
```bash
# Set up Cloud SQL database
./setup-cloud-sql.sh

# Deploy to Cloud Run
./deploy-gcp.sh

# Full deployment with all services
./deploy-full-gcp.sh
```

#### Manual Deployment Steps

1. **Enable Required APIs**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
```

2. **Create Cloud SQL Instance**
```bash
gcloud sql instances create real-estate-crm-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB
```

3. **Deploy Application**
```bash
# Build and push image
docker build -f Dockerfile.gcp -t gcr.io/PROJECT_ID/real-estate-crm .
docker push gcr.io/PROJECT_ID/real-estate-crm

# Deploy to Cloud Run
gcloud run deploy real-estate-crm \
    --image gcr.io/PROJECT_ID/real-estate-crm \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10 \
    --min-instances 1
```

### Docker Deployment

#### Development Environment
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Services available:
# - App: http://localhost:3000
# - PostgreSQL: localhost:5433
# - Redis: localhost:6380
```

#### Production Environment
```bash
# Build and start production stack
docker-compose up --build

# Services available:
# - App: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Nginx: http://localhost:80
```

### Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/real_estate_crm_dev"
DEBUG=true
LOG_LEVEL=INFO
```

#### Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@/real_estate_crm?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"
DEBUG=false
LOG_LEVEL=WARNING
```

---

## 🎨 Styling & UI Guidelines

### Design System

#### Tailwind CSS Configuration
- **Color Palette**: Custom brand colors with semantic naming
- **Typography**: Arabic and English font families
- **Spacing**: Consistent scale with logical properties
- **Components**: Reusable UI components with variants

#### Key Design Tokens
```typescript
// Colors
primary: "hsl(164 72% 40%)"      // Brand green
secondary: "hsl(222 62% 45%)"    // Professional blue
sidebar: "hsl(210 28% 98%)"      // Light sidebar
background: "hsl(215 45% 97%)"   // Main background

// Typography
fontFamily: {
  sans: ["Inter", "Noto Kufi Arabic", "system-ui"],
  arabic: ["Noto Kufi Arabic", "Inter"],
  display: ["Plus Jakarta Sans", "Noto Kufi Arabic"]
}
```

### Component Guidelines

#### Layout Components
- **PlatformShell**: Main authenticated layout with sidebar
- **Header**: Navigation and search functionality
- **Sidebar**: Role-based navigation with collapsible groups
- **PageContainer**: Consistent content spacing

#### Interactive Components
- **Buttons**: Consistent sizing and hover states
- **Forms**: Accessible inputs with validation
- **Modals**: Overlay components with backdrop blur
- **Cards**: Content containers with elevation

### RTL Support
- **Direction-Aware Layouts**: Automatic RTL/LTR switching
- **Typography**: Arabic font rendering optimization
- **Navigation**: Right-aligned sidebar for Arabic users
- **Form Elements**: RTL-friendly input layouts

### Responsive Design
- **Mobile-First**: Progressive enhancement approach
- **Breakpoints**: Tailwind's default responsive system
- **Touch-Friendly**: Adequate touch targets (44px minimum)
- **Performance**: Optimized images and lazy loading

---

## 🔧 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "username_or_email",
  "password": "user_password"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### Property Management

#### Get Properties
```http
GET /api/properties
Authorization: Bearer <jwt_token>
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- status: string (optional)
- city: string (optional)
```

#### Create Property
```http
POST /api/properties
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Property Title",
  "description": "Property Description",
  "price": 500000,
  "city": "Riyadh",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "propertyType": "APARTMENT",
  "bedrooms": 3,
  "bathrooms": 2
}
```

### Lead Management

#### Get Leads
```http
GET /api/leads
Authorization: Bearer <jwt_token>
Query Parameters:
- status: string (optional)
- priority: number (optional)
- assignedTo: string (optional)
```

#### Create Lead
```http
POST /api/leads
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "customerId": "customer_uuid",
  "propertyId": "property_uuid",
  "status": "NEW",
  "priority": 1,
  "notes": "Lead notes"
}
```

### Analytics Endpoints

#### Dashboard Metrics
```http
GET /api/dashboard/metrics
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "totalLeads": 150,
  "activeProperties": 45,
  "dealsInPipeline": 12,
  "monthlyRevenue": 250000,
  "pipelineByStage": {
    "lead": 25,
    "qualified": 15,
    "showing": 8,
    "negotiation": 5,
    "closed": 3
  }
}
```

---

## 🛠️ Troubleshooting

### Common Development Issues

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :5432

# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Test database connection
psql -h localhost -p 5432 -U postgres -d real_estate_crm
```

#### Prisma Issues
```bash
# Reset database
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push
```

### Production Issues

#### Cloud Run Deployment
```bash
# Check service status
gcloud run services describe real-estate-crm --region us-central1

# View logs
gcloud run logs tail real-estate-crm --region us-central1

# Check for errors
gcloud run logs tail real-estate-crm --region us-central1 --filter="severity>=ERROR"
```

#### Database Issues
```bash
# Check Cloud SQL status
gcloud sql instances describe real-estate-crm-db

# Test connection
gcloud sql connect real-estate-crm-db --user=postgres --database=real_estate_crm
```

#### Egress Proxy Issues
```bash
# Fix proxy configuration
./fix-egress-proxy.sh

# Check environment variables
gcloud run services describe real-estate-crm --region us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"
```

### Performance Issues

#### Frontend Performance
- **Bundle Analysis**: Use `npm run build:analyze` to check bundle size
- **Image Optimization**: Compress images and use WebP format
- **Code Splitting**: Implement lazy loading for routes
- **Caching**: Configure proper cache headers

#### Backend Performance
- **Database Queries**: Use Prisma query optimization
- **Caching**: Implement Redis for frequently accessed data
- **Connection Pooling**: Configure PostgreSQL connection limits
- **Monitoring**: Set up performance monitoring and alerts

---

## 🔒 Security & Best Practices

### Authentication & Authorization

#### JWT Security
- **Secret Management**: Use strong, unique JWT secrets
- **Token Expiration**: Implement reasonable token lifetimes
- **Refresh Tokens**: Use refresh token rotation
- **Secure Storage**: Store tokens securely on client

#### Password Security
- **Hashing**: Use bcrypt with appropriate salt rounds
- **Password Policy**: Enforce strong password requirements
- **Rate Limiting**: Implement login attempt limits
- **Account Lockout**: Lock accounts after failed attempts

### Data Protection

#### Database Security
- **Row Level Security**: Implement RLS for multi-tenancy
- **Encryption**: Encrypt sensitive data at rest
- **Backup Security**: Secure database backups
- **Access Control**: Limit database access to necessary services

#### API Security
- **Input Validation**: Validate all input data
- **SQL Injection**: Use parameterized queries
- **CORS Configuration**: Restrict cross-origin requests
- **Rate Limiting**: Implement API rate limits

### Infrastructure Security

#### Cloud Security
- **IAM Roles**: Use least privilege access
- **Network Security**: Configure VPC and firewall rules
- **Secret Management**: Use Google Secret Manager
- **Monitoring**: Set up security monitoring and alerts

#### Container Security
- **Image Scanning**: Scan Docker images for vulnerabilities
- **Base Images**: Use minimal, secure base images
- **Runtime Security**: Implement container runtime security
- **Updates**: Keep base images and dependencies updated

### Compliance & Auditing

#### Audit Logging
- **User Actions**: Log all user activities
- **Data Changes**: Track data modifications
- **Access Logs**: Monitor system access
- **Security Events**: Log security-related events

#### Data Privacy
- **GDPR Compliance**: Implement data protection measures
- **Data Retention**: Define data retention policies
- **User Consent**: Implement consent management
- **Data Portability**: Enable data export functionality

---

## 📞 Support & Resources

### Documentation
- **API Documentation**: Available at `/api/docs` (when implemented)
- **Database Schema**: See `DATABASE_SCHEMA_SUMMARY.md`
- **Platform Reference**: See `PLATFORM_DOMAIN_REFERENCE.md`
- **Styling Guide**: See `STYLING_GUIDELINES.md`

### Development Tools
- **Prisma Studio**: Database management interface
- **Postman Collection**: API testing collection
- **Docker Compose**: Local development environment
- **Cloud Build**: CI/CD pipeline configuration

### Monitoring & Analytics
- **Application Logs**: Cloud Run logs and monitoring
- **Database Metrics**: Cloud SQL performance monitoring
- **User Analytics**: Custom analytics implementation
- **Error Tracking**: Integrated error monitoring

### Community & Support
- **GitHub Repository**: Source code and issue tracking
- **Documentation**: Comprehensive guides and references
- **Development Team**: Internal support and collaboration
- **External Resources**: Google Cloud documentation and community

---

*This documentation is maintained as part of the Real Estate CRM project. For updates and contributions, please refer to the project repository.*
