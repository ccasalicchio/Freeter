# Freeter 3 — Sprint Backlog

Pending work, verified against the code and git on 2026-11-27. Sources:
ROADMAP.md (pending section), docs/mcp-actions-plan.md, docs/monitoring-integrations-plan.md,
docs/developer-features-and-mcp-plan.md, v3-plan.md. ROADMAP.md's status section is stale
(2026-08-12) and is itself a backlog item.

## Release hygiene
- [x] Merge upgrade/v3-roadmap into master — already done via PRs #19-#28 (2026-08-12..14); filed in error from a stale local ref
- [ ] Refresh ROADMAP.md status to match shipped work (monitoring A-C, MCP phases 1-2, port watcher, reminders, shelf bulk-pin, favicon cache)
- [ ] Auto-update wiring: electron-updater + GitHub release channel (publish config exists, unused)
- [ ] MSI code signing (blocked: needs purchased certificate)

## Security
- [ ] safeStorage widget API module: encrypt-on-save / decrypt-on-use for token settings
- [ ] Migrate token fields to safeStorage in github-ci, github-prs, grafana-alerts, grafana-panel, prometheus-stat, json-stat, alert-inbox
- [ ] Profile export excludes decrypted secrets (exports encrypted blob, documented as non-portable)

## MCP Phase 3 — opt-in action execution
- [ ] Settings -> AI "Allow AI to trigger actions" toggle (default off), checked per call
- [ ] MCP tools: freeter_trigger_webhook, freeter_open_link, freeter_show_notification, freeter_backup_now
- [ ] MCP tool: freeter_run_commander with per-widget "AI may run this" opt-in

## MCP Phase 4 — quality of life
- [ ] MCP tools: freeter_get_app_info, freeter_set_theme
- [ ] MCP tool: freeter_read_monitors (status of all monitor-type widgets)
- [ ] MCP undo hardening: persist stack to disk + conflict guard (hash compare)

## Monitoring long tail (Phase D)
- [ ] Loki logs tail widget (LogQL query_range, tail-follow)
- [ ] Uptime Kuma + Healthchecks.io status tiles
- [ ] InfluxDB v2 (Flux) stat widget

## Developer widgets
- [ ] Code Snippet "Run" via configured interpreter (dev plan A6)

## Browser widget (Phase 6 remainder)
- [ ] Browser widget downloads panel
- [ ] Browser widget reader mode

## Application (Phase 9-11 remainder)
- [ ] Multi-window (open a project in its own window)
- [ ] Plugin discovery (Phase 10)
- [ ] Make Playwright E2E real for Electron (currently non-functional scaffolding)
