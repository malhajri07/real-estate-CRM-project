---
tags: [reference, demo, seed]
created: 2026-04-10
---

# Demo Data

The seed script (`apps/api/seed.ts`) populates the database with realistic Saudi-context demo data for screenshots, demos, and testing.

## What gets seeded

- 1 platform admin (username: `admin`, password: `admin123`)
- 102 organizations (20 real Saudi company names × 5 each + 2 special)
- ~1,003 corporate users: **1 CORP_OWNER + 9 CORP_AGENT per org** (password: `agent123`)
- 50 individual agents (INDIV_AGENT, password: `agent123`)
- ~50 customers with Saudi phone numbers
- ~80 leads in various stages
- ~40 listings across all 5 REGA categories
- Sample deals across pipeline stages
- Sample appointments, activities, contact log entries
- 1 chatbot conversation transcript
- A handful of buyer pool requests + claims

## Role distribution per org

Each organization follows a realistic structure:
- **1 CORP_OWNER** — the earliest-created member (the "founder")
- **9 CORP_AGENT** — team members

The seed script tracks this with `orgHasOwner` Set — first agent per org gets CORP_OWNER, rest get CORP_AGENT.

## Reset

```bash
npx tsx apps/api/seed.ts --reset
```

The `--reset` flag drops and re-seeds. **Do not run against production.**

## Cities

Demo data uses real Saudi cities: الرياض, جدة, الدمام, مكة, المدينة, الخبر, تبوك, أبها, الطائف.

## Related
- [[Runbooks/Useful Commands]]
- [[Reference/Admin Credentials]]
