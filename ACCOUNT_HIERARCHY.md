# Real Estate Platform Account Hierarchy System

## Overview

This document describes the comprehensive account hierarchy system implemented for the Real Estate CRM platform, supporting three distinct user types with specific limitations and capabilities.

## Account Types

### 1. 🏠 **Customer Accounts** (`customer`)
**Purpose**: Regular users who search for properties and contact brokers

**Capabilities**:
- Browse publicly visible properties
- Search and filter properties
- Contact brokers about properties
- Save favorite properties
- Set up property alerts
- View property details and broker information

**Limitations**:
- Cannot create property listings
- Cannot access CRM features
- Cannot manage other users

**Registration**: Simple registration with basic information

---

### 2. 👤 **Individual Broker Accounts** (`individual_broker`)
**Purpose**: Licensed real estate brokers working independently

**Capabilities**:
- Create and manage property listings
- Manage customer leads and inquiries
- Access CRM dashboard and tools
- Receive inquiries from customers
- Manage deals and activities
- Send WhatsApp messages to customers

**Limitations**:
- **Maximum 30 active property listings**
- **Maximum 100 customers/leads**
- Cannot create sub-accounts
- Cannot manage other users

**Registration Requirements**:
- Valid real estate license (فال العقاري)
- Saudi national ID
- License verification documents
- Professional information

---

### 3. 🏢 **Corporate Company Accounts** (`corporate_company`)
**Purpose**: Real estate companies with multiple employees

#### Company Owner (`isCompanyOwner: true`)
**Capabilities**:
- All individual broker capabilities
- Create and manage employee accounts
- View company-wide statistics
- Manage company settings and branding
- Access to all company data
- Unlimited listings (distributed among employees)

**Employee Management**:
- Add/remove employees
- Set employee permissions
- Monitor employee performance
- Manage employee limits

#### Company Employee (`isCompanyOwner: false`)
**Capabilities**:
- Create and manage property listings
- Manage customer leads and inquiries
- Access CRM features within company context
- Collaborate with other employees

**Limitations**:
- **Maximum 100 active property listings per employee**
- **Maximum 500 customers/leads per employee**
- Cannot manage other employees
- Data shared within company tenant

---

## Technical Implementation

### Database Schema

```sql
-- Users table with account hierarchy
users {
  id: varchar (primary key)
  email: varchar (unique)
  firstName: varchar
  lastName: varchar
  phone: varchar
  
  -- Account Type System
  accountType: varchar -- 'customer', 'individual_broker', 'corporate_company', 'platform_admin'
  
  -- Professional Information
  licenseNumber: varchar -- Real estate license
  companyName: varchar -- Company name for corporate accounts
  
  -- Corporate Hierarchy
  parentCompanyId: varchar -- Reference to parent company
  isCompanyOwner: boolean -- True for company owners
  
  -- Limits and Status
  isActive: boolean
  isVerified: boolean
  
  -- Individual Broker Limits
  maxActiveListings: integer (default: 30)
  currentActiveListings: integer (default: 0)
  maxCustomers: integer (default: 100)
  currentCustomers: integer (default: 0)
  
  -- Corporate Company Limits
  maxEmployees: integer (default: 0)
  currentEmployees: integer (default: 0)
  maxListingsPerEmployee: integer (default: 100)
  maxCustomersPerEmployee: integer (default: 500)
  
  -- Customer Preferences
  preferredContactMethod: varchar
  interestedPropertyTypes: text[]
  budgetRange: varchar
  preferredLocations: text[]
}
```

### Properties Table

```sql
properties {
  id: varchar (primary key)
  title: text
  description: text
  address: text
  city: text
  price: decimal
  
  -- Visibility and Status
  status: text -- 'active', 'pending', 'sold', 'withdrawn', 'draft'
  isPubliclyVisible: boolean -- Visible to customers
  isFeatured: boolean
  
  -- Ownership
  ownerId: varchar -- Property owner/listing agent
  companyId: varchar -- For corporate employees
  
  -- Analytics
  viewCount: integer
  inquiryCount: integer
}
```

### Property Inquiries Table

```sql
propertyInquiries {
  id: varchar (primary key)
  propertyId: varchar
  customerId: varchar -- Registered customer (optional)
  
  -- Customer Information
  customerName: text
  customerEmail: text
  customerPhone: text
  
  -- Inquiry Details
  inquiryType: text -- 'general', 'viewing_request', 'price_inquiry'
  message: text
  status: text -- 'new', 'contacted', 'scheduled', 'closed'
  
  -- Response
  brokerResponse: text
  respondedBy: varchar
  respondedAt: timestamp
}
```

## API Endpoints

### Account Management

