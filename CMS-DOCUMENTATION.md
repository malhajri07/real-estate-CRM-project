# Content Management System (CMS) Documentation

## Overview

The CMS allows authorized users to manage landing page content through a comprehensive interface. Non-developers can edit text, media, order, visibility, and publish status without touching code. Changes reflect on the public landing page after publishing.

## Features

### 🎯 Core Functionality
- **Section Management**: Create, edit, reorder, and publish landing page sections
- **Card Management**: Manage content cards within sections with drag-and-drop reordering
- **Draft/Published Workflow**: Edit in draft mode, preview changes, then publish
- **Role-Based Access**: Different permission levels for Admin, Editor, and Viewer roles
- **Version Control**: Track changes with audit logs and version history
- **Real-time Preview**: See changes before publishing

### 🎨 Content Types
- **Hero Sections**: Main landing page banners with CTAs
- **Feature Grids**: Showcase platform features and benefits
- **Pricing Tables**: Display subscription plans and pricing
- **CTA Sections**: Call-to-action blocks for conversions
- **Custom Layouts**: Flexible content blocks for any use case

### 🔧 Technical Features
- **Drag & Drop**: Reorder sections and cards with intuitive interface
- **Rich Text Editing**: Format content with inline editing
- **Media Management**: Upload and manage images, videos, and assets
- **URL Validation**: Ensure all links are properly formatted
- **Content Validation**: Enforce character limits and required fields
- **Cache Invalidation**: Automatic cache clearing on publish

## Database Schema

### Tables

#### `LandingSection`
```sql
- id: UUID (Primary Key)
- slug: TEXT (Unique identifier)
- title: TEXT
- subtitle: TEXT
- layoutVariant: TEXT (hero|grid|pricing|logos|cta|custom)
- theme: JSONB (styling configuration)
- orderIndex: INTEGER
- visible: BOOLEAN
- status: TEXT (draft|published|archived)
- draftJson: JSONB (draft content)
- publishedJson: JSONB (published content)
- version: INTEGER
- updatedBy: TEXT
- publishedBy: TEXT
- updatedAt: TIMESTAMP
- publishedAt: TIMESTAMP
- createdAt: TIMESTAMP
```

#### `LandingCard`
```sql
- id: UUID (Primary Key)
- sectionId: UUID (Foreign Key)
- orderIndex: INTEGER
- title: TEXT
- body: TEXT
- mediaUrl: TEXT
- icon: TEXT
- ctaLabel: TEXT
- ctaHref: TEXT
- visible: BOOLEAN
- status: TEXT (draft|published|archived)
- draftJson: JSONB
- publishedJson: JSONB
- version: INTEGER
- updatedBy: TEXT
- publishedBy: TEXT
- updatedAt: TIMESTAMP
- publishedAt: TIMESTAMP
- createdAt: TIMESTAMP
```

#### `LandingAuditLog`
```sql
- id: BIGSERIAL (Primary Key)
- actor: TEXT
- entityType: TEXT (section|card)
- entityId: UUID
- action: TEXT (create|update|reorder|publish|archive|restore|delete)
- fromVersion: INTEGER
- toVersion: INTEGER
- createdAt: TIMESTAMP
```

#### `LandingVersion`
```sql
- id: BIGSERIAL (Primary Key)
- entityType: TEXT (section|card)
- entityId: UUID
- version: INTEGER
- snapshot: JSONB
- createdBy: TEXT
- createdAt: TIMESTAMP
```

## API Endpoints

### Authentication
All CMS endpoints require authentication and appropriate role permissions.

### Section Management

#### GET `/api/cms/landing/sections`
- **Query Parameters**: `status` (draft|published), `includeArchived` (boolean)
- **Response**: Array of sections with nested cards
- **Roles**: All authenticated users

#### POST `/api/cms/landing/sections`
- **Body**: Section creation data
- **Roles**: WEBSITE_ADMIN, CMS_ADMIN, EDITOR

#### PUT `/api/cms/landing/sections/:id`
- **Body**: Section update data
- **Roles**: WEBSITE_ADMIN, CMS_ADMIN, EDITOR

#### PUT `/api/cms/landing/sections/reorder`
- **Body**: Array of {id, orderIndex} objects
- **Roles**: WEBSITE_ADMIN, CMS_ADMIN, EDITOR

#### POST `/api/cms/landing/sections/:id/publish`
- **Body**: {publishCards: boolean}
- **Roles**: WEBSITE_ADMIN

