# Freeter Roadmap

High-level milestone view for the Freeter v3 upgrade.

---

## Status — updated 2026-08-12

### ✅ Done (verified working in the installed app; all merged to `master`)

**Stability & infrastructure**
- Packaged app starts and renders (fixed the electron-vite migration drift: icon
  paths, dev-mode detection, preload path, missing deps, missing build defines,
  init wiring, CSS-module access) — Windows MSI builds, installs, runs
- "Freeter 3" identity: own name, userData, single-instance lock and data dir
  (`appData/freeter3`) with one-time migration — v1, v2 and v3 run side-by-side
- Diagnostics: app log (`freeter-data/logs/freeter.log`), Windows Event Log
  reporting, fatal-error dialogs, renderer failure capture
- Test suite repaired: Vitest projects, jest→vi migration — 231 files /
  1359 tests green (was fully broken since May)
- Tabbed Application Settings (General / Appearance / Backup)
- Auto-backup: daily + on-close profile backups to a chosen folder (Browse…)
- Launch at OS startup setting

**Freeter 1 migration**
- `.freeterdata` importer (File → Import Profile, auto-detected): projects,
  tabs, widgets, layouts, note contents, to-dos, link icons
- Global pools import as a "Freeter 1 Library" project (Links / Commands /
  Searches / Timers / Tools); engine-id mapping, `site:` scopes, tools become
  App Launcher tiles

**Theming & icons**
- 8 themes + Auto (match OS, the default); Theme Editor (per-color overrides)
- Icon gallery: ~224 glyphs (IcoMoon-Free, Tabler, Bootstrap) with preset +
  custom colors, used by link tiles, App Launcher and project icons
- Projects: optional Root Folder (Browse…) and logo/icon (gallery or custom
  image, root-relative paths supported), shown at the project switcher

**Widgets & UX**
- New **App Launcher** widget (exe + args + icon) — v1 app shortcuts
- Link Opener: icon modes (gallery/favicon/custom), per-link browser choice
- Note: View/Edit/Split toggle (View default), polished markdown (syntax
  highlighting, themed typography, Content Style setting), clickable links
- Global find-in-page (Ctrl+F) across all widgets; CodeMirror search in editors
- Keyboard shortcuts: Ctrl/Cmd+1-9 projects, Alt+1-9 workflows, Ctrl/Cmd+E edit
- Settings → Shortcuts tab (customizable project/workflow/edit-mode bindings)
- Settings → AI tab: **Freeter MCP server** (streamable-HTTP, bearer-token,
  11 tools over projects/workflows/widgets/notes/todos) with optional
  WSL/network access (binds 0.0.0.0; loopback-only by default) — verified
  end-to-end from Claude Code in WSL
- Developer widgets: **Webhook Button**, **Git Status**, **GitHub CI**,
  **GitHub PRs** (plus earlier API Client, Code Snippet, System Monitor)
- Project archiving (hide without deleting); archived projects excluded from
  switcher, palette and shortcuts
- Top-bar quick-actions toolbar (palette, apps, import/export, settings)
- Click-hold-and-drag scrolling on all scrollable areas (tabs, shelf, lists)

### 🔜 Pending (specced, not yet built)

- **Monitoring & reporting integrations** — Prometheus / Grafana /
  Alertmanager widgets, generic JSON metric widget, alert webhook ingest +
  desktop notifications (see docs/monitoring-integrations-plan.md)
- Developer widgets remainder: port watcher, reminders
- **Shelf bulk-pin** from the Freeter 1 Library
- Icon polish: favicon offline caching, per-URL icons on multi-URL tiles
- Auto-update / release channel wiring (electron-builder publish is configured
  but unused); code signing for the MSI (blocked: requires a purchased
  code-signing certificate)
- Remaining roadmap phases below that have not shipped: enhanced Browser widget
  (Phase 6 items: address bar, downloads, reader mode), multi-window,
  plugin discovery (Phase 10)

See **[docs/v1-v2-parity-plan.md](docs/v1-v2-parity-plan.md)** and
**[docs/developer-features-and-mcp-plan.md](docs/developer-features-and-mcp-plan.md)**
for detailed specs of the pending items.

For the full per-phase technical breakdown — IPC contracts, widget designs, security model, library choices, migration steps — see **[v3-plan.md](v3-plan.md)**.