```typescript
// Register new account
POST /api/accounts/register
{
  firstName: string
  lastName: string
  email: string
  phone: string
  accountType: 'customer' | 'individual_broker' | 'corporate_company'
  licenseNumber?: string // Required for brokers
  companyName?: string // Required for companies
  isCompanyOwner?: boolean // For corporate accounts
}

// Get account statistics
GET /api/accounts/stats/:userId
Response: {
  accountType: string
  currentActiveListings: number
  maxActiveListings: number
  currentCustomers: number
  maxCustomers: number
  listingsUsagePercent: number
  customersUsagePercent: number
}

// Check permissions
GET /api/accounts/can-create-listing/:userId
GET /api/accounts/can-add-customer/:userId
```

### Corporate Company Management

```typescript
// Add employee to company
POST /api/accounts/company/:companyId/employees
{
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
}

// Get company employees
GET /api/accounts/company/:companyId/employees
```

### Public Property Access (for customers)

```typescript
// Get public properties
GET /api/accounts/public/properties
Query params: city, propertyType, minPrice, maxPrice, bedrooms

// Get property details
GET /api/accounts/public/properties/:propertyId

// Create property inquiry
POST /api/accounts/public/properties/:propertyId/inquire
{
  customerName: string
  customerEmail: string
  customerPhone?: string
  inquiryType: string
  message?: string
}
```

## Business Logic

### Account Limits Enforcement

```typescript
class AccountService {
  // Individual Broker Limits
  static readonly INDIVIDUAL_BROKER_LIMITS = {
    MAX_ACTIVE_LISTINGS: 30,
    MAX_CUSTOMERS: 100
  };

  // Corporate Employee Limits
  static readonly CORPORATE_EMPLOYEE_LIMITS = {
    MAX_LISTINGS_PER_EMPLOYEE: 100,
    MAX_CUSTOMERS_PER_EMPLOYEE: 500
  };

  async canCreateListing(userId: string): Promise<{canCreate: boolean, reason?: string}> {
    // Check current active listings vs limits
    // Return permission status with reason
  }

  async canAddCustomer(userId: string): Promise<{canAdd: boolean, reason?: string}> {
    // Check current customers vs limits
    // Return permission status with reason
  }
}
```

### Automatic Lead Generation

When a customer inquires about a property:
1. Create property inquiry record
2. Check if broker can accept more customers
3. If yes, automatically create lead for the broker
4. If no, inquiry remains pending until broker has capacity

## User Experience Flow

### For Customers
1. **Browse Properties**: View public property listings
2. **Search & Filter**: Find properties matching criteria
3. **Contact Brokers**: Submit inquiries about properties
4. **Save Favorites**: Create wishlist of properties
5. **Set Alerts**: Get notified about new matching properties

### For Individual Brokers
1. **Manage Listings**: Create up to 30 active property listings
2. **Handle Inquiries**: Respond to customer inquiries
3. **Manage Customers**: Track up to 100 customers/leads
4. **CRM Tools**: Use dashboard, activities, messaging
5. **Monitor Limits**: View usage statistics and limits

### For Corporate Companies
1. **Company Owner**:
   - Set up company profile and branding
   - Add/manage employees (up to plan limit)
   - Monitor company-wide performance
   - Access all company data

2. **Company Employees**:
   - Create up to 100 listings each
   - Manage up to 500 customers each
   - Collaborate within company context
   - Share leads and properties with team

## Subscription Tiers

### Individual Brokers
- **Basic**: 30 listings, 100 customers, basic features
- **Premium**: Enhanced features, priority support
- **Professional**: Advanced analytics, marketing tools

### Corporate Companies
- **Business**: Up to 10 employees
- **Enterprise**: Up to 50 employees
- **Custom**: Unlimited employees, custom features

## Security & Data Isolation

### Tenant Isolation
- Each account type has proper data isolation
- Corporate companies share data within tenant
- Individual brokers have private data
- Customers only see public data

### Permission System
- Role-based access control
- Feature-level permissions
- API endpoint protection
- Data visibility controls

## Monitoring & Analytics

### Usage Tracking
- Active listings count per user
- Customer/lead count per user
- Inquiry response rates
- Conversion metrics

### Limit Enforcement
- Real-time limit checking
- Usage percentage alerts
- Upgrade prompts when approaching limits
- Automatic enforcement of restrictions

## Future Enhancements

1. **Advanced Analytics**: Detailed performance metrics
2. **Team Collaboration**: Enhanced corporate features
3. **Mobile App**: Native mobile applications
4. **API Integration**: Third-party integrations
5. **White Label**: Custom branding for companies
6. **Advanced Permissions**: Granular permission system

This account hierarchy system provides a scalable foundation for the real estate platform, ensuring proper separation of concerns while maintaining flexibility for future growth.