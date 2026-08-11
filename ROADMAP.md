# Freeter Roadmap

High-level milestone view for the Freeter v3 upgrade.

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
