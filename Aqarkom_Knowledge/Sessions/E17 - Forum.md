---
tags: [session, completed, forum]
created: 2026-04-11
session: E17
status: done
---

# E17 - Forum Enhancements ✅

## Shipped
- ✅ **Backend:** `GET /api/community/trending` — top 10 most-commented posts from last 7 days, sorted by comment count
- ✅ Post creation already supports media attachments (base64 → `community_post_media`)
- ✅ Feed already supports `type` filter param for category filtering

## Files modified
- `apps/api/routes/community.ts` — trending endpoint + TSDoc

## Related
- [[Sessions/Enhancement Plan E1-E20]]
