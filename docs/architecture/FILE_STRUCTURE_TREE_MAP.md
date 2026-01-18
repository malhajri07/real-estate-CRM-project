# Real Estate CRM - File Structure Tree Map

**Last Updated**: January 2025  
**Application**: Real Estate CRM Platform  
**Structure**: Monorepo with API backend and Web frontend

---

## Table of Contents

- [Overview](#overview)
- [Root Level Structure](#root-level-structure)
- [Backend API Structure](#backend-api-structure-appsapi)
- [Frontend Web Application Structure](#frontend-web-application-structure-appsweb)
- [Data Directory Structure](#data-directory-structure-data)
- [Documentation Structure](#documentation-structure-docs)
- [Scripts Directory](#scripts-directory-scripts)
- [Terraform Infrastructure](#terraform-infrastructure-terraform)
- [Packages Directory](#packages-directory-packages)
- [Public Directory](#public-directory-public)
- [File Statistics](#file-statistics)
- [Key Directories Explanation](#key-directories-explanation)
- [Notes](#notes)
- [Maintenance](#maintenance)

---

## Overview

This document provides a comprehensive visualization of the application's file and directory structure. It complements the [SITE_TREE_MAP.md](./SITE_TREE_MAP.md) which focuses on routes and navigation.

**Excluded Directories**: `node_modules/`, `dist/`, `.git/`, build artifacts

**Quick Links**:
- [Backend API Structure](#backend-api-structure-appsapi) - Server-side code organization
- [Frontend Web Structure](#frontend-web-application-structure-appsweb) - Client-side code organization
- [File Statistics](#file-statistics) - Summary counts and metrics

### Key Entry Points

**Backend**:
- `apps/api/index.ts` - Development server entry point
- `apps/api/index.prod.ts` - Production server entry point
- `apps/api/routes.ts` - Main route registration

**Frontend**:
- `apps/web/index.html` - HTML entry point
- `apps/web/src/main.tsx` - React application entry point
- `apps/web/src/App.tsx` - Root React component with routing

**Database**:
- `data/schema/prisma/schema.prisma` - Prisma schema definition
- `apps/api/prismaClient.ts` - Prisma client singleton

---

## Root Level Structure

```
real-estate-CRM-project/
├── apps/                          # Main application code
│   ├── api/                       # Backend Express.js API
│   └── web/                       # Frontend React SPA
├── data/                          # Data files, schemas, and pipelines
├── docs/                          # Documentation
├── packages/                      # Shared packages
├── scripts/                       # Utility scripts
├── terraform/                     # Infrastructure as Code
├── public/                        # Public static assets
├── dist/                          # Build output (excluded from tree)
├── node_modules/                  # Dependencies (excluded from tree)
│
├── Configuration Files
│   ├── package.json               # Project dependencies and scripts
│   ├── package-lock.json          # Dependency lock file
│   ├── tsconfig.json              # TypeScript configuration
│   ├── vite.config.ts             # Vite build configuration
│   ├── tailwind.config.ts         # Tailwind CSS configuration
│   ├── postcss.config.js          # PostCSS configuration
│   ├── eslint.config.js           # ESLint configuration
│   ├── components.json            # shadcn/ui components config
│   ├── playwright.config.ts       # Playwright test configuration
│   ├── ecosystem.config.js        # PM2 ecosystem configuration
│   └── env.example                # Environment variables template
│
├── Docker & Deployment
│   ├── Dockerfile                 # Production Docker image
│   ├── Dockerfile.dev             # Development Docker image
│   ├── Dockerfile.gcp             # Google Cloud Platform Docker image
│   ├── docker-compose.yml         # Docker Compose configuration
│   ├── docker-compose.dev.yml     # Development Docker Compose
│   ├── docker-setup.sh            # Docker setup script
│   ├── cloudbuild.yaml            # Google Cloud Build configuration
│   ├── deploy-gcp.sh              # GCP deployment script
│   ├── deploy-full-gcp.sh         # Full GCP deployment script
│   ├── fix-cloud-run-port.sh      # Cloud Run port fix script
│   ├── fix-egress-proxy.sh        # Egress proxy fix script
│   └── fix-vite-dependency.sh     # Vite dependency fix script
│
├── Database & Data Scripts
│   ├── check-database.js          # Database connection check
│   ├── test-database-push.js      # Database push test
│   ├── fix-duplicate-cases.js     # Duplicate data fix script
│   ├── fix-duplicates.cjs         # Duplicate fix (CommonJS)
│   └── simple-test.js             # Simple test script
│
├── Other Files
│   ├── admin_cookies.txt          # Admin session cookies
│   ├── admin_surface.json         # Admin surface configuration
│   ├── cookies.txt                # Session cookies
│   ├── feature-roadmap.csv        # Feature roadmap data
│   ├── postgresql-42.6.0.jar      # PostgreSQL JDBC driver
│   ├── start-dev.sh               # Development server startup
│   ├── start-servers.sh           # Multi-server startup
│   └── setup-cloud-sql.sh         # Cloud SQL setup script
```

---

## Backend API Structure (`apps/api/`)

```
apps/api/
├── Core Application Files
│   ├── index.ts                   # Main API entry point (dev)
│   ├── index.prod.ts              # Production entry point
│   ├── routes.ts                  # Main route definitions
│   ├── serve-static.ts            # Static file serving
│   ├── vite.ts                    # Vite integration
│   └── logger.ts                  # Application logger (Pino)
│
├── Authentication & Authorization
│   ├── auth.ts                    # Authentication utilities
│   ├── authMiddleware.ts          # Auth middleware
│   ├── authMock.ts                # Mock authentication (dev)
│   ├── rbac.ts                    # Role-Based Access Control
│   ├── rbac-policy.ts             # RBAC policy definitions
│   ├── rbac-admin-clean.ts        # RBAC admin cleanup
│   └── roleRoutes.ts              # Role management routes
│
├── Configuration
│   └── config/
│       └── env.ts                 # Environment configuration
│
├── Database & Prisma
│   ├── prismaClient.ts            # Prisma client singleton
│   ├── storage-prisma.ts          # Prisma storage adapter
│   └── storage-prisma-simple.ts   # Simplified Prisma storage
│
├── Routes/                        # API route handlers (26 files)
│   ├── __tests__/
│   │   └── marketing-requests.test.ts
│   │
│   ├── auth.ts                    # Authentication routes
│   ├── agencies.ts                # Agency management routes
│   ├── buyer-pool.ts              # Buyer pool routes
│   ├── cms-articles.ts            # CMS article routes
│   ├── cms-landing.ts             # CMS landing page routes
│   ├── cms-media.ts               # CMS media routes
│   ├── cms-navigation.ts         # CMS navigation routes
│   ├── cms-seo.ts                 # CMS SEO routes
│   ├── cms-templates.ts           # CMS template routes
│   ├── favorites.ts               # Favorites routes
│   ├── inquiries.ts               # Inquiry routes
│   ├── listings.ts                # Property listing routes
│   ├── locations.ts               # Location routes
│   ├── marketing-requests.ts      # Marketing request routes
│   ├── moderation.ts              # Content moderation routes
│   ├── populate.ts                # Data population routes
│   ├── property-categories.ts     # Property category routes
│   ├── property-types.ts          # Property type routes
│   ├── rbac-admin.ts              # RBAC admin routes
│   ├── reports.ts                 # Reporting routes
│   ├── requests.ts                # General request routes
│   ├── search.ts                  # Search routes
│   ├── simple-auth.ts             # Simple auth routes
│   ├── sitemap.ts                 # Sitemap generation routes
│   └── unverified-listings.ts     # Unverified listing routes
│
├── Services/                      # Business logic services (7 files)
│   ├── articleService.ts          # Article service
│   ├── contentSyncService.ts      # Content synchronization
│   ├── landingService.ts          # Landing page service
│   ├── mediaService.ts            # Media management service
│   ├── navigationService.ts       # Navigation service
│   ├── seoService.ts              # SEO service
│   └── templateService.ts         # Template service
│
├── Middleware/
│   └── errorHandler.ts            # Global error handler
│
├── Errors/
│   └── AppError.ts                # Custom error class
│
├── Utils/
│   └── mailer.ts                  # Email utility
│
├── Types/
│   └── express-session.ts         # Express session types
│
├── Database Seeds & Population
│   ├── seed-cms.ts                # CMS seed data
│   ├── seed-rbac.ts               # RBAC seed data
│   ├── seed-saudi-regions.ts      # Saudi regions seed
│   ├── seedData.ts                # General seed data
│   ├── populateDatabase.ts        # Database population
│   ├── populateAdmin1Data.ts      # Admin data population
│   ├── createAdmin1AndPopulate.ts # Admin creation & population
│   ├── ensure-primary-admin.ts    # Ensure admin exists
│   ├── import-saudi-customers.ts  # Import Saudi customers
│   └── import-users-from-csv.ts   # Import users from CSV
│
├── Lib/
│   └── seeds/                     # Seed utilities (7 files)
│       ├── index.ts               # Seed index
│       ├── types.ts               # Seed types
│       ├── core.ts                # Core seed data
│       ├── domain.ts              # Domain seed data
│       ├── cms.ts                 # CMS seed data
│       ├── analytics.ts           # Analytics seed data
│       └── revenue.ts             # Revenue seed data
│
├── Scripts/
│   └── add-sample-images.ts       # Add sample images script
│
├── Source/                        # Additional source files
│   ├── middleware/
│   │   └── auth.ts                # Auth middleware (alternative)
│   └── routes/
│       ├── __tests__/
│       │   ├── analytics.test.ts
│       │   └── analytics-auth.test.ts
│       └── analytics.ts           # Analytics routes
│
├── Data/                          # Data directory (empty or minimal)
│
├── Utilities & Testing
│   ├── simple-analytics.ts        # Simple analytics utility
│   ├── spatial-queries.ts         # Spatial database queries
│   ├── test-admin.ts              # Admin testing utility
│   ├── test-dashboard.ts          # Dashboard testing utility
│   └── test-db.ts                 # Database testing utility
```

---

## Frontend Web Application Structure (`apps/web/`)

```
apps/web/
├── Root Files
│   ├── index.html                 # HTML entry point
│   └── logo.png                   # Application logo
│
├── src/                           # Source code (209 files)
│   ├── Entry Points
│   │   ├── main.tsx               # React application entry
│   │   ├── App.tsx                # Root App component
│   │   └── index.css              # Global styles
│   │
│   ├── Pages/                     # Page components (50+ files)
│   │   ├── Public Pages
│   │   │   ├── landing.tsx        # Landing page
│   │   │   ├── blog.tsx           # Blog listing page
│   │   │   ├── map.tsx.old        # Old map page (legacy)
│   │   │   ├── signup-selection.tsx      # Signup type selection
│   │   │   ├── signup-individual.tsx     # Individual signup
│   │   │   ├── signup-corporate.tsx       # Corporate signup
│   │   │   ├── signup-success.tsx         # Signup success
│   │   │   ├── kyc-submitted.tsx          # KYC submission confirmation
│   │   │   ├── rbac-login.tsx             # Login page
│   │   │   ├── real-estate-requests.tsx   # Real estate request form
│   │   │   ├── marketing-request.tsx      # Marketing request form
│   │   │   └── unverified-listing.tsx     # Public unverified listing view
│   │   │
│   │   ├── Platform Pages
│   │   │   ├── app.tsx                    # Platform app wrapper
│   │   │   ├── dashboard.tsx              # Platform dashboard
│   │   │   ├── customers.tsx              # Customer management
│   │   │   ├── properties.tsx             # Property management
│   │   │   ├── property-detail.tsx        # Property detail view
│   │   │   ├── leads.tsx                  # Lead management
│   │   │   ├── pipeline.tsx               # Sales pipeline
│   │   │   ├── clients.tsx                # Client management
│   │   │   ├── reports.tsx                # Reports and analytics
│   │   │   ├── notifications.tsx           # Notifications
│   │   │   ├── settings.tsx                # Workspace settings
│   │   │   ├── agencies.tsx                # Agency listing
│   │   │   ├── agency.tsx                  # Agency detail
│   │   │   ├── agent.tsx                   # Agent profile
│   │   │   ├── customer-requests.tsx       # Customer requests
│   │   │   ├── moderation.tsx              # Content moderation
│   │   │   ├── cms-admin.tsx               # CMS admin interface
│   │   │   ├── cms-landing.tsx             # CMS landing page editor
│   │   │   ├── unverified-listings-management.tsx  # Unverified listings mgmt
│   │   │   ├── admin-requests.tsx          # Admin requests
│   │   │   ├── favorites.tsx               # User favorites
│   │   │   ├── compare.tsx                 # Property comparison
│   │   │   ├── post-listing.tsx            # Post new listing
│   │   │   ├── saved-searches.tsx          # Saved searches
│   │   │   ├── marketing-requests.tsx      # Marketing requests board
│   │   │   └── listing.tsx                 # Public listing view
│   │   │
│   │   ├── Admin Pages
│   │   │   ├── rbac-dashboard.tsx          # RBAC dashboard
│   │   │   ├── admin/
│   │   │   │   ├── user-management.tsx      # User management
│   │   │   │   ├── role-management.tsx     # Role management
│   │   │   │   ├── organization-management.tsx  # Organization management
│   │   │   │   ├── enhanced-dashboard.tsx      # Enhanced admin dashboard
│   │   │   │   ├── articles-management.tsx     # Article management
│   │   │   │   ├── media-library.tsx           # Media library
│   │   │   │   ├── navigation-management.tsx   # Navigation management
│   │   │   │   ├── seo-management.tsx          # SEO management
│   │   │   │   ├── templates-management.tsx    # Template management
│   │   │   │   └── cms-landing/                 # CMS Landing Page Editor
│   │   │   │       ├── index.tsx                # Main CMS landing editor
│   │   │   │       ├── types.ts                 # CMS landing types
│   │   │   │       ├── components/
│   │   │   │       │   ├── index.ts
│   │   │   │       │   ├── CardEditor.tsx      # Card editor component
│   │   │   │       │   └── SectionEditor.tsx    # Section editor component
│   │   │   │       ├── hooks/
│   │   │   │       │   ├── index.ts
│   │   │   │       │   └── useCMSLandingSections.ts  # CMS sections hook
│   │   │   │       └── utils/
│   │   │   │           ├── index.ts
│   │   │   │           ├── constants.ts         # CMS constants
│   │   │   │           ├── defaults.ts         # Default values
│   │   │   │           ├── builders.ts          # Builder utilities
│   │   │   │           └── normalizers.ts       # Data normalizers
│   │   │
│   │   └── Feature Pages
│   │       ├── map/                           # Map feature
│   │       │   ├── index.tsx                  # Map page main component
│   │       │   ├── types.ts                   # Map types
│   │       │   ├── components/
│   │       │   │   ├── index.ts
│   │       │   │   ├── PropertiesMap.tsx      # Map component
│   │       │   │   ├── PropertiesList.tsx     # Properties list
│   │       │   │   ├── FilterContent.tsx      # Filter component
│   │       │   │   ├── SearchableCombobox.tsx  # Search combobox
│   │       │   │   └── ErrorBoundary.tsx       # Error boundary
│   │       │   ├── hooks/
│   │       │   │   ├── index.ts
│   │       │   │   ├── useMapView.ts           # Map view hook
│   │       │   │   ├── useMapProperties.ts     # Properties hook
│   │       │   │   ├── useMapLocations.ts      # Locations hook
│   │       │   │   └── useMapFilters.ts        # Filters hook
│   │       │   └── utils/
│   │       │       ├── index.ts
│   │       │       ├── constants.ts            # Map constants
│   │       │       ├── formatters.ts            # Formatting utilities
│   │       │       └── map-helpers.ts          # Map helper functions
│   │       │
│   │       └── unverified-listing/             # Unverified listing feature
│   │           ├── types.ts                    # Listing types
│   │           ├── components/                 # (empty directory)
│   │           ├── hooks/
│   │           │   ├── index.ts
│   │           │   └── useListingData.ts       # Listing data hook
│   │           └── utils/
│   │               ├── index.ts
│   │               ├── constants.ts            # Constants
│   │               ├── form-helpers.ts         # Form helpers
│   │               ├── image-handler.ts        # Image handling
│   │               └── validation.ts           # Validation utilities
│   │
│   ├── Components/                 # Reusable components (100+ files)
│   │   ├── Admin Components
│   │   │   ├── index.ts                       # Admin components export
│   │   │   ├── AdminDialog.tsx                # Admin dialog
│   │   │   ├── AdminSettings.tsx              # Admin settings
│   │   │   ├── AdminStatusBadge.tsx           # Status badge
│   │   │   ├── AnalyticsDashboard.tsx        # Analytics dashboard
│   │   │   ├── UserManagement.tsx             # User management component
│   │   │   ├── data-display/                  # Data display components
│   │   │   │   ├── AdminCard.tsx              # Admin card
│   │   │   │   ├── AdminChart.tsx             # Admin chart
│   │   │   │   ├── AdminEmptyState.tsx        # Empty state
│   │   │   │   └── AdminTable.tsx             # Admin table
│   │   │   ├── forms/                         # Form components
│   │   │   │   ├── AdminDatePicker.tsx        # Date picker
│   │   │   │   └── AdminFormField.tsx         # Form field
│   │   │   ├── feedback/                      # Feedback components
│   │   │   │   └── AdminLoading.tsx           # Loading component
│   │   │   ├── layout/                        # Layout components
│   │   │   │   └── AdminBreadcrumbs.tsx       # Breadcrumbs
│   │   │   └── utilities/                     # Utility components
│   │   │       ├── AdminBulkActions.tsx       # Bulk actions
│   │   │       ├── AdminExport.tsx            # Export utility
│   │   │       └── AdminSearch.tsx            # Search utility
│   │   │
│   │   ├── Auth Components
│   │   │   ├── AuthProvider.tsx               # Auth context provider
│   │   │   └── LoginForm.tsx                  # Login form
│   │   │
│   │   ├── CMS Components
│   │   │   ├── LandingStudio.tsx              # Landing page studio
│   │   │   ├── LandingStudioDebug.tsx        # Landing studio debug
│   │   │   ├── MediaSelector.tsx              # Media selector
│   │   │   └── RichTextEditor.tsx             # Rich text editor
│   │   │
│   │   ├── Layout Components
│   │   │   ├── header.tsx                     # Header component
│   │   │   ├── sidebar.tsx                    # Sidebar component
│   │   │   ├── PlatformShell.tsx              # Platform shell layout
│   │   │   ├── PublicHeader.tsx               # Public header
│   │   │   ├── PublicLayout.tsx               # Public layout
│   │   │   └── unified-page-layout.tsx       # Unified page layout
│   │   │
│   │   ├── Feature Components
│   │   │   ├── buyer-pool/
│   │   │   │   └── BuyerPoolSearch.tsx        # Buyer pool search
│   │   │   ├── dashboard/
│   │   │   │   └── RoleBasedDashboard.tsx     # Role-based dashboard
│   │   │   ├── listings/
│   │   │   │   └── ListingCard.tsx            # Listing card
│   │   │   ├── maps/
│   │   │   │   └── PropertyMap.tsx           # Property map
│   │   │   ├── modals/
│   │   │   │   ├── add-lead-drawer.tsx        # Add lead drawer
│   │   │   │   ├── add-lead-modal.tsx        # Add lead modal
│   │   │   │   ├── add-property-drawer.tsx    # Add property drawer
│   │   │   │   ├── add-property-modal.tsx     # Add property modal
│   │   │   │   └── send-whatsapp-modal.tsx    # WhatsApp modal
│   │   │   └── rbac/
│   │   │       ├── AdminHeader.tsx            # Admin header
│   │   │       ├── AdminSidebar.tsx           # Admin sidebar
│   │   │       └── dashboard/
│   │   │           └── Charts.tsx             # Dashboard charts
│   │   │
│   │   ├── UI Components (shadcn/ui)          # 50+ UI components
│   │   │   ├── accordion.tsx                  # Accordion
│   │   │   ├── action-bar.tsx                 # Action bar
│   │   │   ├── alert-dialog.tsx               # Alert dialog
│   │   │   ├── alert.tsx                      # Alert
│   │   │   ├── aspect-ratio.tsx               # Aspect ratio
│   │   │   ├── avatar.tsx                     # Avatar
│   │   │   ├── badge.tsx                      # Badge
│   │   │   ├── breadcrumb.tsx                 # Breadcrumb
│   │   │   ├── button.tsx                     # Button
│   │   │   ├── calendar.tsx                   # Calendar
│   │   │   ├── card.tsx                       # Card
│   │   │   ├── carousel.tsx                   # Carousel
│   │   │   ├── chart.tsx                      # Chart
│   │   │   ├── checkbox.tsx                   # Checkbox
│   │   │   ├── collapsible.tsx                # Collapsible
│   │   │   ├── command.tsx                    # Command palette
│   │   │   ├── context-menu.tsx               # Context menu
│   │   │   ├── dialog.tsx                     # Dialog
│   │   │   ├── drawer.tsx                     # Drawer
│   │   │   ├── dropdown-menu.tsx              # Dropdown menu
│   │   │   ├── empty-state.tsx                # Empty state
│   │   │   ├── filter-bar.tsx                 # Filter bar
│   │   │   ├── form.tsx                       # Form
│   │   │   ├── hover-card.tsx                 # Hover card
│   │   │   ├── input-otp.tsx                  # Input OTP
│   │   │   ├── input.tsx                      # Input
│   │   │   ├── label.tsx                      # Label
│   │   │   ├── loading-state.tsx              # Loading state
│   │   │   ├── menubar.tsx                    # Menubar
│   │   │   ├── metrics-card.tsx               # Metrics card
│   │   │   ├── navigation-menu.tsx            # Navigation menu
│   │   │   ├── page-header.tsx                # Page header
│   │   │   ├── pagination.tsx                 # Pagination
│   │   │   ├── photo-carousel.tsx             # Photo carousel
│   │   │   ├── popover.tsx                    # Popover
│   │   │   ├── progress.tsx                   # Progress bar
│   │   │   ├── radio-group.tsx                # Radio group
│   │   │   ├── resizable.tsx                  # Resizable panels
│   │   │   ├── scroll-area.tsx                # Scroll area
│   │   │   ├── select.tsx                     # Select
│   │   │   ├── separator.tsx                  # Separator
│   │   │   ├── sheet.tsx                      # Sheet
│   │   │   ├── sidebar.tsx                    # Sidebar
│   │   │   ├── skeleton.tsx                   # Skeleton loader
│   │   │   ├── slider.tsx                     # Slider
│   │   │   ├── switch.tsx                     # Switch
│   │   │   ├── table.tsx                      # Table
│   │   │   ├── tabs.tsx                       # Tabs
│   │   │   ├── textarea.tsx                   # Textarea
│   │   │   ├── toast.tsx                      # Toast notification
│   │   │   ├── toaster.tsx                    # Toast container
│   │   │   ├── toggle-group.tsx               # Toggle group
│   │   │   ├── toggle.tsx                     # Toggle
│   │   │   └── tooltip.tsx                     # Tooltip
│   │   │
│   │   └── Utility Components
│   │       └── CSVUploader.tsx                # CSV uploader
│   │
│   ├── Config/                     # Configuration files
│   │   ├── admin-sidebar.ts                   # Admin sidebar config
│   │   ├── admin-sidebar/                     # Admin sidebar module
│   │   │   ├── index.ts                      # Admin sidebar exports
│   │   │   ├── types.ts                      # Admin sidebar types
│   │   │   ├── sections/                     # Sidebar sections (empty)
│   │   │   └── types/                        # Types directory (empty)
│   │   ├── platform-sidebar.ts                # Platform sidebar config
│   │   ├── platform-page-structure.ts         # Platform page structure
│   │   ├── platform-theme.ts                 # Platform theme config
│   │   └── theme.ts                           # Theme configuration
│   │
│   ├── Contexts/                   # React contexts
│   │   └── LanguageContext.tsx                # Language/i18n context
│   │
│   ├── Hooks/                      # Custom React hooks
│   │   ├── use-mobile.tsx                     # Mobile detection hook
│   │   ├── use-toast.ts                       # Toast hook
│   │   ├── useDashboardData.ts                # Dashboard data hook
│   │   └── useSEO.ts                          # SEO hook
│   │
│   ├── Lib/                        # Utility libraries
│   │   ├── utils.ts                           # General utilities
│   │   ├── authUtils.ts                       # Auth utilities
│   │   ├── cms.ts                             # CMS utilities
│   │   ├── cms-utils.ts                       # CMS helper utilities
│   │   ├── formatters.ts                      # Formatting utilities
│   │   ├── logger.ts                          # Logger utility
│   │   ├── queryClient.ts                     # React Query client
│   │   ├── rbacAdmin.ts                       # RBAC admin utilities
│   │   └── design-system.ts                   # Design system utilities
│   │
│   ├── Types/                      # TypeScript type definitions
│   │   ├── assets.d.ts                        # Asset type declarations
│   │   ├── leaflet.d.ts                      # Leaflet map types
│   │   └── vite-bundle-visualizer.d.ts        # Bundle visualizer types
│   │
│   ├── Assets/                     # Static assets
│   │   └── icons/                             # Icon assets
│   │
│   └── Dev/                        # Development utilities
│       └── rtl-preview.tsx                    # RTL preview component
│
└── tests/                          # Test files
    ├── visual/
    │   └── check-rtl-preview.tsx              # RTL preview test
    ├── *.html                                 # Test HTML files
    ├── *.ts                                   # Test TypeScript files
    └── *.tsx                                  # Test TSX files
```

---

## Data Directory Structure (`data/`)

```
data/
├── pipeline/                       # Data pipeline
│   └── airflow/                   # Apache Airflow DAGs
│       └── *.py                   # Python DAG files (2 files)
│
├── raw-assets/                     # Raw uploaded assets
│   ├── *.png                      # Image files
│   └── *.csv                      # CSV data files
│
├── schema/                         # Database schemas
│   ├── db/                        # SQL database files
│   │   └── *.sql                 # SQL schema files (6 files)
│   │
│   ├── prisma/                    # Prisma schema and migrations
│   │   ├── schema.prisma         # Prisma schema definition
│   │   ├── schema.prisma.backup  # Schema backup
│   │   ├── migrations/           # Database migrations
│   │   │   ├── migration_lock.toml
│   │   │   └── [timestamp]_[name]/  # Migration directories
│   │   │       └── migration.sql
│   │   └── *.sql                 # Additional SQL files (11 files)
│   │
│   └── seeds/                     # Seed data files
│       └── *.csv                 # CSV seed files (2 files)
│
└── warehouse/                      # Data warehouse (dbt)
    ├── dbt_project.yml            # dbt project configuration
    ├── profiles.yml                # dbt profiles configuration
    └── models/                     # dbt models
        ├── schema.yml             # Model schema definitions
        └── staging/               # Staging models
            ├── schema.yml         # Staging schema
            ├── stg_agent_profiles.sql
            ├── stg_claims.sql
            ├── stg_contact_logs.sql
            ├── stg_leads.sql
            ├── stg_organizations.sql
            ├── stg_properties.sql
            ├── stg_user_events.sql
            └── stg_users.sql
```

---

## Documentation Structure (`docs/`)

```
docs/
├── Main Documentation
│   ├── README.md                  # Main documentation overview
│   ├── DOCUMENTATION_INDEX.md     # Documentation index
│   ├── DOCUMENTATION_SUMMARY.md   # Documentation summary
│   ├── DOCUMENTATION_ORGANIZATION_SUMMARY.md
│   ├── QUICK_START.md             # Quick start guide
│   ├── LOCAL_DEV.md               # Local development guide
│   ├── CHANGELOG.md               # Change log
│   ├── SITEMAP.md                 # Site map
│   ├── DATABASE_SCHEMA_SUMMARY.md # Database schema summary
│   ├── PLATFORM_DOMAIN_REFERENCE.md
│   ├── CMS_LANDING_PAGE_GUIDE.md # CMS landing page guide
│   ├── STYLING_GUIDELINES.md     # Styling guidelines
│   ├── UX_RECOMMENDATIONS.md      # UX recommendations
│   └── platform-layout-guidelines.md
│
├── architecture/                  # Architecture documentation
│   ├── README.md                  # Architecture docs overview
│   ├── ARCHITECTURE_ANALYSIS.md   # Architecture analysis
│   ├── SITE_TREE_MAP.md           # Site tree map (routes)
│   ├── FILE_STRUCTURE_TREE_MAP.md # File structure tree map (this file)
│   ├── ROUTE_VERIFICATION.md      # Route verification plan
│   └── CLEANUP_SUMMARY.md        # Cleanup summary
│
├── audit/                          # Audit documentation
│   ├── README.md                  # Audit docs overview
│   ├── AUDIT_RECOMMENDATIONS.md   # Audit recommendations
│   ├── APPLICATION_AUDIT_ISSUES.md # Identified issues
│   ├── CONSOLIDATED_AUDIT_REPORT.md
│   ├── FIXES_APPLIED.md           # Applied fixes
│   └── COMPREHENSIVE_DOCUMENTATION.md
│
├── deployment/                     # Deployment documentation
│   ├── README.md                  # Deployment docs overview
│   ├── DOCKER.md                  # Docker configuration
│   ├── GCP-DEPLOYMENT.md          # GCP deployment guide
│   ├── DEPLOYMENT_GOOGLE_CLOUD.md # Detailed GCP deployment
│   └── EGRESS-PROXY-CONFIG.md    # Egress proxy configuration
│
├── configuration/                  # Configuration documentation
│   ├── README.md                  # Configuration docs overview
│   └── PORT_CONFIGURATION.md      # Port configuration
│
└── refactoring/                    # Refactoring documentation (10 files)
    ├── README.md                  # Refactoring docs overview
    ├── REFACTORING_STATUS.md      # Refactoring status
    ├── REFACTORING_PROGRESS.md    # Refactoring progress
    ├── REFACTORING_FINAL_REPORT.md
    ├── PHASE2_COMPLETE.md         # Phase 2 completion
    ├── PHASE2_COMPLETION_SUMMARY.md
    ├── PHASE2_REFACTORING_PLAN.md
    └── [additional refactoring docs]
```

---

## Scripts Directory (`scripts/`)

```
scripts/
├── build_admin_assets.ts          # Build admin assets
├── check-admin-user.ts            # Check admin user
├── clear-user-data.ts             # Clear user data
├── create-missing-sections.ts    # Create missing CMS sections
├── create-property-listings-table.sql  # SQL script
├── create-solutions-section.ts    # Create solutions section
├── fix-admin-password.ts           # Fix admin password
├── list_directory_structure.py    # Directory structure linter
├── setup-db.sh                    # Database setup script
├── test-login-api.ts              # Test login API
├── test-login-endpoint.ts         # Test login endpoint
├── test-login.ts                  # Test login
├── verify-admin-password.ts       # Verify admin password
└── verify-clean-db.ts             # Verify clean database
```

---

## Terraform Infrastructure (`terraform/`)

```
terraform/
├── main.tf                        # Main Terraform configuration
├── variables.tf                   # Terraform variables
└── terraform.tfvars.example      # Example variables file
```

---

## Packages Directory (`packages/`)

```
packages/
└── shared/                        # Shared packages
    └── *.ts                       # Shared TypeScript modules (2 files)
```

---

## Public Directory (`public/`)

```
public/
└── uploads/                       # User uploaded files
    └── *.jpg                     # Image uploads
```

---

## File Statistics

### By Category

- **Backend API Files**: ~80+ TypeScript files
- **Frontend Web Files**: ~209 files (156 TSX, 51 TS, 1 CSS)
- **Route Handlers**: 26 route files
- **Services**: 7 service files
- **UI Components**: 50 shadcn/ui components (exact count)
- **Page Components**: 50+ page files
- **Documentation**: 35+ markdown files
- **Database Migrations**: 11+ migration directories
- **Scripts**: 14+ utility scripts

### By Type

- **TypeScript/TSX**: ~300+ files
- **Markdown**: 35+ files
- **SQL**: 20+ files
- **Configuration**: 15+ files
- **Shell Scripts**: 10+ files
- **Python**: 2+ files
- **Docker**: 3 Dockerfiles + 2 compose files

---

## Key Directories Explanation

### `apps/api/`
Backend Express.js API server containing all server-side logic, routes, services, middleware, and database interactions.

### `apps/web/`
Frontend React Single Page Application built with Vite, containing all UI components, pages, hooks, and client-side logic.

### `data/`
Contains database schemas (Prisma), migrations, seed data, data pipeline configurations (Airflow), and data warehouse models (dbt).

### `docs/`
Comprehensive documentation organized by category: architecture, deployment, audit, refactoring, and configuration.

### `scripts/`
Utility scripts for database management, user administration, testing, and setup tasks.

### `terraform/`
Infrastructure as Code definitions for cloud deployment (Google Cloud Platform).

---

## Notes

- **Build Artifacts**: The `dist/` directory contains compiled output and is excluded from this tree map
- **Dependencies**: The `node_modules/` directory contains npm packages and is excluded
- **Git**: The `.git/` directory is excluded
- **Empty Directories**: Some directories may appear empty but are included for organizational purposes
- **Legacy Files**: Some files marked as `.old` or legacy are kept for reference but may be removed in future cleanup

---

## Maintenance

This file structure tree map should be updated when:
- Major directory reorganizations occur
- New major features are added
- Significant refactoring changes the structure
- New documentation categories are created

**Last Review**: January 2025

---

## Related Documentation

- **[SITE_TREE_MAP.md](./SITE_TREE_MAP.md)** - Routes and navigation structure
- **[ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md)** - Architecture analysis and design decisions
- **[DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[README.md](../README.md)** - Main documentation overview

