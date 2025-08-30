# Real Estate CRM

## Overview

This is a full-stack Real Estate CRM application built with React frontend and Express backend. The system manages leads, properties, deals, and client relationships with a modern, responsive interface using shadcn/ui components and Tailwind CSS styling.

The application has been fully translated to Arabic language with proper Right-to-Left (RTL) layout support, making it suitable for Arabic-speaking users in the real estate market.

### WhatsApp Integration
Added WhatsApp messaging functionality linked to customer mobile numbers:
- WhatsApp service integration using whatsapp-web.js (currently using mock service for development)
- SMS/WhatsApp message storage in database
- Send WhatsApp messages directly from lead management interface
- Message status tracking (pending, sent, delivered, failed)
- WhatsApp button available for leads with phone numbers
- Arabic language support for all WhatsApp-related UI elements

## User Preferences

Preferred communication style: Simple, everyday language.
Application language: Arabic with RTL (Right-to-Left) layout support.
Branding: "منصة عقاراتي" (AQARATY Platform) with green color theme matching company logo.

### Development Standards
- **CSS Styling**: All styling must be done using CSS classes in the index.css file. No inline styles allowed.
- **Font Management**: Arabic fonts (Droid Arabic Kufi, Janat Bold, Noto Sans Arabic) are managed through dedicated CSS classes.
- **Color Consistency**: Background colors and theming are standardized through CSS variables and utility classes.
- **Code Organization**: Maintain clean separation between styling (CSS) and component logic (TSX).

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management with React Query Client
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming and RTL support
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Internationalization**: Full Arabic language support with RTL layout using Noto Sans Arabic font

The frontend follows a modular component structure with:
- Pages for different CRM sections (dashboard, leads, properties, pipeline, clients, reports)
- Reusable UI components in the components/ui directory
- Layout components for consistent structure (sidebar, header)
- Modal components for data entry forms

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Shared schema definitions between frontend and backend using Drizzle Zod
- **Storage Pattern**: Repository pattern with database storage and multi-tenant data isolation
- **API Design**: RESTful API endpoints with proper HTTP status codes and error handling
- **Authentication**: Role-based access control with JWT-style user validation and permission checking
- **Multi-Tenancy**: Comprehensive tenant isolation system with hierarchical user management

The backend implements a clean separation of concerns:
- Route handlers for API endpoints with role-based authorization
- Storage abstraction layer with tenant-aware data persistence
- Authentication middleware with permission validation
- Role-based API routes for user and account management
- Shared schema validation between client and server
- Middleware for request logging, error handling, and tenant access control

### Data Storage Solutions
- **Primary Database**: PostgreSQL accessed through Neon serverless connection (✅ **ACTIVE**)
- **ORM**: Drizzle ORM with code-first schema definitions and relations
- **Storage Implementation**: DatabaseStorage class replacing MemStorage for production data persistence
- **Schema Management**: `npm run db:push` for pushing schema changes to database
- **Data Persistence**: All CRM data (leads, properties, deals, activities, messages) now stored in PostgreSQL

**Database Migration Completed (August 12, 2025):**
- Successfully migrated from in-memory storage to PostgreSQL database
- Created all necessary tables: users, leads, properties, deals, activities, messages, sessions
- Implemented proper Drizzle relations between tables
- Replaced MemStorage with DatabaseStorage class using Drizzle ORM operations
- Verified data persistence and API functionality with real database integration

**Multi-Tenant Database Enhancement (August 18, 2025):**
- **Enhanced User Schema**: Extended users table with userLevel, accountOwnerId, companyName, subscription fields, and tenant isolation
- **User Permissions Table**: Created comprehensive permissions table with 14 granular permission categories
- **Tenant Isolation**: Added tenantId fields to all CRM tables (leads, properties, deals, activities, messages) with proper foreign key relationships
- **Default Values**: Implemented automatic tenantId generation using PostgreSQL gen_random_uuid() for seamless data migration
- **Session Management**: Maintained existing session storage for authentication continuity

The enhanced database schema includes:
- Users table with role hierarchy and tenant isolation
- UserPermissions table for granular access control
- Leads, Properties, Deals, Activities, Messages tables with tenant isolation
- Sessions table for authentication persistence

### Authentication and Authorization
- **Admin Login System**: Simple authentication with hardcoded credentials (Admin1/123456)
- Session storage using localStorage for persistence across browser sessions  
- Login page with AQARATY branding and green theme
- Logout functionality integrated in sidebar navigation
- Authentication state management prevents access to CRM without login

**Recent Authentication Updates (August 17, 2025):**
- Implemented admin login page with Arabic interface and green branding
- Added session persistence and logout functionality
- Updated application theme to match AQARATY logo colors (green primary colors)
- Integrated company logo throughout the interface (login page and sidebar)

