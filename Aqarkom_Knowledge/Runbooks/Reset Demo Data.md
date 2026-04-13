---
tags: [runbook, operations, database, seed]
created: 2026-04-13
updated: 2026-04-13
---

# Reset Demo Data

## When to use
After a schema change, corrupted data, or when you need a fresh start for screenshots/demos.

## Prerequisites
- [ ] PostgreSQL running locally
- [ ] No production connection string in `.env`

## Steps

### 1. Run the seed script
```bash
npx tsx apps/api/scripts/seed-full-data.ts
```

### 2. Verify the data
```bash
psql "postgresql://mohammedalhajri@localhost:5432/real_estate_crm" -c "
SELECT 
  (SELECT count(*) FROM users) as users,
  (SELECT count(*) FROM organizations) as orgs,
  (SELECT count(*) FROM leads) as leads,
  (SELECT count(*) FROM properties) as properties,
  (SELECT count(*) FROM deals) as deals;"
```

### 3. Verify role distribution
Each org should have exactly 1 CORP_OWNER:
```bash
psql "postgresql://mohammedalhajri@localhost:5432/real_estate_crm" -c "
SELECT COUNT(*) as correct_orgs FROM (
  SELECT o.id, COUNT(*) FILTER (WHERE u.roles LIKE '%CORP_OWNER%') as owners
  FROM organizations o JOIN users u ON u.\"organizationId\" = o.id
  GROUP BY o.id HAVING COUNT(*) FILTER (WHERE u.roles LIKE '%CORP_OWNER%') = 1
) sub;"
```

## Login credentials after reset
| User | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Corp Owner | `corp_agent_1` | `agent123` |
| Corp Agent | `corp_agent_101` | `agent123` |
| Individual | `indiv_agent_1` | `agent123` |

## Related
- [[Reference/Demo Data]]
- [[Reference/Admin Credentials]]
