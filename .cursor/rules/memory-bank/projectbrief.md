# Project Brief

## Project Name
Real Estate CRM Platform (عقاركم)

## Core Mission
Build a comprehensive, Arabic-first, RTL-native real estate CRM platform that enables property agents, brokers, and companies to manage their listings, leads, customers, and operations efficiently in the MENA market.

## Primary Goals

1. **Multi-Tenant CRM System**
   - Support individual brokers, corporate companies, and customers
   - Role-based access control (RBAC) with 6 core roles
   - Account hierarchy with different listing/customer limits

2. **Property Management**
   - Property listings with search, filtering, and comparison
   - Google Maps integration for visualization
   - Property categories, types, and location management

3. **Lead & Customer Management**
   - Buyer pool with claim/release workflow
   - Lead tracking and contact management
   - Automated workflows and notifications

4. **Content Management**
   - CMS for landing pages and marketing content
   - Draft/publish workflow with version control
   - Media management and SEO optimization

5. **Analytics & Reporting**
   - Comprehensive analytics platform
   - KPI dashboards
   - Data warehouse with dbt models

6. **Arabic-First Experience**
   - RTL-first architecture (not an afterthought)
   - Arabic typography and cultural UX
   - Bilingual support (Arabic/English)

## Target Users

- **Individual Brokers**: 30 active listings, 100 customers limit
- **Corporate Companies**: 100 listings, 500 customers per employee
- **Customers/Buyers**: Property search and inquiry access
- **Website Administrators**: Full system access

## Success Criteria

- Fully functional CRM with all core features
- RTL-first UI that works perfectly in Arabic
- Scalable architecture supporting multi-tenancy
- Production-ready deployment on GCP
- Comprehensive analytics and reporting
- CMS-controlled marketing content

## Project Scope

**In Scope:**
- Property management and listings
- Lead and customer management
- RBAC and multi-tenancy
- CMS for marketing content
- Analytics and reporting
- Arabic/RTL support
- Admin dashboard
- Public landing pages

**Out of Scope (for now):**
- Mobile native apps
- Payment processing integration
- Third-party CRM integrations
- Advanced AI/ML features

## Key Constraints

- Must be Arabic-first and RTL-native
- Must support multi-tenancy with proper isolation
- Must be deployable to GCP Cloud Run
- Must use PostgreSQL for data persistence
- Must follow RBAC security model
- Must maintain audit trails for compliance

## Project Status
Active development - Core features implemented, ongoing improvements and refinements.
