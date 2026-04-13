---
tags: [history, moc, index]
created: 2026-04-10
---

# 📜 History — Map of Content

Everything we've **changed**, **discussed**, or **decided** about Aqarkom — pulled from git, Claude transcripts, and the claude-mem plugin — in one navigable place.

## Sources

| Source | What it captures | Status |
|---|---|---|
| **Git history** | Every commit landed on `main` | ✅ 487 commits, 8 months |
| **Claude transcripts (`.jsonl`)** | Every prompt the user sent + every tool the agent ran | ✅ 3 sessions imported |
| **claude-mem** | AI-summarized observations from past sessions | ⚠️ Empty — see [[History/Claude-Mem Status]] |

## Top-level

- 🗓️ **[[History/Timeline]]** — unified view: commits + sessions on one axis
- 🔁 **[[History/Changelog/Index]]** — month-by-month commit log
- 💬 **[[History/Conversations/Index]]** — per-session prompt + tool retros
- 🤖 **[[History/Claude-Mem Status]]** — claude-mem inspection

## How to keep this fresh

After any meaningful work session:

1. **Commit** your changes (they'll show up next time `git log` is dumped).
2. **Re-run extraction** — the simplest path is to re-run the Python blocks from the chat that built this folder, or:

   ```bash
   # Quick refresh: append latest commits to the current month's note
   git log --since="$(date -v-30d +%Y-%m-%d)" \
     --pretty=format:'- `%h` **%ad** — %s' --date=format:'%Y-%m-%d'
   ```

3. **For new transcripts**, list new `.jsonl` files in `~/.claude/projects/-Users-mohammedalhajri-real-estate-CRM-project/` and add a new `Session NN - YYYY-MM-DD.md` note.

## Related
- [[Home]]
- [[Plans/Enhancement Plan E1-E20]]
- [[Decisions/ADR Index]]
