# Freeter 3 — v1/v2 Feature Parity: Gap Analysis, Spec & Plan

Fact-checked against (a) a real Freeter 1.2.1 data file, (b) freeter.io v1 release
notes, (c) the v2 feature set in this repo's README, (d) the current v3 codebase.

## Verified gaps

### 1. Keyboard shortcuts (v1 had these; v3 does not)
- v1 data: `projects[].settings.shortcut` and `tabs[].shortcut` fields exist.
- v1 release notes: "keyboard shortcuts for Project Tabs" and "for Dashboard Tabs";
  Ctrl/Cmd+E toggles edit mode.
- **Spec**: project shortcuts (Ctrl/Cmd+1..9 switch project), workflow shortcuts
  (Alt+1..9 switch workflow tab), Ctrl/Cmd+E edit-mode toggle. Customizable in a
  Settings → Shortcuts tab. Renderer keydown handling (no OS-global hotkeys needed
  beyond the existing main hotkey). Importer maps v1 shortcut fields when set.

### 2. Global "mini-app" pools (v1 toolbar tabs; dropped in v2/v3)
- v1: global Links / Commands / Searches / Timers / Toolkit tabs (pools stored in
  `app.links|commands|searches|timers|tools`).
- v3 equivalent: the Shelf (top-bar pinned widgets) already covers "always
  available" — **importer now converts the pools into a "Freeter 1 Library"
  project** (one workflow per pool) so nothing is lost; users pin favorites to
  the Shelf. DONE (importer v2).
- Remaining nice-to-have: a "pin to shelf" bulk action in the Library.

### 3. Launch at OS startup (v1 setting; missing in v3)
- **Spec**: Settings → General checkbox; `app.setLoginItemSettings` on
  Windows/macOS; .desktop autostart entry on Linux.

### 4. File Explorer widget (v1 widget; absent in v2/v3)
- v1 had rules-based File Explorer with rich context menu (Open with Tool,
  Show in Explorer, rename/duplicate/delete...).
- Current importer maps it to file-opener (lossless for this user's data — the
  real file had zero configured rules).
- **Spec (later)**: read-only folder listing widget with open/reveal actions via
  existing shell provider; write operations need new IPC (fs rename/delete with
  confirmation).

### 5. "Tools" (v1 Toolkit; partially superseded)
- v3's App Manager covers terminal apps for Commander. v1 "tools" in the real
  data file carry names only (no paths) — nothing further to import.
- **Spec (later)**: per-file "Open with app" using App Manager entries in
  file-opener.

## Not gaps (verified present in v3)
Shelf/top bar, App Manager, Memory Saver, palette, edit mode, tray, main hotkey,
spell check, webpage/web-query/note/to-do/timer/commander/file-opener/link-opener
widgets plus the v3 additions (kanban, calendar, rss, snippets, vault, monitor,
api-request, clipboard history, image-media).

## Delivered in this pass
- App identity "Freeter 3": own name/userData/single-instance lock, own data dir
  (`appData/freeter3/freeter-data`) with one-time migration from `freeter2`,
  window/tray/menu titles. v1+v2+v3 can now run simultaneously.
- Importer: v1 global pools → "Freeter 1 Library" project (links → link-opener
  with favicons, commands → commander, searches → web-query with QUERY-template
  conversion, timers → timer).

## Suggested order for the rest
1. Keyboard shortcuts (project/workflow switching + Ctrl/Cmd+E) — small, high value
2. Launch at startup — trivial
3. Shelf "pin from Library" bulk action — small
4. Unified icon system (tasks #8/#9) — medium
5. File Explorer widget — large
