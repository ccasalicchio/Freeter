# Freeter v3 — Detailed Upgrade Plan

> **Version target:** 3.0.0
> **Branch:** `upgrade/v3-roadmap`
> **Strategy:** one feature branch per phase, merged into `upgrade/v3-roadmap` then `master`
> **Principle:** every v2 feature is preserved and enhanced — nothing is removed

For the high-level milestone view see [ROADMAP.md](ROADMAP.md).
For the v2.7.1 feature inventory see [README.md](README.md#current-features-v271).

---

## Phase 0 — Foundation / Stack Upgrade

All v2 functionality must work after this phase.

| Component | v2 | v3 Target | Rationale |
|---|---|---|---|
| Electron | 36.x | **latest stable** (37+) | Chromium security patches |
| React | 19.1 | 19.x latest | Already current; keep pinned |
| TypeScript | 5.5 | 5.7+ | `noUncheckedIndexedAccess`, satisfies operator |
| Zustand | 4.5 | 5.x | Smaller, TypeScript-first, no default export |
| Build | Webpack 5 | **Vite + `electron-vite`** | 3–5× faster HMR, no manual Webpack configs |
| Tests | Jest 29 + jsdom | **Vitest** | Native ESM, same API, faster |
| Lint/Format | ESLint flat | ESLint flat + **Biome** | Replace Prettier with Biome for speed |
| Styles | SCSS Modules | **CSS Modules + PostCSS** | Drop Sass; native CSS nesting in Chromium 112+ |
| Packaging | electron-builder 26 | electron-builder (keep) | Already well configured |

### Migration steps
1. Replace `webpack.*.config.js` with `vite.config.ts` using `electron-vite` presets.
2. Migrate `jest.config.js` → `vitest.config.ts`.
3. Convert `.module.scss` → `.module.css` (use `postcss-nesting`).
4. Migrate Zustand stores to Zustand 5 API.
5. Run full test suite + visual smoke test before merging.

---

## Phase 1 — Backup & Restore (JSON)

Adds user-facing export/import on top of v2's already-text-based storage.

### Backup format (`.freeter-backup.json`)

```jsonc
{
  "version": 1,
  "exportedAt": "2026-04-28T10:00:00Z",
  "freeterVersion": "3.0.0",
  "appSettings": { /* application settings JSON */ },
  "projects": [
    {
      "id": "uuid",
      "name": "My Project",
      "settings": {},
      "workflows": [
        {
          "id": "uuid",
          "name": "Dev",
          "settings": {},
          "widgetLayout": [ /* position + size */ ],
          "widgets": [
            {
              "id": "uuid",
              "type": "note",
              "coreSettings": { "name": "My Note", "icon": "…" },
              "typeSettings": { /* widget-specific settings */ },
              "data": { "note": "Hello World" }
            }
          ]
        }
      ]
    }
  ],
  "shelf": { /* shelf widget list */ },
  "vaultSecrets": null  // always null — vault has its own export
}
```

- Human-readable JSON; diff-friendly; no binary blobs
- Vault/passwords always excluded; vault has its own passphrase-protected export
- Import supports **replace-all** or **merge** (skip UUID duplicates)

### IPC additions

```ts
ipcExportProfileChannel   // serialize state + widget data → JSON → save dialog
ipcImportProfileChannel   // open dialog → validate schema → preview → apply
```

### UI

- **File → Export Profile…** → save dialog → `.freeter-backup.json`
- **File → Import Profile…** → open dialog → preview project list → confirm
- **Auto-backup** in Application Settings: folder + trigger (daily / on close)
- v2 data migrated automatically on first v3 launch

---

## Phase 2 — Theme System & Icon Library

### CSS token system

Replace implicit SCSS variables with a canonical `tokens.css`:

```css
:root {
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-bg-widget: #0f3460;
  --color-accent: #4e9af1;
  --color-accent-hover: #6cb0ff;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #a0a0a0;
  --color-border: #2a2a4a;
  --color-danger: #e74c3c;
  --color-success: #2ecc71;
  --color-warning: #f39c12;
  /* + ~30 more semantic tokens */
}
```

All `--freeter-*` variables remapped to semantic tokens; backwards-compat aliases kept for one version.

### Built-in themes

| Theme | Style |
|---|---|
| **Dark** (default) | Deep navy · blue accent |
| **Light** | Off-white · indigo accent |
| **Nord** | Arctic blue-grey · cyan |
| **Catppuccin Mocha** | Mauve dark · lavender |
| **Solarized Dark** | Teal-green dark · orange |
| **Gruvbox Dark** | Warm brown · yellow |
| **Dracula** | Purple dark · pink |
| **High Contrast** | Pure black/white · no gradients |

Themes stored as JSON token-override files; users can author and share.

### Theme editor (Application Settings)

- Color pickers for each semantic token
- Live preview of running UI
- Export as `.freeter-theme.json` / Import theme file

### OS auto-theme

- Detect `prefers-color-scheme` via `nativeTheme.shouldUseDarkColors`
- Auto-switch between designated Dark and Light themes
- Setting: Auto / Always Dark / Always Light

### Icon library

Replace per-widget single SVG with **Phosphor Icons** (~7000 icons, MIT):
- Searchable grid icon picker in widget settings
- Custom icon upload (drag PNG/SVG)
- Per-project accent color (color picker)
- All v2 SVG icons remapped to equivalent Phosphor icons

---

## Phase 3 — Markdown Editor (Note Widget Enhanced)

### v2 features preserved
- Plain-text mode
- Markdown mode toggle
- Spell check toggle
- Copy Full Text action
- Context menu: cut/copy/paste/select all
- Persistent local storage

### v3 enhancements

Replace `tiny-markdown-editor` with **CodeMirror 6** + `@codemirror/lang-markdown`:

| Feature | Detail |
|---|---|
| Live syntax highlighting | Bold, italic, headings, code spans, fences highlighted in editor |
| Split preview pane | Side-by-side editor + rendered HTML (toggle) |
| Rendered preview | [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify) |
| Toolbar | Bold · Italic · H1-H3 · Link · Image · Code · Fenced Block · Blockquote · Lists · HR · Undo/Redo |
| Theme matching | CodeMirror theme follows active Freeter theme |
| Export | Action bar: export as `.md` via save dialog |
| Status bar | Word count · character count · cursor position |
| Tables | GFM tables rendered and editable |
| Scroll sync | Editor and preview scroll together |

Settings additions: `renderMode` (source / preview / split), `fontSize`, `lineHeight`

---

## Phase 4 — Code Highlighting Widget (New)

### Widget design

```ts
CodeSnippetWidget
  settings: { language, theme, showLineNumbers, wrapLines, label, readOnly }
  storage:  dataStorage.setText('code', rawSource)
```

### Features

| Feature | Implementation |
|---|---|
| Editor mode | CodeMirror 6 with target language loaded |
| View mode | [Shiki](https://github.com/shikijs/shiki) static HTML render (200+ languages) |
| Languages (day-1) | `typescript` `javascript` `python` `rust` `go` `sql` `bash` `json` `yaml` `html` `css` `csharp` `java` |
| Themes | 10 Shiki/CodeMirror themes (GitHub Light/Dark, Dracula, Nord, …) |

Action bar: **Copy to Clipboard · Open in External Editor · Export as File**

---

## Phase 5 — Password Vault Widget (New)

### Security model

- Secrets encrypted with **`safeStorage.encryptString`** (Electron built-in)
  - Windows: DPAPI tied to user session
  - macOS: Keychain Access
  - Linux: libsecret (GNOME Keyring / KWallet)
- No master password stored — encryption tied to OS user session
- Vault manifest (entry names, usernames, URLs, notes — **no** passwords) stored as plain JSON in `appDataStorage`
- Passwords fetched on demand; never held in renderer memory beyond a copy call
- Clipboard auto-cleared 30 s after copy

### IPC additions

```ts
ipcSafeStorageEncryptChannel   // safeStorage.encryptString(plain) → Base64 cipher
ipcSafeStorageDecryptChannel   // safeStorage.decryptString(cipher) → plaintext
```

### Widget features

- Entries: site name · username · URL · notes
- **Copy Username** / **Copy Password** (auto-clear clipboard 30 s)
- **Reveal Password** — show 10 s then re-mask
- Add / Edit / Delete entries
- Search/filter by name or URL
- **Password Generator**: length 8–64, uppercase, digits, symbols, no-ambiguous
- Import: CSV (LastPass / Bitwarden) · JSON
- Export: JSON encrypted with passphrase (AES-256-GCM via Node `crypto`)

---

## Phase 6 — Enhanced Webpage / Browser Widget

### v2 features preserved
- URL, session scope, persistence
- Auto-reload (all existing intervals)
- CSS injection, JS injection, user-agent
- Back · Forward · Reload/Stop · Home · Open-in-Browser
- Zoom via context menu
- `openUrl` / `getUrl` API for Web Query

### v3 enhancements

| Feature | Implementation |
|---|---|
| **Address bar** | Editable URL field in action bar; Enter to navigate |
| **Navigation history** | Buttons disabled at boundary; wired to `canGoBack`/`canGoForward` |
| **Find in page** | `Ctrl+F` → `webview.findInPage(text)` with counter, next/prev, dismiss |
| **Download manager** | `will-download` event → toast with filename + progress |
| **New-window handling** | `new-window` → OS browser or new Webpage widget |
| **Permission prompts** | `permission-request` → allow / block / remember per-origin |
| **Certificate error UI** | `certificate-error` → inline warning with override |
| **Dev Tools** | Open Chromium DevTools (dev builds; action bar button) |
| **Zoom controls** | `setZoomFactor` / `getZoomFactor` — slider or +/- in action bar |
| **Mute audio** | `setAudioMuted` toggle in action bar |
| **Print** | `webview.print()` action bar button |
| **Screenshot** | `webview.capturePage()` → PNG via save dialog |
| **Reader mode** | Inject [Readability.js](https://github.com/mozilla/readability) + minimal CSS |
| **Keyboard shortcuts** | `Ctrl+R` reload · `Ctrl+L` focus address · `Ctrl+F` find |

Settings additions: `homePage`, `openLinksIn` (same / browser / new widget), `blockAds`

---

## Phase 7 — Existing Widget Enhancements

### Timer Widget+

v2 preserved: 5–90 min steps, 35+ end sounds with volume, Test Sound, Play/Pause/Reset.

| Feature | Detail |
|---|---|
| Stopwatch mode | Count up from 00:00 |
| Custom duration | Free-form input (not just 5-min steps) |
| Multiple timers | Up to N named timers in one widget (stack view) |
| Desktop notification | Electron `Notification` API on end |
| Pomodoro mode | 25/5 cycle; long break after 4 |
| Progress ring | Visual arc showing remaining time |
| Keyboard shortcut | Space=start/pause, R=reset |

### To-Do List Widget+

v2 preserved: add/edit/reorder/delete, check/uncheck/uncheck-all, top/bottom add.

| Feature | Detail |
|---|---|
| Due dates | Optional date picker; overdue shown red |
| Priority labels | High/Medium/Low badge |
| Sub-tasks | One level of nested tasks |
| Tags/Labels | Colour-coded free-text tags |
| Filter view | All / Active / Completed / Overdue / By-tag |
| Export | Markdown checklist or JSON |
| Keyboard shortcuts | `Enter` add, `Ctrl+Enter` complete, `Delete` remove |

### Commander Widget+

v2 preserved: multi-line command list, configurable CWD, opens OS terminal.

| Feature | Detail |
|---|---|
| Multiple presets | Named command groups; dropdown selector |
| Inline terminal | Optional embedded xterm.js (no OS window) |
| Environment vars | Per-widget `ENV=value` overrides |
| Run on schedule | Cron-style trigger |
| Status indicator | Last exit code on widget |

### Web Query Widget+

v2 preserved: Browser App / Webpages modes, 21 built-in engines, custom URL template, description, query template.

| Feature | Detail |
|---|---|
| More engines | GitHub, GitLab, npm, PyPI, MDN, Stack Overflow, Reddit, YouTube, Hacker News |
| Quick switch | Keyboard shortcut to cycle engines |
| Instant results | Optional inline preview Webpage widget |
| Search history | Last N queries; dropdown |

---

## Phase 8 — New Widgets

### 8.1 Calendar / Agenda

- Month / week / day view toggle
- Events as JSON in `dataStorage`
- iCal `.ics` import
- Webcal deep-link for OS calendar sync
- Repeating events (daily / weekly / monthly)

### 8.2 RSS Feed Reader

- Subscribe to RSS 2.0 / Atom feeds
- Show latest N items; click → Webpage widget or browser
- Refresh interval: 1 min – 24 h
- Per-item read state; mark all read; filter unread

### 8.3 System Monitor

- CPU %, RAM, Disk I/O, Network I/O via [`systeminformation`](https://github.com/sebhildebrandt/systeminformation)
- Sparkline graphs (last 60 s)
- Configurable update interval (1 / 2 / 5 s)

### 8.4 Clipboard History

- Main process listens for clipboard changes
- Stores last N text items (default 50)
- Click → copy back; search/filter; pin items
- Clear history action

### 8.5 Kanban / Sticky Board

- Multiple columns with custom labels
- Cards: title + optional description
- Drag cards between columns
- Card colours (6 options)
- Export board as JSON

### 8.6 API / HTTP Request

- Request builder: method, URL, headers, body
- Display: status, headers, body with code highlighting
- Save named requests; load from dropdown
- Basic auth and Bearer token helpers

### 8.7 Image / Media

- Display local image or animated GIF
- Fit modes: cover / contain / fill / none
- Slideshow: rotate through folder at interval
- Click → open original in OS viewer

---

## Phase 9 — UX & Application Features

### Command Palette

- `Ctrl+P` / `Cmd+P` opens fuzzy-search overlay
- Searches: projects, workflows, widgets, app actions
- Navigate to any workflow in one keystroke

### Project Switcher enhancements

- Per-project **accent color** picker
- Per-project **icon** from Phosphor library

### Global Search

- `Ctrl+Shift+F`: search all note widget content
- Results show project / workflow / widget; click to navigate

### Multiple Windows

- File → New Window → second Freeter window for dual-monitor

### Per-Workflow Shortcuts

- Each workflow can have an optional global shortcut to activate directly

### Memory Saver enhanced

- v2 deactivation logic preserved
- Configurable idle timeout per workflow
- Visual indicator on inactive workflow tabs

---

## Phase 10 — Plugin / Extension API

### Widget package contract

```ts
export const widgetType: WidgetType<MySettings> = {
  id: 'com.example.my-widget',       // reverse-domain unique ID
  name: 'My Widget',
  minSize: { w: 2, h: 2 },
  maxSize: { w: 12, h: 12 },
  settingsEditorComp: { type: 'react', Comp: MySettingsComp },
  widgetComp: { type: 'react', Comp: MyWidgetComp },
  createSettingsState,
}
```

### Plugin discovery

Scan `~/.freeter/plugins/` for directories with `package.json` containing `"freeterPlugin": true`.
Load via Electron sandboxed renderer using a plugin host iframe.

---

## Phase 11 — Developer Experience

| Item | Detail |
|---|---|
| **Storybook** | Isolated UI component dev; story per widget |
| **Playwright E2E** | Smoke tests for golden paths per widget |
| **Renovate** | Automated dep update PRs |
| **Changesets** | Semver + auto-generated `CHANGELOG.md` |
| **TSDoc** | All IPC channels and widget interfaces documented |
| **Widget dev guide** | `docs/widget-development.md` tutorial |
| **Plugin starter** | `npx create-freeter-plugin` scaffold |

---

## Competitor Analysis

Research of Notion, Obsidian, Franz, Station, Wavebox, Rambox, Coda, Dasheroo, Databox, Linear, Height.

| Feature | Source | Phase | Priority |
|---|---|---|---|
| Command palette (`Ctrl+P`) | VS Code, Obsidian | 9 | High |
| Global content search | Obsidian, Notion | 9 | High |
| Dark/light OS auto-switch | All modern apps | 2 | High |
| Widget templates / presets | Notion, Coda | 9 | Medium |
| Per-project accent color | Linear, Height | 9 | Medium |
| Per-workflow keyboard shortcut | Station | 9 | Medium |
| Multiple windows (dual monitor) | Wavebox | 9 | Medium |
| Plugin / extension API | Obsidian | 10 | Medium |
| Pomodoro integration | Forest, Focus Bear | 7 | Medium |
| Password manager built-in | — | 5 | Medium |
| In-app code editor | VS Code, Coda | 4 | Medium |
| RSS reader | — | 8 | Medium |
| System status tiles | Datadog, Dasheroo | 8 | Medium |
| Clipboard manager | Alfred, Raycast | 8 | Medium |
| Kanban board | Trello, Notion | 8 | Medium |
| HTTP client | Postman, Insomnia | 8 | Medium |
| Mobile companion (read-only) | Notion | — | Long-term |
| Collaboration / cloud sync | Notion, Coda | — | Long-term |
