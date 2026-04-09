---
tags: [plan, sessions, enhancements]
created: 2026-04-10
---

# Enhancement Plan E1–E20 — Baby Steps

> The web platform is feature-complete (~121K LOC, 78 tables, 57 routes, 91 pages). This plan enhances **every existing page** with specific frontend / backend / database improvements. Each session = one page, 3–5 enhancements.

## Status

| # | Page | Status | Note |
|---|---|---|---|
| E1 | Dashboard | ✅ Done | [[Sessions/E1 - Dashboard]] |
| E2 | Leads | ✅ Done | [[Sessions/E2 - Leads]] |
| E3 | Pipeline | ✅ Done | [[Sessions/E3 - Pipeline]] |
| E4 | Calendar | ⏳ Next | duration, conflicts, agenda sidebar |
| E5 | Activities | ⏳ | overdue, property link, outcomes |
| E6 | Tenants | ⏳ | renewal reminders, late payments |
| E7 | Properties list | ⏳ | days-on-market, map view, saved filters |
| E8 | Property detail | ⏳ | similar, price history, interested |
| E9 | Pool | ⏳ | match score, expiry countdown |
| E10 | Broker requests | ⏳ | timeline, share |
| E11 | Campaigns | ⏳ | analytics, A/B testing |
| E12 | Inbox | ⏳ | unread, search, labels |
| E13 | Settings | ⏳ | completion actions, activity log |
| E14 | Tools | ⏳ | save calcs, share, compare |
| E15 | Client portal | ⏳ | docs, history, rating |
| E16 | Landing/Map | ⏳ | featured, autocomplete, recent |
| E17 | Forum | ⏳ | images, categories, trending |
| E18 | Projects | ⏳ | progress, heatmap, milestones |
| E19 | Report builder | ⏳ | charts, export, schedule |
| E20 | Promotions | ⏳ | performance, budget alerts |

## Verification per session

1. `npx tsc --noEmit` — 0 errors
2. Page loads without crash
3. New API endpoints return correct data
4. UI renders correctly in RTL Arabic
