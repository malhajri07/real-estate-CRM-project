# CMS Landing Page Management Guide

## Overview

The landing page CMS allows administrators to fully control all sections of the public landing page (`/`) through a web interface at `/admin/content/landing-pages`. All content is managed through a draft/publish workflow with version control and audit logging.

## Access

- **URL**: `http://localhost:3000/admin/content/landing-pages`
- **Required Roles**: `WEBSITE_ADMIN`, `CMS_ADMIN`, or `EDITOR`
- **Authentication**: Must be logged in with appropriate role

## Available Sections

The landing page consists of 8 main sections, all fully CMS-controlled:

### 1. Hero Section (`hero`)
- **Purpose**: Main landing section with welcome message and dashboard preview
- **Editable Fields**:
  - Welcome text
  - Main title
  - Subtitle
  - Primary CTA button text
  - Login button text
  - Dashboard title
  - Dashboard metrics (up to 4 metrics with values, labels, and colors)
- **Cards**: 1 card (dashboard preview)

### 2. Features Section (`features`)
- **Purpose**: Display key features of the platform
- **Editable Fields**:
  - Section title
  - Section description
- **Cards**: Multiple feature cards, each with:
  - Title
  - Description
  - Icon (from predefined icon library)

### 3. Solutions Section (`solutions`)
- **Purpose**: Showcase solution offerings
- **Editable Fields**:
  - Section title
  - Section description
- **Cards**: Multiple solution cards, each with:
  - Title
  - Description
  - Icon
  - Features list (one feature per line in textarea)

### 4. Stats Section (`stats`)
- **Purpose**: Display key statistics and numbers
- **Editable Fields**:
  - Section title
- **Cards**: Multiple stat cards, each with:
  - Value (number/text)
  - Label
  - Suffix (optional)

### 5. Pricing Section (`pricing`)
- **Purpose**: Display pricing plans
- **Editable Fields**:
  - Section title
  - Section subtitle
- **Cards**: Multiple pricing plan cards, each with:
  - Plan name
  - Description
  - Price
  - Period (monthly/yearly)
  - Popular flag
  - CTA button text
  - Features list (one feature per line, prefixed with `-` for excluded features)

### 6. Contact Section (`contact`)
- **Purpose**: Display contact information
- **Editable Fields**:
  - Section title
  - Section description
- **Cards**: Multiple contact info cards, each with:
  - Label (e.g., "الهاتف")
  - Value (e.g., "+966 50 123 4567")
  - Icon (phone, mail, map-pin, etc.)

### 7. Footer Section (`footer`)
- **Purpose**: Footer content and links
- **Editable Fields**:
  - Footer description
  - Copyright text
- **Cards**: Footer link groups (managed separately via navigation management)

### 8. CTA Section (`cta`)
- **Purpose**: Call-to-action sections
- **Editable Fields**: Customizable per use case

## Workflow

### Draft/Publish Model

1. **Draft Mode**: All edits are saved as drafts by default
2. **Publish**: Click "Publish" to make changes live on the public site
3. **Version Control**: Each publish creates a new version
4. **Rollback**: Previous versions can be restored

### Editing Sections

1. Navigate to `/admin/content/landing-pages`
2. Select a section from the sidebar
3. Edit section title/subtitle in the section form
4. Click "Save" to save as draft
5. Click "Publish" to make changes live

### Managing Cards

1. Select a section that contains cards
2. Cards appear below the section editor
3. Click on a card to edit:
   - Title, body, icon (depending on card type)
   - For solutions: Features list (one per line)
   - For pricing: Price, period, features list
   - For contact: Label, value, icon
4. Click "Save" on the card to save changes
5. Use "Delete" to remove a card
6. Use "+ Add Card" to create new cards

### Reordering

- **Sections**: Drag sections in the sidebar to reorder
- **Cards**: Drag cards within a section to reorder

## Technical Details

### Data Attributes

All landing page elements include CMS data attributes for integration:
- `data-cms-section`: Section identifier
- `data-cms-field`: Individual field identifier
- `data-cms-collection`: Collection of items (cards, features, etc.)
- `data-cms-item`: Individual item identifier

### API Endpoints

- `GET /api/cms/landing/sections?status=draft|published` - List sections
- `GET /api/cms/landing/sections/:id` - Get section details
- `POST /api/cms/landing/sections` - Create new section
- `PUT /api/cms/landing/sections/:id` - Update section
- `POST /api/cms/landing/sections/:id/publish` - Publish section
- `POST /api/cms/landing/sections/reorder` - Reorder sections
- `POST /api/cms/landing/cards` - Create new card
- `PUT /api/cms/landing/cards/:id` - Update card
- `DELETE /api/cms/landing/cards/:id` - Delete card
- `POST /api/cms/landing/cards/reorder` - Reorder cards

### Database Schema

- `LandingSection`: Stores section metadata and draft/published JSON
- `LandingCard`: Stores card data linked to sections
- `LandingVersion`: Version history snapshots
- `LandingAuditLog`: Audit trail of all changes

## Best Practices

1. **Always preview drafts** before publishing
2. **Use version control** to track changes
3. **Test on staging** before production
4. **Keep content concise** for better user experience
5. **Use appropriate icons** from the icon library
6. **Maintain consistent styling** across sections
7. **Regular backups** of published content

## Troubleshooting

### Section not appearing
- Check if section exists in database: `scripts/create-missing-sections.ts`
- Verify section `visible` flag is `true`
- Check section `status` is `published` for public view

### Changes not reflecting
- Ensure you clicked "Publish" after saving
- Clear browser cache
- Check if viewing draft vs published mode

### Cards not saving
- Verify card form is complete
- Check browser console for errors
- Ensure user has proper permissions

## Scripts

### Create Missing Sections
```bash
npx tsx scripts/create-missing-sections.ts
```

### Create Solutions Section
```bash
npx tsx scripts/create-solutions-section.ts
```

These scripts ensure all required sections exist in the database with default content.

