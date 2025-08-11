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
- **Primary Database**: PostgreSQL accessed through Neon serverless connection
- **ORM**: Drizzle ORM with code-first schema definitions
- **Migrations**: Drizzle migrations system for schema versioning
- **Development**: In-memory storage fallback for development environments

The database schema includes:
- Users table for authentication
- Leads table for prospect management
- Properties table for real estate listings
- Deals table linking leads to properties with pipeline stages
- Activities table for tracking interactions

### Authentication and Authorization
- Basic session-based authentication structure is prepared but not fully implemented
- User management endpoints and schema are defined
- Session storage using connect-pg-simple for PostgreSQL session store

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