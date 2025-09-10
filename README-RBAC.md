# Real Estate CRM - RBAC + ABAC System

A comprehensive Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) system for a real estate platform with multi-tenant support.

## 🏗️ Architecture

### Stack
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **ORM**: Prisma
- **Authentication**: JWT with role claims
- **Authorization**: RBAC + ABAC with PostgreSQL RLS policies

### Key Features
- ✅ **6 User Roles** with granular permissions
- ✅ **Multi-tenant** organization support
- ✅ **Buyer Pool** with claim workflow
- ✅ **Contact Masking** until claims are made
- ✅ **Rate Limiting** for claims and cooldowns
- ✅ **Audit Logging** for all sensitive operations
- ✅ **PostgreSQL RLS** for database-level security
- ✅ **Comprehensive API** with proper validation

## 👥 User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **WEBSITE_ADMIN** | Platform owner/admin | Full system access, user management, impersonation |
| **CORP_OWNER** | Corporate account owner | Manage organization, agents, view org data |
| **CORP_AGENT** | Licensed agent under corporate | Manage properties, claim buyer requests, view org data |
| **INDIV_AGENT** | Independent licensed agent | Manage properties, claim buyer requests |
| **SELLER** | Individual property seller | Manage seller submissions, view own leads |
| **BUYER** | Individual property buyer | Manage buyer requests, view own claims |

## 🏢 Multi-Tenancy

- **Global Scope**: WEBSITE_ADMIN can access all data
- **Organization Scope**: Corporate users can only access their organization's data
- **Individual Scope**: Independent agents and customers can only access their own data
- **Enforced by**: PostgreSQL RLS policies + server-side middleware

## 🔐 Security Model

### RBAC (Role-Based Access Control)
- Users have one or more roles
- Each role has specific permissions
- Permissions are checked at API level

### ABAC (Attribute-Based Access Control)
- **Ownership**: Users can only access their own resources
- **Tenancy**: Corporate users can only access their organization's data
- **Territory**: Agents can only work in their licensed territories
- **Status**: Resources have visibility based on status (active, claimed, etc.)
- **Time-based**: Claims expire after 72 hours

### Database Security
- **Row-Level Security (RLS)** enabled on all tables
- **Policies** enforce access control at database level
- **Audit logging** tracks all sensitive operations

## 🎯 Buyer Pool & Claim Workflow

### How It Works
1. **Buyers** create requests with masked contact information
2. **Agents** search the buyer pool (see masked contact only)
3. **Agents** claim buyer requests (exclusive 72-hour window)
4. **Full contact** details are revealed to claiming agent
5. **Leads** are automatically created for claimed requests
6. **Contact logs** are required for all outreach
7. **Claims expire** automatically or can be released manually

### Rate Limits
- **Max 5 active claims** per agent
- **Max 3 claims per buyer** per 24 hours
- **72-hour claim expiry** with auto-release
- **24-hour cooldown** between claims on same buyer

## 📊 Database Schema

### Core Entities
- `users` - User accounts with roles and organization membership
- `organizations` - Corporate entities with licensing
- `agent_profiles` - Agent licensing and territory information
- `properties` - Real estate properties
- `listings` - Property listings (rent/sale)
- `buyer_requests` - Buyer requirements with masked contact
- `seller_submissions` - Seller property submissions
- `leads` - Sales leads from claims
- `claims` - Exclusive buyer request claims
- `contact_logs` - Agent outreach tracking
- `audit_logs` - System audit trail
- `file_assets` - File uploads with ownership

### Key Relationships
- Users belong to organizations (nullable for individuals)
- Agents have profiles with licensing and territories
- Properties belong to agents and organizations
- Claims create leads and reveal contact information
- All operations are audit logged

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- npm or yarn

### Setup
1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up database**:
   ```bash
   ./scripts/setup-db.sh
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Environment Variables
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/realestate_rbac"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

## 🔑 Test Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Website Admin | admin@aqaraty.com | admin123 | Full system access |
| Corporate Owner | owner1@riyadh-realestate.com | owner123 | Manages Riyadh Real Estate |
| Corporate Agent | agent1@riyadh-realestate.com | agent123 | Works for Riyadh Real Estate |
| Individual Agent | indiv1@example.com | agent123 | Independent agent in Dammam |
| Seller | seller1@example.com | seller123 | Property seller |
| Buyer | buyer1@example.com | buyer123 | Property buyer |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/impersonate` - Admin impersonation
- `POST /api/auth/logout` - User logout

### Buyer Pool
- `GET /api/pool/buyers/search` - Search buyer requests (masked)
- `POST /api/pool/buyers/:id/claim` - Claim buyer request
- `POST /api/pool/buyers/:id/release` - Release claim
- `GET /api/pool/buyers/my-claims` - Get agent's active claims

### Properties & Listings
- `GET /api/properties` - List properties (with RLS)
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Organizations & Users
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/users` - List users (with RLS)
- `POST /api/users` - Create user
- `POST /api/users/:id/roles` - Assign roles

## 🛡️ Security Features

### Authentication
- JWT tokens with role claims
- Password hashing with bcrypt
- Session management
- Admin impersonation capability

### Authorization
- Role-based permissions
- Organization-based access control
- Resource ownership validation
- Territory-based restrictions

### Data Protection
- Contact information masking
- Encrypted sensitive data
- Audit logging
- Rate limiting

### Database Security
- Row-Level Security policies
- Encrypted connections
- Parameterized queries
- Access logging

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run e2e
```

### Test Scenarios
1. **Agent claims buyer request** → sees full contact → logs outreach → releases claim
2. **Corporate owner invites agent** → agent accepts → agent sees only org data
3. **Cross-tenant access attempt** → denied by API + RLS

## 📈 Monitoring & Auditing

### Audit Logs
All sensitive operations are logged with:
- User ID and roles
- Action performed
- Entity and entity ID
- Before/after state
- IP address and user agent
- Timestamp

### Metrics
- Active claims per agent
- Claim conversion rates
- User activity patterns
- System performance metrics

## 🔧 Development

### Database Migrations
```bash
npx prisma migrate dev --name migration_name
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Reset Database
```bash
npx prisma migrate reset
```

### Seed Database
```bash
npx tsx server/seed-rbac.ts
```

## 🚀 Production Deployment

### Environment Setup
1. Set up PostgreSQL with SSL
2. Configure environment variables
3. Run database migrations
4. Set up monitoring and logging
5. Configure rate limiting
6. Set up backup procedures

### Security Checklist
- [ ] Change default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Enable audit logging
- [ ] Test backup procedures
- [ ] Review RLS policies
- [ ] Validate rate limits

## 📚 Documentation

### API Documentation
- OpenAPI spec available at `/api/docs`
- Interactive Swagger UI
- Request/response examples
- Authentication requirements

### Database Documentation
- Prisma schema with relationships
- RLS policy explanations
- Index optimization guide
- Backup and recovery procedures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases
- Contact the development team

---

**Built with ❤️ for the real estate industry**
