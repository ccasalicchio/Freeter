# Freeter 3 — Developer Features, Integrations & MCP Plan

Researched 2026-08-11 (sources: developer-productivity tool roundups and MCP
ecosystem guides; see PR description).

## A. High-value developer widgets (daily repeated tasks)

Ranked by usefulness-per-effort given Freeter's existing widget architecture:

1. **Git repo status widget** — branch, dirty files, ahead/behind for a repo path
   (project Root Folder default). Poll `git status --porcelain` via a new main-side
   exec IPC (reuse terminal/childProcess infra). Effort: M.
2. **CI status widget** — latest runs for a GitHub repo (GitHub REST, PAT in
   password vault). States: pass/fail/running with links. Effort: M.
3. **PR / issue list widget** — assigned/review-requested PRs (GitHub/Bitbucket
   API). Effort: M.
4. **HTTP monitor widget** — uptime/status-code pinger for dev/staging URLs
   (extends existing api-request widget with interval + history sparkline). Effort: S.
5. **Port/process watcher** — which dev servers are listening (netstat via main).
   Effort: S.
6. **Snippet runner** — code-snippet widget gains "run" (pipes to configured
   interpreter via commander infra). Effort: S.
7. **Cron/reminder widget** — lightweight scheduled reminders with desktop
   notifications. Effort: S.
8. **Clipboard-history search** — existing widget + the new find-in-page already
   covers most of this. Effort: none.

## B. Third-party integrations (via API keys stored in password vault)

- GitHub (CI, PRs, notifications) — highest demand
- Jira/Linear (assigned issues, transitions)
- Slack (unread counts, quick post) — webhook-based post is trivial
- Google Calendar / Outlook (today's agenda widget)
- n8n/Zapier webhooks — a generic "webhook button" widget (fire a POST with
  payload) covers unlimited automations cheaply. **Recommend building this
  first**: one small widget unlocks every integration platform.

## C. Freeter MCP server (AI ⇄ Freeter)

Goal: let AI clients (Claude Code/Desktop, etc.) read and manipulate the
dashboard directly.

**Transport**: streamable HTTP on `127.0.0.1:<port>` hosted by the main process
(a GUI app can't own stdio). Token auth: auto-generated bearer token shown in
Settings → a new "AI / MCP" tab; enable/disable toggle. Config snippet shown for
copy-paste into an MCP client.

**Tool surface (v1)**:
- `list_projects` / `list_workflows(project)` / `list_widgets(workflow)` — names,
  types, ids
- `read_note(widgetId)` / `write_note(widgetId, text)` (append or replace)
- `read_todo(widgetId)` / `add_todo_item(widgetId, text)` / `complete_todo_item`
- `create_widget(workflowId, type, name, settings)` — start with note/to-do/link
- `switch_project(projectId)` / `switch_workflow(workflowId)`
- `run_backup()` — trigger profile backup
- Resources: `freeter://state` (redacted app state), `freeter://note/{id}`

**Implementation sketch**: main-process module `infra/mcpServer` using
`@modelcontextprotocol/sdk` (server + streamable HTTP transport over Node http).
Widget data via existing appDataStorage/widgetDataStorageManager; state
mutations routed through the same JSON the renderer persists, with a
"reload-state" push to the renderer (same mechanism as profile import:
`window.location.reload()` after external writes, later replaced by granular
IPC events). Security: localhost bind only, bearer token, off by default.

**Effort**: L (own session). Prereq: none — storage APIs already exist.

## Suggested order
1. Webhook button widget (B) — S, unlocks n8n/Zapier/Slack
2. Git status widget (A1) — M
3. MCP server v1 (C) — L
4. CI status + PR list (A2/A3) — M each, share a GitHub auth setting