#### POST `/api/cms/landing/sections/:id/archive`
- **Roles**: WEBSITE_ADMIN

#### DELETE `/api/cms/landing/sections/:id`
- **Roles**: WEBSITE_ADMIN

### Card Management

#### POST `/api/cms/landing/cards`
- **Body**: {sectionId, draftJson}
- **Roles**: WEBSITE_ADMIN, CMS_ADMIN, EDITOR

#### PUT `/api/cms/landing/cards/:id`
- **Body**: Card update data
- **Roles**: WEBSITE_ADMIN, CMS_ADMIN, EDITOR

#### PUT `/api/cms/landing/cards/reorder`
- **Body**: {sectionId, orders: [{id, orderIndex}]}
- **Roles**: WEBSITE_ADMIN, CMS_ADMIN, EDITOR

#### POST `/api/cms/landing/cards/:id/publish`
- **Roles**: WEBSITE_ADMIN

#### POST `/api/cms/landing/cards/:id/archive`
- **Roles**: WEBSITE_ADMIN

#### DELETE `/api/cms/landing/cards/:id`
- **Roles**: WEBSITE_ADMIN

### Public Endpoints

#### GET `/api/landing`
- **Response**: Published sections and cards only
- **Caching**: 60 seconds with stale-while-revalidate
- **Access**: Public (no authentication required)

#### GET `/preview/landing`
- **Query Parameters**: `token` (optional preview token)
- **Response**: Draft content for authorized users
- **Access**: Authenticated users with preview permissions

## User Interface

### CMS Dashboard Layout

The CMS interface is organized into three main panels:

#### Left Panel: Section List
- **Drag & Drop**: Reorder sections by dragging
- **Status Indicators**: Visual status badges (draft/published/archived)
- **Quick Actions**: Edit, duplicate, archive buttons
- **Search & Filter**: Find sections quickly

#### Center Panel: Section Editor
- **Live Preview**: See changes in real-time
- **Form Fields**: Title, subtitle, body, layout variant
- **Media Upload**: Image and video management
- **CTA Configuration**: Call-to-action button setup
- **Theme Settings**: Custom styling options
- **Save/Publish**: Draft and publish controls

#### Right Panel: Card Management
- **Card List**: All cards in the selected section
- **Drag & Drop**: Reorder cards within sections
- **Quick Edit**: Inline editing for card content
- **Bulk Actions**: Select multiple cards for batch operations

### Content Editor Features

#### Rich Text Editing
- **Inline Editing**: Click to edit text directly
- **Formatting**: Bold, italic, links, lists
- **Character Limits**: Visual indicators for content limits
- **Auto-save**: Automatic draft saving

#### Media Management
- **Image Upload**: Drag & drop image uploads
- **URL Validation**: Ensure all media URLs are valid
- **Alt Text**: Accessibility support for images
- **Responsive Preview**: See how media looks on different devices

#### Layout Options
- **Hero**: Full-width banner sections
- **Grid**: Multi-column content layouts
- **Pricing**: Specialized pricing table layouts
- **Logos**: Logo showcase sections
- **CTA**: Call-to-action focused layouts
- **Custom**: Flexible content blocks

## Role-Based Access Control

### WEBSITE_ADMIN
- **Full Access**: All CMS functionality
- **Publish Rights**: Can publish any content
- **User Management**: Manage other CMS users
- **System Settings**: Configure CMS preferences

### CMS_ADMIN
- **Content Management**: Create, edit, and organize content
- **Publish Rights**: Can publish content
- **User Management**: Limited user management
- **No System Access**: Cannot modify system settings

### EDITOR
- **Content Creation**: Create and edit content
- **Draft Management**: Save and manage drafts
- **No Publish Rights**: Cannot publish content
- **Limited Access**: Cannot manage users or settings

### VIEWER
- **Read Only**: View published content
- **No Edit Rights**: Cannot modify any content
- **Preview Access**: Can preview draft content

## Workflow

### Content Creation Workflow

1. **Create Section**: Add new landing page section
2. **Configure Layout**: Choose layout variant and theme
3. **Add Content**: Write title, subtitle, and body content
4. **Add Cards**: Create content cards within the section
5. **Save Draft**: Save work in progress
6. **Preview**: Review changes before publishing
7. **Publish**: Make content live on the website

### Content Update Workflow