**Complete Arabic Localization and UI Enhancements (August 17, 2025):**
- Removed English language toggle and simplified system to Arabic-only
- Eliminated all bilingual support for streamlined Arabic user experience
- Integrated custom Arabic font (Janat Bold) from uploaded TTF file for enhanced typography
- Replaced all currency symbols with new Saudi Riyal symbol (﷼) throughout the application
- Fixed RTL layout positioning by changing margin-left to margin-right for proper content centering
- Repositioned sidebar to right side with appropriate RTL borders and spacing
- Updated all seed data with realistic Arabic names and removed "+" from phone numbers
- Translated all status labels (new→جديد, qualified→مؤهل, showing→معاينة, negotiation→تفاوض, closed→مغلق, lost→مفقود)
- Translated all interest type labels (buying→شراء, selling→بيع, renting→إيجار, investment→استثمار)
- Updated dashboard to display phone numbers instead of emails for potential customers
- Limited potential new customers display to maximum 10 entries
- Enhanced quick action cards functionality for adding leads and properties
- **Enhanced Property Photo Management:** Implemented scrollable photo carousel functionality with at least 3-5 photos per property
- Created reusable PhotoCarousel component with navigation arrows, indicators, and photo counter
- Updated property listing and detail pages with interactive photo browsing capabilities
- System now exclusively displays in Arabic with proper RTL layout and Saudi market formatting

**Filter System Improvements and UI Fixes (August 17, 2025):**
- Applied custom background color #edf1ee to all filter sections for consistent branding
- Enhanced filter dropdown visibility with improved contrast and styling
- Fixed sidebar navigation duplication by removing redundant "/leads" entry
- Resolved dropdown positioning issues by adding proper z-index values (z-50) to all SelectContent elements
- Improved sidebar stability by increasing z-index to prevent interference with dropdown menus
- Updated routing to use unified "/customers" path for potential customer management
- Enhanced filter panel styling with subtle borders, shadows, and better typography
- **Fixed dropdown layout shift issue**: Added `position="popper"` and `sideOffset={4}` to prevent content movement when dropdowns open/close
- Implemented consistent dropdown positioning across all filter sections in Properties and Customers pages

**Complete Role-Based Access Control Implementation (August 18, 2025):**
- **Multi-Tenant Database Schema**: Implemented comprehensive user hierarchy with users, userPermissions tables supporting platform admins, account owners, and sub-accounts
- **Tenant Data Isolation**: Added tenantId fields to all CRM data tables (leads, properties, deals, activities, messages) with default values for seamless migration
- **Authentication Middleware**: Created robust role-based authentication system with JWT-style user validation, permission checking, and tenant access control
- **User Level Hierarchy**: 
  - Level 1: Platform Administrators (cross-account visibility and management)
  - Level 2: Account Owners (company-wide access with sub-account management)
  - Level 3: Sub-Accounts (limited access within their company tenant)
- **Permission Matrix**: Implemented detailed permission system covering company settings, billing, user management, data access, campaigns, integrations, API keys, reports, and admin functions
- **Role-Based API Routes**: Created comprehensive endpoints for user management, account administration, and tenant-isolated data access
- **Database Migration**: Successfully migrated existing data with proper tenant isolation and default permission assignments
- **Multi-Tenant Storage Layer**: Updated all storage methods to support optional tenantId parameters for proper data segregation
- **Subscription Management**: Integrated seat limits, subscription tiers, and billing status tracking for account owners

**Saudi Regional Data Integration (August 30, 2025):**
- **Saudi Regions Database**: Added saudiRegions table with all 13 official administrative regions of Saudi Arabia
- **Regional Data Schema**: Implemented proper schema with Arabic names, English names, and official region codes (SA-01 to SA-13)
- **API Endpoints**: Created GET /api/saudi-regions and POST /api/saudi-regions/seed endpoints for regional data management
- **Data Seeding**: Successfully populated database with comprehensive regional data including Riyadh, Makkah, Madinah, Eastern Province, Asir, and all other regions
- **Multi-Language Support**: Full Arabic and English naming for all regions to support localized user interface
- **Database Integration**: Complete integration with existing CRM database structure using Drizzle ORM and PostgreSQL storage

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React with TypeScript
- **Component Library**: Radix UI primitives (@radix-ui/react-*)
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Validation**: Zod for runtime type validation
- **Routing**: Wouter for lightweight routing
- **Utilities**: class-variance-authority, clsx for conditional classes
- **Date Handling**: date-fns for date manipulation
- **Drag & Drop**: react-beautiful-dnd for pipeline management

### Backend Dependencies
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL via @neondatabase/serverless
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Validation**: Zod for schema validation
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build System**: Vite for frontend bundling
- **TypeScript**: Full TypeScript support across the stack
- **Development Server**: Vite dev server with HMR
- **Database Migrations**: Drizzle Kit for database schema management
- **Linting**: ESBuild for production builds
- **Replit Integration**: Replit-specific plugins for development environment