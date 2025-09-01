# 🚀 Quick Strapi Setup Guide

## Step 1: Access Strapi Admin
1. Go to http://localhost:1337/admin
2. Create your admin account if you haven't already

## Step 2: Create Components (Do this first!)

### Create each component in Content-Type Builder:

1. **shared.feature**
   - title (Text, Required)
   - description (Text, Required)
   - icon (Text, Required)

2. **shared.stat**
   - number (Text, Required)
   - label (Text, Required)
   - suffix (Text, Optional)

3. **shared.plan-feature**
   - text (Text, Required)
   - included (Boolean, Required, Default: true)

4. **shared.navigation-item**
   - text (Text, Required)
   - url (Text, Required)
   - order (Number-Integer, Required)

5. **shared.hero-dashboard-metric**
   - value (Text, Required)
   - label (Text, Required)
   - color (Enumeration: blue,green,orange,purple, Required)
   - order (Number-Integer, Required)

## Step 3: Create Content Types

### Landing Page (Single Type)
API ID: `landing-page`

Add these fields in order:
- loadingText (Text)
- heroWelcomeText (Text)
- heroTitle (Text, Required)
- heroSubtitle (Text, Required)
- heroButton (Text, Required)
- heroLoginButton (Text)
- heroDashboardTitle (Text)
- heroDashboardMetrics (Component-Repeatable: shared.hero-dashboard-metric)
- featuresTitle (Text, Required)
- featuresDescription (Text, Required)
- features (Component-Repeatable: shared.feature)
- solutionsTitle (Text, Required)
- solutionsDescription (Text, Required)
- statsTitle (Text, Required)
- stats (Component-Repeatable: shared.stat)
- pricingTitle (Text, Required)
- pricingSubtitle (Text, Required)
- navigation (Component-Repeatable: shared.navigation-item)

### Pricing Plan (Collection Type)
API ID: `pricing-plan`

Add these fields:
- name (Text, Required)
- price (Number-Decimal, Required)
- period (Enumeration: monthly,yearly, Required)
- isPopular (Boolean, Default: false)
- description (Text, Required)
- buttonText (Text, Required)
- order (Number-Integer, Required)
- features (Component-Repeatable: shared.plan-feature)

## Step 4: Set Permissions
1. Settings → Roles & Permissions → Public
2. Enable `find` for:
   - Landing-page
   - Pricing-plan

## Step 5: Add Content
1. Content Manager → Landing Page → Create entry
2. Fill in all the fields with Arabic content
3. Content Manager → Pricing Plans → Add your plans
4. Save and Publish everything

## ✅ Result:
Every text element on your landing page will now be editable through Strapi!