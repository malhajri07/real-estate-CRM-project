---
tags: [session, completed, inbox]
created: 2026-04-11
session: E12
status: done
---

# E12 - Inbox Enhancements ✅

**Page:** `apps/web/src/pages/platform/inbox/index.tsx`

## Shipped

- ✅ **Database:** `conversation_labels` table (conversationKey, agentId, label) with unique constraint
- ✅ **Backend:** Labels included in GET /api/inbox conversation list response
- ✅ **Backend:** `GET /api/inbox/search?q=text` — search message content across conversations
- ✅ **Backend:** `POST /api/inbox/:key/label` + `DELETE /api/inbox/:key/label/:label` — label CRUD
- ✅ **Backend:** Conversations sorted: unread first, then by recency
- ✅ **Frontend:** Search bar at top of conversation list (filters by name, content, phone)
- ✅ **Frontend:** Label filter badges: click to filter by label (toggle on/off)
- ✅ **Frontend:** Label tags displayed on each conversation row (color-coded)
- ✅ **Frontend:** 3 label options with colors: عميل ساخن (red), متابعة (orange), مكتمل (green)

## Files modified
- `data/schema/prisma/schema.prisma` — conversation_labels model
- `apps/api/routes/inbox.ts` — labels in list, search endpoint, label CRUD, sort by unread
- `apps/web/src/pages/platform/inbox/index.tsx` — search, label filter, label badges, type extension

## Related
- [[Features/Marketing & Campaigns]]
- [[Plans/Enhancement Plan E1-E20]]
