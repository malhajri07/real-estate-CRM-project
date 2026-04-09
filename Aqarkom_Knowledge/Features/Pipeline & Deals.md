---
tags: [feature, pipeline, deals, kanban]
created: 2026-04-10
---

# Pipeline & Deals

Visual Kanban board where agents drag deals through stages.

## Page

`apps/web/src/pages/platform/pipeline/index.tsx`

## Stages & probabilities

| Stage | Probability | Forecast bucket |
|---|---|---|
| `NEW` | 10% | At risk if > 30d |
| `QUALIFIED` | 25% | At risk if > 30d |
| `NEGOTIATION` | 40% | "Stuck deal" alert if > 30d |
| `UNDER_OFFER` | 70% | On track |
| `WON` | 100% | — |
| `LOST` | 0% | — |

## Drag & drop

- **`@hello-pangea/dnd`** for the board
- On drop: optimistic update → `PATCH /api/deals/:id` with new `stage`
- Backend writes to `deal_stage_history` and updates `deals.stageEnteredAt`

## Stage age badges

Calculated as `now - stageEnteredAt`:
- `< 14d` — no badge
- `14–30d` — warning outline
- `> 30d` — destructive (red)

## Forecast endpoint

`GET /api/deals/forecast` returns:
```json
{
  "onTrack": 5_200_000,
  "atRisk": 1_100_000,
  "lost": 800_000,
  "byStage": { "NEW": ..., "NEGOTIATION": ... }
}
```

Computed as `Σ agreedPrice × stageProbability`, splitting `onTrack` vs `atRisk` by `stageAge > 30d`.

## Customer dropdown scope

Customer dropdown shows **only the agent's own leads**, not all org leads:
```ts
const leads = allLeads.filter((l) => l.agentId === user.id);
```

## Related
- [[Features/CRM Core]]
- [[Sessions/E3 - Pipeline]]
