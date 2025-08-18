# Real Estate CRM - All User Credentials

## Current Authentication System

The system uses **Mock Authentication** for easy access during development. No passwords are required - all access is automatic.

## All Available User Accounts

### 1. Platform Administrator (Level 1)
- **User ID**: `admin-1`
- **Email**: admin@aqaraty.com
- **Name**: مدير المنصة (Platform Admin)
- **Company**: منصة عقاراتي (AQARATY Platform)
- **Access Level**: Cross-account visibility and management
- **Tenant ID**: admin-1
- **Password**: Not required (Mock Auth)

### 2. Account Owner 1 (Level 2) 
- **User ID**: `owner-1`
- **Email**: ahmed@company1.com
- **Name**: أحمد الأحمد (Ahmed Al-Ahmad)
- **Company**: شركة الأحمد العقارية (Al-Ahmad Real Estate Company)
- **Access Level**: Company-wide access with sub-account management
- **Tenant ID**: owner-1
- **Max Seats**: 10
- **Used Seats**: 1
- **Password**: Not required (Mock Auth)

### 3. Account Owner 2 (Level 2)
- **User ID**: `owner-2`  
- **Email**: fatima@company2.com
- **Name**: فاطمة السالم (Fatima Al-Salem)
- **Company**: مؤسسة السالم للعقارات (Al-Salem Real Estate Foundation)
- **Access Level**: Company-wide access with sub-account management
- **Tenant ID**: owner-2
- **Max Seats**: 5
- **Used Seats**: 1
- **Password**: Not required (Mock Auth)

### 4. Sub-Account 1 (Level 3)
- **User ID**: `sub-1`
- **Email**: mohammed@company1.com
- **Name**: محمد الأحمد (Mohammed Al-Ahmad)
- **Company**: شركة الأحمد العقارية (Al-Ahmad Real Estate Company)
- **Access Level**: Limited access within company tenant
- **Tenant ID**: owner-1 (same as Account Owner 1)
- **Account Owner**: owner-1 (Ahmed Al-Ahmad)
- **Password**: Not required (Mock Auth)

### 5. Sub-Account 2 (Level 3)
- **User ID**: `sub-2`
- **Email**: khalid@company2.com  
- **Name**: خالد السالم (Khalid Al-Salem)
- **Company**: مؤسسة السالم للعقارات (Al-Salem Real Estate Foundation)
- **Access Level**: Limited access within company tenant
- **Tenant ID**: owner-2 (same as Account Owner 2)
- **Account Owner**: owner-2 (Fatima Al-Salem)
- **Password**: Not required (Mock Auth)

### 6. Original Mock User (Level 3)
- **User ID**: `mock-user-1`
- **Email**: user@example.com
- **Name**: مستخدم تجريبي (Test User)
- **Access Level**: Sub-account level access
- **Tenant ID**: 9ef3fe6e-8f92-4a2e-9d84-87bb448f6dde
- **Password**: Not required (Mock Auth)

## How to Test Different Users

### Option 1: Mock Authentication (Current)
Simply access the system - it automatically uses the mock user (mock-user-1). No login required.

### Option 2: Role-Based Authentication Testing
To test different user roles, send API requests with the header:
```
x-user-id: [USER_ID]
```

For example:
- `x-user-id: admin-1` - Platform admin access
- `x-user-id: owner-1` - Account Owner 1 access  
- `x-user-id: owner-2` - Account Owner 2 access
- `x-user-id: sub-1` - Sub-account under company 1
- `x-user-id: sub-2` - Sub-account under company 2

## Data Isolation Testing

- **admin-1** can see all data across all companies
- **owner-1** and **sub-1** only see data for tenant `owner-1`
- **owner-2** and **sub-2** only see data for tenant `owner-2`
- Each tenant has completely isolated data (leads, properties, deals, activities, messages)

## Current System Status

✅ **Active**: Mock authentication with full system access
✅ **Ready**: Role-based database schema with multi-tenant isolation
✅ **Available**: All 6 test user accounts created and ready
❌ **Not Active**: Actual login forms (can be enabled if needed)

All users are currently accessible through the mock authentication system without any login requirements.