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
- **Storage Pattern**: Repository pattern with in-memory storage for development and database storage for production
- **API Design**: RESTful API endpoints with proper HTTP status codes and error handling

The backend implements a clean separation of concerns:
- Route handlers for API endpoints
- Storage abstraction layer for data persistence
- Shared schema validation between client and server
- Middleware for request logging and error handling

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

The database schema includes:
- Users table for authentication
- Leads table for prospect management
- Properties table for real estate listings
- Deals table linking leads to properties with pipeline stages
- Activities table for tracking interactions

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