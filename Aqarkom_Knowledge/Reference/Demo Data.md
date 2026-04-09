---
tags: [reference, demo, seed]
created: 2026-04-10
---

# Demo Data

The seed script (`apps/api/seed.ts`) populates the database with realistic Saudi-context demo data for screenshots, demos, and testing.

## What gets seeded

- 1 platform admin
- 3 organizations (different sizes)
- ~15 agents across the orgs (mix of CORP_AGENT, CORP_OWNER, INDIV_AGENT)
- ~50 customers with Saudi phone numbers
- ~80 leads in various stages
- ~40 listings across all 5 REGA categories
- Sample deals across pipeline stages
- Sample appointments, activities, contact log entries
- 1 chatbot conversation transcript
- A handful of buyer pool requests + claims

## Reset

```bash
npx tsx apps/api/seed.ts --reset
```

The `--reset` flag drops and re-seeds. **Do not run against production.**

## Cities

Demo data uses real Saudi cities: الرياض, جدة, الدمام, مكة, المدينة, الخبر, تبوك, أبها, الطائف.

## Related
- [[Reference/Useful Commands]]
- [[Reference/Admin Credentials]]
