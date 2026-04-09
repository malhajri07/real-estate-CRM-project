---
tags: [feature, marketing, whatsapp, campaigns]
created: 2026-04-10
---

# Marketing & Campaigns

## Capabilities

- **Bulk WhatsApp/SMS campaigns** to lead/customer segments
- **Two-way inbox** — inbound replies threaded into conversations
- **Templates** with Arabic placeholders (`{{name}}`, `{{property}}`)
- **Delivery + open + response tracking** per recipient

## Page

`apps/web/src/pages/platform/notifications/index.tsx` (campaign management)
`apps/web/src/pages/platform/inbox/index.tsx` (two-way conversations)

## Segments

Built from filters across:
- Lead status (NEW, QUALIFIED, ...)
- Source
- City
- Budget range
- Property type interest
- Last contact date

## Sending pipeline

```
Compose → Select segment → Preview recipients → Schedule/send → Track delivery
```

Backed by Unifonic / Twilio adapter under `apps/api/lib/messaging/`.

## Webhook

Inbound WhatsApp messages hit `/api/webhooks/whatsapp` → matched to a `customer` by phone → appended to `messages` table → surfaces in inbox.

## Planned (E11)
- Per-recipient delivery detail
- A/B message variants
- Weekly trend chart

## Related
- [[Features/Chatbot]]
- [[Features/CRM Core]]
