---
tags: [feature, chatbot, ai]
created: 2026-04-10
---

# Chatbot

Conversational property search bot — captures leads from website/landing visitors and matches them to active inventory.

## Capabilities

- Property search by city, type, budget, bedrooms
- Conversation branching (collects criteria step-by-step)
- Automatic lead creation on conversation completion
- Hand-off to a human agent (creates `chatbot_handoff` record)

## Storage

- `chatbot_conversations` — session, messages array, captured criteria
- `chatbot_handoffs` — when a user requests a human

## Lead source tagging

Conversations that convert produce leads with `source = CHATBOT` (purple badge in [[Features/CRM Core|leads table]]).

## API

- `POST /api/chatbot/message` — append user message, get bot response
- `POST /api/chatbot/handoff` — escalate to agent

## Related
- [[Features/CRM Core]]
- [[Features/Marketing & Campaigns]]
