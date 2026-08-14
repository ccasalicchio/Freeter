# MCP Actions — Gap Analysis, Spec and Plan

What the Freeter MCP server can do today, what's missing, and the order to
build the rest. Date: 2026-08-12.

## Current surface (37 tools + 2 resource templates)

**Read**: `list_projects`, `list_workflows` (incl. isArchived), `list_widgets`,
`get_widget` (full settings of any widget), `read_note`, `read_todo`,
`read_snippet`, `read_kanban`, `read_calendar`, `search`, `list_undo`.
**Write — structure**: `create_widget` (all 23 built-in types),
`update_widget` (rename + merge settings: links, tools, commands, everything),
`move_widget` (between tabs), `resize_widget` (layout rect),
`delete_widget` (undo restores fully; widget content is kept),
`reorder_workflows`, `set_workflow_archived`, `create_workflow`,
`rename_workflow`, `duplicate_workflow` (clones widgets + copies widget
content), `create_project`, `rename_project`, `set_project_archived`.
**Write — content**: `write_note` (replace/append/prepend, markdown),
`add_todo_item`, `update_todo_item`, `delete_todo_item`, `reorder_todo_items`,
`write_snippet` (code + optional language setting), `add_kanban_card`,
`move_kanban_card` (column by index or name, optional position),
`update_kanban_card` (title/description/color), `add_calendar_event`.
**Resources**: `freeter://note/{widgetId}` (text/markdown) and
`freeter://todo/{widgetId}` (application/json) resource templates whose list
handlers enumerate every note / to-do widget across projects (named
"Project / Workflow / Widget").
**Navigation**: `switch_project`, `switch_workflow`.
**Safety**: `undo` (20-deep, covers all MCP mutations, undo-of-undo = redo).

Non-tool surface on the same listener (added 2026-08-13): `POST
/ingest/{token}` — webhook alert ingest for the `alert-inbox` widget (path
token auth, no bearer; rate-limited, 64 KB cap; writes widget data outside
the undo stack) — and the `freeter:show-notification` IPC channel + main-side
`showDesktopNotification()` used by ingest for OS toasts. The
`freeter_show_notification` MCP *tool* itself is still Phase 3 (not shipped).

## Gaps → proposed tools

### Phase 1 — structure completion (safe, state-only; all undo-covered) — SHIPPED 2026-08-13
| Tool | Notes |
|---|---|
| `freeter_create_workflow(projectId, name)` | ✅ Shipped 2026-08-13. New empty tab, made current. |
| `freeter_rename_workflow(workflowId, name)` | ✅ Shipped 2026-08-13. |
| `freeter_duplicate_workflow(workflowId)` | ✅ Shipped 2026-08-13. Clones layout + widget entities (new ids) and copies widget data via `widgetDataStorageManager.copyObjectData`; undo restores structure, copied content files stay as harmless orphans. |
| `freeter_delete_widget(widgetId)` | ✅ Shipped 2026-08-13. Removes widget + layout item (and shelf entry); stored content kept so undo restores fully. |
| `freeter_resize_widget(widgetId, rect)` | ✅ Shipped earlier (before this batch). |
| `freeter_create_project(name)` / `freeter_set_project_archived` / `freeter_rename_project` | ✅ Shipped 2026-08-13. |

### Phase 2 — content breadth — SHIPPED 2026-08-13
| Tool | Notes |
|---|---|
| `freeter_read_snippet / write_snippet(widgetId, code, language?)` | ✅ Shipped 2026-08-13. Code is widget data (key `code`, plain text, same pattern as note); the language lives in widget SETTINGS, so passing `language` writes via the app state (own undo entry "set snippet language"). |
| `freeter_read_kanban / add_kanban_card / move_kanban_card / update_kanban_card` | ✅ Shipped 2026-08-13. Real data model: flat `{cards: [{id, title, description, color, columnIdx}], nextCardId}` under key `kanban`; column NAMES are widget settings (`columns`, default To Do/In Progress/Done) referenced by index. Tools accept columns by index or name; move supports optional position (clamped); no per-card done flag — "done" = move to the Done column. `update_kanban` from the plan became the three per-card tools. |
| `freeter_read_calendar / add_calendar_event(widgetId, date, title, description?)` | ✅ Shipped 2026-08-13. Data model: `{events: [{id, title, date: 'YYYY-MM-DD', description}], nextEventId}` under key `events`; all-day events only (no time-of-day field), date validated as a real calendar day. |
| MCP **resources** | ✅ Shipped 2026-08-13. `freeter://note/{widgetId}` (text/markdown) + `freeter://todo/{widgetId}` (application/json) via `registerResource` + `ResourceTemplate`; list callbacks enumerate all note/to-do widgets across projects as "Project / Workflow / Widget". |

### Phase 3 — action execution (OPT-IN; separate setting)
These make external things happen, so they ship behind a new toggle in
Settings → AI ("Allow AI to trigger actions", default OFF), checked per call:
| Tool | Notes |
|---|---|
| `freeter_trigger_webhook(widgetId)` | Fire a webhook-button exactly as configured. |
| `freeter_open_link(widgetId, urlIndex?)` | Open a link-opener's URL(s) in the configured browser. |
| `freeter_run_commander(widgetId)` | Run a commander's command lines in a terminal. Highest risk — consider a per-widget "AI may run this" checkbox instead of one global toggle. |
| `freeter_show_notification(title, body)` | Desktop toast (shared IPC with the monitoring plan's alert ingest). |
| `freeter_backup_now()` | Trigger the auto-backup routine on demand. |

### Phase 4 — quality of life
- `freeter_get_app_info()` — version, theme, data dir, current project/workflow in one call.
- `freeter_set_theme(themeId)` — switch theme.
- Batch variant of `update_widget` (array input) if tool-call round-trips prove slow in practice.
- Undo hardening: persist the stack to disk (survive restarts); conflict guard that warns when the state changed since the undone op (hash compare) instead of silently clobbering manual edits.

## Security model (decided)
- Read/structure/content tools: token-auth only, as today. All mutations undo-covered.
- Action-execution tools: additional opt-in setting; commander execution additionally per-widget opt-in. Rationale: an exfiltrated token must not become arbitrary command execution.
- Secrets in widget settings (github tokens, vault entries): `get_widget` REDACTS keys named token/password/secret (mask to `***`), and `update_widget` accepts writes to them. Password-vault widgets are excluded from get/update entirely. **(Phase 1 hardening, do first.)**

## Open questions (defaults chosen)
1. Delete tools for workflows/projects — **not planned**; archive covers the need, delete stays UI-only.
2. Undo depth 20, memory-only — revisit in Phase 4.
3. Resources vs tools for content — tools first (universal client support), resources in Phase 2.
