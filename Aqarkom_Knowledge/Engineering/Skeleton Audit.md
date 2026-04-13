---
tags: [engineering, skeletons, ux, loading]
created: 2026-04-11
updated: 2026-04-13
---

# Skeleton Audit — All Platform Pages

Every platform sidebar page has a layout-accurate skeleton loading state using `useMinLoadTime(2000)`. Skeletons mirror the actual page structure (grids, cards, tables, charts, sidebars) so the transition to real content is seamless.

## Status: 25/25 pages compliant

| # | Page | Skeleton component | Match |
|---|---|---|---|
| 1 | Dashboard | `DashboardSkeleton` | 4 metrics + 2 chart rows + 2 list rows |
| 2 | Leads | `LeadsSkeleton` | Search + tabs + 7-col table |
| 3 | Pipeline | `PipelineSkeleton` | 4 stats + 5-col kanban |
| 4 | Activities | `ActivitiesSkeleton` | 5 stats + search + 8-row table |
| 5 | Tenants | `TenantsSkeleton` | 4 stats + card list |
| 6 | Inbox | `InboxSkeleton` | 2-panel: conversation list + chat area |
| 7 | Properties | `PropertiesGridSkeleton` | Toolbar + 3-col card grid |
| 8 | Post Listing | `PostListingSkeleton` | 4-step progress + form card |
| 9 | Pool | `PoolSkeleton` | 2 tabs + 4 stats + filter bar + table |
| 10 | Projects | `ProjectsSkeleton` | 5 stats + 3-col card grid |
| 11 | Calendar | `CalendarSkeleton` | 5 stats + week nav + 7-col grid |
| 12 | Broker Requests | `BrokerRequestsSkeleton` | 4 stats + search + filters + 3-col cards |
| 13 | Forum | `ForumSkeleton` | Channel sidebar + compose box + post cards |
| 14 | Notifications | `CampaignsSkeleton` | 4 stats + 6 tabs + suggestion cards |
| 15 | Mortgage | `MortgageSkeleton` | 2-col: inputs + results |
| 16 | ROI | `ROISkeleton` | 2 tabs + 2-col: inputs + results |
| 17 | Reports | `ReportsSkeleton` | Filter bar + 4 metrics + 6 tabs + charts |
| 18 | Report Builder | `ReportBuilderSkeleton` | 3-col: controls + results |
| 19 | Team | `TeamPageSkeleton` | 6 tabs + 8 stats + health/leaderboard + chart/list |
| 20 | Settings | `SettingsSkeleton` | Profile card + sidebar nav + form content |
| 21 | Compare | `CompareSkeleton` | 3-col property cards |
| 22 | Saved Searches | `SavedSearchesSkeleton` | Vertical card stack |
| 23 | Favorites | `FavoritesSkeleton` | 3-col listing cards |
| 24 | Clients | `ClientDetailSkeleton` | 3 stats + sidebar + detail |
| 25 | Marketing Board | `PromotionsSkeleton` | 5 stats + promotion cards |

## Convention

```tsx
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { SomePageSkeleton } from "@/components/skeletons/page-skeletons";

export default function SomePage() {
  const showSkeleton = useMinLoadTime();
  const { data, isLoading } = useQuery({ ... });

  if (isLoading || showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="Same title as loaded page" />
        <SomePageSkeleton />
      </div>
    );
  }
  // ... loaded content
}
```

## All skeletons live in
`apps/web/src/components/skeletons/page-skeletons.tsx`

## Related
- [[Architecture/Frontend Structure]]
- `/audit-skeleton` skill — re-run to verify compliance
