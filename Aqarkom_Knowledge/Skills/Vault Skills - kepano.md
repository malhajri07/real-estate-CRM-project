---
tags: [skill, vault, kepano, reference]
created: 2026-04-10
source: https://github.com/kepano/obsidian-skills
---

# Vault Management Skills (kepano/obsidian-skills)

5 official Obsidian-aware skills from [Steph Ango (kepano)](https://github.com/kepano), the creator of Obsidian. These extend Claude with the ability to write valid Obsidian Flavored Markdown, work with Bases and Canvas files, and run Obsidian CLI commands.

**Source:** https://github.com/kepano/obsidian-skills (MIT)
**Author:** Steph Ango — https://stephango.com/

## Why these matter

Claude Code defaults to plain CommonMark/GFM. These skills teach it the **Obsidian-specific** extensions:
- Wikilinks (`[[Note]]`), aliases (`[[Note|alias]]`), block refs (`[[Note#^id]]`)
- Embeds (`![[Note]]`, `![[image.png]]`, `![[file.pdf]]`)
- Callouts (`> [!note]`, `> [!warning]`)
- Properties (frontmatter with the right types)
- Bases (`.base` database files)
- Canvas (`.canvas` JSON visual diagrams)
- Defuddle (clean web extraction)

Without these skills, Claude often produces markdown that *almost* works in Obsidian but breaks links or callouts.

## The 5 skills

| Skill | When Claude should use it |
|---|---|
| [[Skills/obsidian-markdown\|/obsidian-markdown]] | Any time it's writing/editing a `.md` file in this vault |
| [[Skills/obsidian-bases\|/obsidian-bases]] | Working with `.base` files (Obsidian's database views) |
| [[Skills/json-canvas\|/json-canvas]] | Working with `.canvas` files (visual diagrams, mind maps) |
| [[Skills/obsidian-cli\|/obsidian-cli]] | Driving Obsidian via CLI — useful for plugin/theme dev or batch vault ops |
| [[Skills/defuddle\|/defuddle]] | Extracting clean markdown from a web URL (instead of `WebFetch`) |

## Installation layout

```
Aqarkom_Knowledge/.claude/                ← canonical install (per kepano README)
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── skills/
│   ├── obsidian-markdown/SKILL.md  + references/
│   ├── obsidian-bases/SKILL.md     + references/
│   ├── obsidian-cli/SKILL.md
│   ├── json-canvas/SKILL.md        + references/
│   └── defuddle/SKILL.md
├── LICENSE
└── README.md

.claude/skills/                            ← project mirror (so Claude Code finds them)
├── obsidian-markdown/
├── obsidian-bases/
├── obsidian-cli/
├── json-canvas/
└── defuddle/
```

The vault copy is the **canonical source** — if you update from upstream (`git pull` from kepano), update the vault first, then `cp -r` to the project mirror.

## How they fit with the 22 project skills

The 22 project skills (`/add-page`, `/typecheck`, etc.) are for **building the Aqarkom application**.

These 5 kepano skills are for **managing the knowledge vault** — a different surface. They don't conflict; they fill the gap of "Claude needs to write better Obsidian markdown when updating the vault."

In practice you'll see them activate **automatically** when:
- Claude updates a `Features/`, `Architecture/`, or `Sessions/` note → `/obsidian-markdown` kicks in to ensure wikilinks and callouts are correct
- The user asks "make a canvas of the data model" → `/json-canvas` produces a `.canvas` file
- The user shares a URL → `/defuddle` extracts cleaner markdown than `WebFetch`

## Updating from upstream

```bash
# Re-pull the latest
git clone --depth 1 https://github.com/kepano/obsidian-skills /tmp/obsidian-skills-update

# Copy fresh into the canonical vault location
rm -rf Aqarkom_Knowledge/.claude/skills/{obsidian-markdown,obsidian-bases,obsidian-cli,json-canvas,defuddle}
cp -r /tmp/obsidian-skills-update/skills/* Aqarkom_Knowledge/.claude/skills/

# Mirror to the project skills directory
rm -rf .claude/skills/{obsidian-markdown,obsidian-bases,obsidian-cli,json-canvas,defuddle}
cp -r /tmp/obsidian-skills-update/skills/{obsidian-markdown,obsidian-bases,obsidian-cli,json-canvas,defuddle} .claude/skills/
```

## License

MIT — Steph Ango. See `Aqarkom_Knowledge/.claude/LICENSE`.