1. **Edit Draft**: Modify existing content
2. **Review Changes**: Compare with published version
3. **Test Preview**: Ensure changes look correct
4. **Save Draft**: Store changes without publishing
5. **Publish**: Update live content

### Content Archival Workflow

1. **Archive Section**: Move section to archived status
2. **Hide from Public**: Remove from public landing page
3. **Preserve History**: Keep for future reference
4. **Restore Option**: Can be restored if needed

## Validation Rules

### Content Limits
- **Section Title**: Maximum 120 characters
- **Section Subtitle**: Maximum 180 characters
- **Section Body**: Maximum 10,000 characters
- **Card Title**: Maximum 120 characters
- **Card Body**: Maximum 10,000 characters
- **CTA Label**: Maximum 60 characters

### URL Validation
- **Media URLs**: Must be valid HTTP/HTTPS URLs
- **CTA Links**: Must be valid URLs or internal paths
- **Icon URLs**: Must be valid image URLs

### Required Fields
- **Section**: slug, title, layoutVariant
- **Card**: sectionId (automatically set)

## Caching Strategy

### Public Content Caching
- **Cache Duration**: 60 seconds
- **Stale While Revalidate**: 120 seconds
- **Cache Key**: Based on content hash
- **Invalidation**: Automatic on publish/archive/delete

### Preview Caching
- **No Caching**: Always fresh content
- **Authentication**: Required for access
- **Token Support**: Optional preview tokens

## Security Considerations

### Authentication
- **JWT Tokens**: Secure authentication system
- **Role Validation**: Server-side role checking
- **Session Management**: Secure session handling

### Content Security
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: Prevent abuse of API endpoints

### Data Protection
- **Audit Logging**: Track all content changes
- **Version History**: Preserve content versions
- **Backup Strategy**: Regular content backups

## Performance Optimization

### Database Optimization
- **Indexes**: Optimized database indexes
- **Query Optimization**: Efficient database queries
- **Connection Pooling**: Database connection management

### Frontend Optimization
- **Lazy Loading**: Load content on demand
- **Image Optimization**: Compressed and responsive images
- **Bundle Splitting**: Optimized JavaScript bundles

### Caching Strategy
- **CDN Integration**: Content delivery network
- **Browser Caching**: Client-side caching
- **API Caching**: Server-side response caching

## Troubleshooting

### Common Issues

#### Content Not Publishing
- **Check Permissions**: Ensure user has publish rights
- **Validate Content**: Check for validation errors
- **Review Status**: Confirm section/card status

#### Drag & Drop Not Working
- **Browser Support**: Ensure modern browser
- **JavaScript**: Check for JavaScript errors
- **Network**: Verify stable internet connection

#### Preview Not Loading
- **Authentication**: Ensure user is logged in
- **Permissions**: Check preview access rights
- **Content Status**: Verify content exists

### Error Messages

#### "Insufficient Permissions"
- **Solution**: Contact admin for role upgrade
- **Check**: Current user role and permissions

#### "Content Validation Failed"
- **Solution**: Review content against validation rules
- **Check**: Character limits and required fields

#### "Publish Failed"
- **Solution**: Check content status and permissions
- **Retry**: Attempt publish operation again

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate deploy

# Seed initial data
npx tsx server/seed-cms.ts

# Start development server
npm run dev
```

### Testing
```bash
# Run API tests
node test-cms-api.js

# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## Deployment

### Production Setup
1. **Database**: Set up production PostgreSQL
2. **Environment**: Configure production environment variables
3. **Migrations**: Run database migrations
4. **Seeding**: Populate with initial content
5. **Monitoring**: Set up error tracking and monitoring

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=your-jwt-secret
LANDING_PREVIEW_TOKEN=your-preview-token
```

## Support

### Getting Help
- **Documentation**: Refer to this documentation
- **API Testing**: Use the test script for API validation
- **Logs**: Check server logs for error details

### Reporting Issues
- **Bug Reports**: Include steps to reproduce
- **Feature Requests**: Describe desired functionality
- **Performance Issues**: Include system specifications

---

## Quick Start Guide

1. **Access CMS**: Navigate to `/rbac-dashboard` and select "Content Management"
2. **Create Section**: Click "Add Section" to create new content
3. **Add Cards**: Create content cards within your section
4. **Edit Content**: Use the inline editor to modify text and media
5. **Save Draft**: Save your work without publishing
6. **Preview**: Review changes before going live
7. **Publish**: Make content visible on the public website

The CMS is now fully functional and ready for content management! 🎉
