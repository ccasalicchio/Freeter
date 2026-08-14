# MCP Actions — Gap Analysis, Spec and Plan

What the Freeter MCP server can do today, what's missing, and the order to
build the rest. Date: 2026-08-12.

## Current surface (22 tools)

**Read**: `list_projects`, `list_workflows` (incl. isArchived), `list_widgets`,
`get_widget` (full settings of any widget), `read_note`, `read_todo`, `search`,
`list_undo`.
**Write — structure**: `create_widget` (all 23 built-in types),
`update_widget` (rename + merge settings: links, tools, commands, everything),
`move_widget` (between tabs), `reorder_workflows`, `set_workflow_archived`.
**Write — content**: `write_note` (replace/append/prepend, markdown),
`add_todo_item`, `update_todo_item`, `delete_todo_item`, `reorder_todo_items`.
**Navigation**: `switch_project`, `switch_workflow`.
**Safety**: `undo` (20-deep, covers all MCP mutations, undo-of-undo = redo).

Non-tool surface on the same listener (added 2026-08-13): `POST
/ingest/{token}` — webhook alert ingest for the `alert-inbox` widget (path
token auth, no bearer; rate-limited, 64 KB cap; writes widget data outside
the undo stack) — and the `freeter:show-notification` IPC channel + main-side
`showDesktopNotification()` used by ingest for OS toasts. The
`freeter_show_notification` MCP *tool* itself is still Phase 3 (not shipped).

## Gaps → proposed tools

### Phase 1 — structure completion (safe, state-only; all undo-covered)
| Tool | Notes |
|---|---|
| `freeter_create_workflow(projectId, name)` | The only way to make a tab today is the UI. |
| `freeter_rename_workflow(workflowId, name)` | Trivial settings write. |
| `freeter_duplicate_workflow(workflowId)` | Copy layout + widgets (new ids); big time-saver for templated dashboards. |
| `freeter_delete_widget(widgetId)` | Safe now that undo exists; removes widget + layout item. |
| `freeter_resize_widget(widgetId, rect)` | Edit the layout rect (x, y, w, h) — lets AI tidy layouts, not just append at the bottom. |
| `freeter_create_project(name)` / `freeter_set_project_archived` / `freeter_rename_project` | Complete the project lifecycle (archive UI already exists). |

### Phase 2 — content breadth
| Tool | Notes |
|---|---|
| `freeter_read/write_snippet(widgetId)` | code-snippet widget content (same widget-data pattern as note). |
| `freeter_read/update_kanban(widgetId)` | Kanban cards/columns as JSON; enables "move card to Done" from AI. |
| `freeter_read_calendar / add_calendar_event` | Calendar widget events. |
| MCP **resources** | Expose notes/todos as MCP resources (`freeter://note/<id>`) so clients can subscribe/browse without tool calls. |

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