For the complete v2.7.1 feature inventory see **[README.md → Current Features](README.md#current-features-v271)**.

---

## Release Milestones

| Release | Phase | Theme |
|---|---|---|
| **3.0.0-alpha.1** | [Phase 0](v3-plan.md#phase-0--foundation--stack-upgrade) | Foundation — Vite, Vitest, CSS Modules, Zustand 5, Electron latest |
| **3.0.0-alpha.2** | [Phase 1](v3-plan.md#phase-1--backup--restore-json) | Backup / Restore (JSON) |
| **3.0.0-beta.1** | [Phase 2](v3-plan.md#phase-2--theme-system--icon-library) | Theme system, CSS tokens, Phosphor icons, OS auto-theme |
| **3.0.0-beta.2** | [Phase 3](v3-plan.md#phase-3--markdown-editor-note-widget-enhanced) | Markdown editor (CodeMirror 6) in Note widget |
| **3.0.0-beta.3** | [Phase 4](v3-plan.md#phase-4--code-highlighting-widget-new) | Code Highlighting widget (Shiki + CodeMirror) |
| **3.0.0-beta.4** | [Phase 5](v3-plan.md#phase-5--password-vault-widget-new) | Password Vault widget (`safeStorage` + OS Keychain) |
| **3.0.0-beta.5** | [Phase 6](v3-plan.md#phase-6--enhanced-webpage--browser-widget) | Browser widget — address bar, find, downloads, zoom, reader mode |
| **3.0.0-beta.6** | [Phase 7](v3-plan.md#phase-7--existing-widget-enhancements) | Timer+, To-Do+, Commander+, Web Query+ enhancements |
| **3.0.0-rc.1** | [Phase 8](v3-plan.md#phase-8--new-widgets) (a) | Calendar, RSS, System Monitor, Clipboard History |
| **3.0.0-rc.2** | [Phase 8](v3-plan.md#phase-8--new-widgets) (b) | Kanban, API Client, Image / Media |
| **3.0.0-rc.3** | [Phase 9](v3-plan.md#phase-9--ux--application-features) | Command palette, global search, multi-window, per-project color |
| **3.0.0-rc.4** | [Phase 10](v3-plan.md#phase-10--plugin--extension-api) | Plugin / extension API, plugin discovery |
| **3.0.0** | [Phase 11](v3-plan.md#phase-11--developer-experience) | Storybook, Playwright E2E, docs, Changesets, plugin scaffold |

---

## Headline Features Landing in v3

- **Markdown editor** — full CodeMirror 6 editor with split preview and toolbar (replaces tiny-markdown-editor)
- **Code highlighting** — new dedicated Code Snippet widget with 13+ languages and 10 themes
- **Password vault** — local password manager backed by the OS Keychain via Electron `safeStorage`
- **Modern browser widget** — address bar, find-in-page, downloads, zoom, mute, reader mode
- **Themes & icons** — 8 built-in themes, theme editor, ~7000 Phosphor icons, OS auto-theme
- **JSON backup/restore** — human-readable, diff-friendly profile export with merge support
- **New widgets** — Calendar, RSS, System Monitor, Clipboard History, Kanban, API Client, Media
- **Command palette** — `Ctrl+P` to jump to any project, workflow, widget or action
- **Plugin API** — distribute third-party widgets as npm packages

Every existing v2.7.1 widget and application feature is preserved and enhanced. Nothing is removed.

---

## Branch & PR Strategy

- Base branch: `upgrade/v3-roadmap` (this fork) — long-lived integration branch
- One feature branch per phase: `upgrade/v3/<phase>-<short-name>` (e.g. `upgrade/v3/01-backup-restore`)
- Each phase merges into `upgrade/v3-roadmap` via PR with passing tests
- After all phases land and stabilize, `upgrade/v3-roadmap` merges to `master` and is tagged `v3.0.0`

---

## Long-Term (post-3.0)

Items deferred beyond the v3 release:

- Mobile companion app (read-only)
- Cloud sync / collaboration
- Web build (browser-only Freeter without Electron)

See [v3-plan.md → Competitor Analysis](v3-plan.md#competitor-analysis) for context on what was considered and where it landed.
