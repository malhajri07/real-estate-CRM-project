---
tags: [history, claude-mem, status]
created: 2026-04-10
---

# claude-mem Status

The **claude-mem** plugin is installed and running, but as of 2026-04-10 it has produced no persistent observations or session summaries for this project.

## Inspection result

Database: `~/.claude-mem/claude-mem.db`

| Table | Row count |
|---|---|
| `sdk_sessions` | 1 (current session) |
| `observations` | 0 |
| `session_summaries` | 0 |
| `user_prompts` | 0 |
| `pending_messages` | 0 |

The worker is running and intercepting `PostToolUse` hooks (visible in `~/.claude-mem/logs/`), but no observations have been generated yet — the summarization pipeline (which calls Claude to compress tool activity into facts/narratives) has not produced output for this project.

## Why nothing is recorded

claude-mem only writes observations once a session ends or hits a synthesis trigger. Sessions on this project have so far been long-running and were terminated abruptly (compaction or `stop`), so the worker never reached the summarization step that persists rows.

## What we have instead

The raw, unsummarized truth is in:
- **Git history** → captured in [[History/Changelog/Index]]
- **Claude transcripts (`.jsonl`)** → captured in [[History/Conversations/Index]]
- **In-repo auto-memory** → at `~/.claude/projects/-Users-mohammedalhajri-real-estate-CRM-project/memory/`

If claude-mem starts producing observations later, dump them with:

```bash
sqlite3 ~/.claude-mem/claude-mem.db \
  "SELECT created_at, title, narrative FROM observations \
   WHERE project LIKE '%real-estate-CRM%' ORDER BY created_at_epoch;"
```

…and re-import into [[History/Index|History MOC]].
