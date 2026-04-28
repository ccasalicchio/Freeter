<p align="center">
  <img src="https://raw.githubusercontent.com/FreeterApp/Freeter/master/resources/linux/freeter-icons/256x256.png" width="128" height="128"/>
</p>

<h1 align="center">Freeter</h1>

<p align="center">
  <strong>Organizer For Those Who Do</strong><br/>
  Free, open-source productivity dashboard built with Electron + React + TypeScript
</p>

<p align="center">
  <a href="#current-features">Current Features</a> •
  <a href="#v3-upgrade-plan">v3 Upgrade Plan</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#building-from-source">Building</a> •
  <a href="#license">License</a>
</p>

---

> **This fork** tracks the official [FreeterApp/Freeter](https://github.com/FreeterApp/Freeter) and layers a v3 upgrade roadmap on top. The `upgrade/v3-roadmap` branch contains this document and will become the base for feature branches as implementation proceeds.

---

## Current Features

### Core Concepts

| Concept | Description |
|---|---|
| **Projects** | Top-level containers — one per client, product, or area of responsibility |
| **Workflows** | Named tabs inside a project — e.g. "Dev", "Marketing", "Support" |
| **Widgets** | Draggable, resizable tiles placed on the workflow canvas |
| **Global Shortcut** | `Ctrl/Cmd+Shift+F` — summon the window from anywhere |
| **System Tray** | Quick access / hide from tray icon |

### Widget Library (v2.7.1)

| Widget | What it does |
|---|---|
| **Webpage** | Embedded Chromium `<webview>` — full in-app browser with CSS/JS injection, session scoping, auto-reload, custom User-Agent, zoom, back/forward/reload actions |
| **Note** | Plain-text or Markdown note with persistent local storage. Markdown powered by [tiny-markdown-editor](https://github.com/jefago/tiny-markdown-editor) |
| **To-Do List** | Checkbox list — add, edit, reorder (drag-and-drop), mark done, delete; data persisted as JSON |
| **Timer** | Countdown/stopwatch with configurable sounds (35+ audio files) |
| **Commander** | Run one or more shell command-lines in the system's default terminal |
| **File Opener** | Open a file or folder with the OS default application |
| **Link Opener** | Open a URL in the default browser |
| **Web Query** | URL-template search — fill a text field and navigate to e.g. `https://google.com/search?q={query}` |

### Application Features

- **Drag-and-drop layout** — freely position and resize widgets on the worktable grid
- **Project & Workflow manager** — create, rename, reorder, delete projects and workflow tabs
- **Context menus** — right-click actions on widgets and the worktable
- **Action bar** — per-widget toolbar buttons (Back, Forward, Reload, Open in Browser, etc.)
- **App menu & keyboard shortcuts** — full menu bar with configurable shortcuts
- **Session management** — per-widget or shared browser sessions (App / Project / Workflow / Widget scope), persistent or temporary
- **Multi-platform** — Windows 10+, macOS 10.15+, Linux (Debian, RPM, AppImage)
- **CSS variables theming** — all colors exposed as `--freeter-*` custom properties
- **TypeScript throughout** — strict types across main process, renderer, and IPC layer
- **Clean architecture** — interfaces → use-cases → controllers → infra separation

---

## v3 Upgrade Plan

> **Version target:** 3.0.0  
> **Branch strategy:** one feature branch per section below, merged into `upgrade/v3-roadmap` and eventually `master`

### 1. Stack Upgrades

| Component | Current | Target | Notes |
|---|---|---|---|
| Electron | 36.x | **latest stable** (37+) | Keep up with Chromium security patches |
| React | 19.1 | 19.x (pin latest) | Already current |
| TypeScript | 5.5 | 5.7+ | Stricter `noUncheckedIndexedAccess` |
| Zustand | 4.5 | 5.x | Smaller, TypeScript-first API |
| Build | Webpack 5 | **Vite + `electron-vite`** | ~3–5× faster HMR, simpler config |
| Tests | Jest + jsdom | **Vitest** | Native ESM, same API as Jest |
| Linting | ESLint flat | ESLint flat + **Biome** formatter | Replace Prettier with Biome for speed |
| SCSS | sass-loader | **CSS Modules + PostCSS** | Drop Sass dependency; use native CSS nesting |
| Package | electron-builder | electron-builder (keep) | Already well-configured |

#### Migration path
1. Replace `webpack.*.config.js` files with `vite.config.ts` using `electron-vite`.
2. Migrate `jest.config.js` → `vitest.config.ts`; tests are already DOM-neutral enough.
3. Convert `.module.scss` → `.module.css` (native nesting is available in all modern Chromium).

---

### 2. Markdown Widget — Full Editor

**Status:** `tiny-markdown-editor` is already a dev dependency; the Note widget has a `settings.markdown` flag.

**Gap:** The existing integration uses the textarea mode without a proper toolbar, no preview split, no syntax highlighting in the editor.

#### Planned improvements

- Replace `tiny-markdown-editor` with **[CodeMirror 6](https://codemirror.net/)** + `@codemirror/lang-markdown`
  - Live syntax highlighting inside the editor (fenced code blocks, headers, bold/italic)
  - Configurable theme (matches app theme)
- Add a **split preview pane** using [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify)
- Toolbar buttons: Bold, Italic, Heading, Link, Image, Code, Blockquote, Ordered/Unordered list, Horizontal rule
- Export note as `.md` file via the action bar
- Word count and character count in the status bar
- `[[wiki-link]]` style cross-note linking (later phase)

---

### 3. Code Highlighting Widget (new)

A dedicated **Code Snippet** widget for storing and displaying code with full syntax highlighting.

#### Design

```
CodeSnippetWidget
  settings: { language, theme, showLineNumbers, wrapLines, label }
  storage:  dataStorage.setText('code', rawSource)
```

#### Implementation

- **Editor mode:** CodeMirror 6 with the target language loaded
- **View mode:** read-only CodeMirror or [Shiki](https://github.com/shikijs/shiki) static render (Shiki supports 200+ languages, ships TextMate grammars, outputs HTML)
- Supported languages on day-1: `typescript`, `javascript`, `python`, `rust`, `go`, `sql`, `bash`, `json`, `yaml`, `html`, `css`, `csharp`, `java`
- Action bar: Copy to clipboard, Open in external editor, Export as file
- Settings: language selector, theme (one of 10 Shiki/CodeMirror themes), line numbers toggle

---

### 4. Password Vault Widget (new)

A widget that stores credentials locally, encrypted at rest, unlocked with a master password.

#### Security model

- All secrets stored via the **OS Keychain** using Electron's `safeStorage` API (`safeStorage.encryptString` / `decryptString`) — leverages system-level encryption (DPAPI on Windows, Keychain on macOS, libsecret on Linux)
- No master password is stored; `safeStorage` ties encryption to the OS user session
- The vault JSON manifest (entry names, usernames, URLs — **not** passwords) stored in `appDataStorage` as plain JSON for searchability
- Passwords fetched on demand from `safeStorage`, never held in renderer memory beyond the copy-to-clipboard call

#### Widget features

- List of credential entries (site name, username, URL, notes)
- **Copy username / Copy password** actions — put value in clipboard and clear after 30 s
- **Reveal password** — show briefly in widget (auto-hide after 10 s)
- Add / edit / delete entries
- Search/filter entries by name
- Generate strong password (configurable length, symbols, no-ambiguous-chars)
- Import/export: CSV and JSON (passwords exported as encrypted with a user-chosen passphrase)

#### IPC additions

```ts
ipcSafeStorageEncryptChannel  // main: safeStorage.encryptString → Base64
ipcSafeStorageDecryptChannel  // main: safeStorage.decryptString ← Base64
```

---

### 5. Enhanced Webpage / Browser Widget

The existing widget already supports injection and session management. v3 adds:

| Feature | Implementation |
|---|---|
| **Address bar** | Editable URL bar in the action bar — type or paste URL, press Enter |
| **Navigation history** | Back/Forward with visual disable state; `canGoBack` / `canGoForward` wired to webview events |
| **Find in page** | `Ctrl+F` triggers `webview.findInPage(text)` with match counter and next/prev |
| **Download manager** | Listen to `will-download` on session; show toast with file name + progress |
| **Open in new window** | `new-window` event → open in OS browser |
| **Permissions UI** | Intercept `permission-request` / `permission-check`; prompt user with allow/block/remember |
| **Certificate error handling** | `certificate-error` event → show inline error with override option |
| **Dev tools** | Open Chromium DevTools for the webview via action bar button (dev builds only) |
| **Page zoom** | `setZoomFactor` / `getZoomFactor` exposed in action bar |
| **Mute audio** | `setAudioMuted` toggle in action bar |
| **Print** | `webview.print()` via action bar |
| **Take screenshot** | `webview.capturePage()` → save PNG via save dialog |
| **Reader mode** | Inject [Readability.js](https://github.com/mozilla/readability) + minimal CSS on demand |

---

### 6. Icon, Color & Theme System

#### Icon library

Replace the current single SVG-per-widget approach with a bundled icon set:

- **Phosphor Icons** (~7 000 SVGs, MIT) — cover all UI needs
- Widget icons: pick any Phosphor icon in the widget settings
- Custom icon upload: drop a PNG/SVG onto the picker to use a local image

#### Color system

Formalize the existing `--freeter-*` CSS variables into a full design token file:

```css
/* src/renderer/ui/styles/tokens.css */
:root {
  --color-bg-primary: …;
  --color-bg-secondary: …;
  --color-accent: …;
  --color-text: …;
  /* … ~40 tokens */
}
```

#### Built-in themes (v3)

| Theme | Base | Accent |
|---|---|---|
| **Dark (default)** | #1a1a2e | #4e9af1 |
| **Light** | #f5f5f5 | #1565c0 |
| **Nord** | #2e3440 | #88c0d0 |
| **Catppuccin Mocha** | #1e1e2e | #cba6f7 |
| **Solarized Dark** | #002b36 | #268bd2 |
| **Gruvbox Dark** | #282828 | #fabd2f |
| **High Contrast** | #000000 | #ffffff |

Theme is a JSON file with token overrides — users can author and share themes.

#### Theme editor

A new **Application Settings** panel section: color pickers for each token, live preview, export/import as `.freeter-theme.json`.

---

### 7. New Widgets

#### 7.1 Calendar / Agenda Widget

- Month/week/day view
- Events stored locally as JSON in `dataStorage`
- iCal `.ics` import
- Optionally sync with OS calendar via deep-link (`webcal://`)

#### 7.2 RSS Feed Reader Widget

- Subscribe to one or more RSS/Atom feeds
- Show latest N items; click to open in Webpage widget or browser
- Refresh interval configurable (1 min – 24 h)
- Mark read state per item, stored locally

#### 7.3 System Monitor Widget

- CPU %, RAM %, Disk I/O, Network I/O — polled via Node.js `os` module + `systeminformation` package
- Sparkline graphs (last 60 s)
- Configurable update interval

#### 7.4 Clipboard History Widget

- Listen to clipboard changes in the main process
- Store last N (configurable, default 50) text items
- Click to copy back; search/filter; pin items

#### 7.5 Sticky Note / Kanban Widget

- Multiple colored sticky notes on a mini-board
- Drag between "columns" (custom labels)
- Optionally export board as JSON

#### 7.6 API / HTTP Request Widget

- Simple request builder (method, URL, headers, body)
- Run and display response (status, headers, body with code highlighting)
- Save named requests; useful for hitting local dev servers

#### 7.7 Image / Media Widget

- Display a local image or GIF as a dashboard tile
- Configurable fit mode (cover/contain/fill)
- Slide-show mode: rotate through a folder of images

---

### 8. Backup & Restore (JSON format)

The current data model is already file-based, but there is no user-facing export. v3 adds full profile portability.

#### Backup format

```
freeter-backup-2026-04-28.json
{
  "version": 1,
  "exportedAt": "2026-04-28T10:00:00Z",
  "appSettings": { … },
  "projects": [ { "id": "…", "name": "…", "workflows": [ … ] } ],
  "widgetData": {
    "<widgetId>": { "<key>": "<value>" }
  },
  "widgetSecrets": null   // intentionally excluded; vault has its own export
}
```

- **Human-readable JSON** — diff-friendly, version-controllable
- Passwords / vault secrets are **always excluded** from the main backup; the Vault widget has its own password-protected export
- **Merge strategy**: import can either replace-all or merge (add projects that don't exist, skip duplicates)

#### IPC additions

```ts
ipcExportProfileChannel   // main: serialize state + widget data → JSON file via save dialog
ipcImportProfileChannel   // main: open JSON file → validate → apply
```

#### UI

- **File → Export Profile…** → save dialog → `.freeter-backup.json`
- **File → Import Profile…** → open dialog → preview (project list) → confirm
- **Auto-backup**: optional scheduled export to a user-chosen folder (daily / on app close)

---

### 9. Competitor Feature Analysis

Research of similar tools (Notion, Obsidian, Franz, Station, Wavebox, Rambox, Dasheroo, Databox, Coda) identified the following high-value features not yet in Freeter:

| Feature | Source | Priority |
|---|---|---|
| **Command palette** (`Ctrl+P`) | VS Code, Obsidian | High |
| **Quick-add widget** from palette | Notion, Coda | High |
| **Widget templates / presets** | Notion, Coda | Medium |
| **Keyboard shortcut per workflow** | Station | Medium |
| **Multiple windows** / second monitor | Wavebox | Medium |
| **Mobile companion app** (read-only) | Notion | Low (long-term) |
| **Plugin / extension API** | Obsidian | Medium |
| **Collaboration / sync** | Notion, Coda | Low (long-term) |
| **Pomodoro integration** in Timer | Forest, Focus Bear | Medium |
| **Dark/light mode auto-switch** (follows OS) | All modern apps | High |
| **Per-project accent color** | Linear, Height | Medium |
| **Widget search** across all projects | Obsidian | Medium |
| **Embed local HTML files** | — | Medium |
| **Global search** across all notes | Obsidian, Notion | High |

#### Command palette (high priority)

- `Ctrl+P` / `Cmd+P` opens a fuzzy-search overlay
- Searches: all projects, all workflows, all widget names, app actions (new project, settings, export…)
- Navigate to any workflow in one keystroke

#### Plugin API (medium priority)

Define a stable widget interface so third-party widgets can be distributed as npm packages:

```ts
// Widget package must export:
export const widgetType: WidgetType<MySettings> = {
  id: 'com.example.my-widget',
  name: 'My Widget',
  minSize: { w: 2, h: 2 },
  settingsEditorComp: { type: 'react', Comp: MySettingsComp },
  widgetComp: { type: 'react', Comp: MyWidgetComp },
  createSettingsState,
}
```

Plugin discovery: scan `~/.freeter/plugins/` for directories with a `package.json` containing `"freeterPlugin": true`.

---

### 10. Developer Experience

- Add **Storybook** for UI components (isolated widget development)
- Add **Playwright** E2E tests (already have unit tests with Jest/Vitest)
- Add **Renovate** or **Dependabot** for automated dependency updates
- Add **changesets** for semantic versioning and changelog generation
- Document IPC channels with TSDoc
- Provide a **widget development guide** (`docs/widget-development.md`)

---

## Upgrade Implementation Phases

| Phase | Version | Features |
|---|---|---|
| **Phase 1** | 3.0.0-alpha | Build system → Vite, Vitest, CSS Modules; stack upgrades |
| **Phase 2** | 3.0.0-beta.1 | Backup/Restore (JSON); Theme system; Phosphor icons |
| **Phase 3** | 3.0.0-beta.2 | Markdown full editor (CodeMirror); Code Highlighting widget |
| **Phase 4** | 3.0.0-beta.3 | Password Vault widget; safeStorage IPC |
| **Phase 5** | 3.0.0-beta.4 | Browser widget enhancements (address bar, find, downloads, zoom) |
| **Phase 6** | 3.0.0-rc.1 | Command palette; auto OS theme; per-project color |
| **Phase 7** | 3.0.0-rc.2 | New widgets: RSS, System Monitor, Calendar, Clipboard History |
| **Phase 8** | 3.0.0 | Plugin API; documentation; Storybook; Playwright E2E |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 36+ |
| UI framework | React 19 + TypeScript 5 |
| State | Zustand 4 |
| Build | Webpack 5 (→ Vite v3) |
| Styling | SCSS Modules (→ CSS Modules v3) |
| Tests | Jest 29 + Testing Library (→ Vitest v3) |
| Packaging | electron-builder 26 |

---

## Building from Source

```bash
# Install dependencies
yarn

# Development (hot-reload)
yarn dev:no-react-devtools

# Production build
yarn prod

# Package for distribution
yarn package

# Run tests
yarn test

# Type-check all layers
yarn test:typecheck
```

---

## Supported Platforms

| OS | Architecture |
|---|---|
| Windows 10+ | x64 |
| macOS 10.15+ | x64, Apple Silicon |
| Linux (most distros) | x64 |

---

## License

Freeter is free software licensed under the [GNU General Public License v3.0 or later](COPYING).

Original work © 2024 Alex Kaul. Fork maintained by [@ccasalicchio](https://github.com/ccasalicchio).

[Official homepage](https://freeter.io/) · [Original repository](https://github.com/FreeterApp/Freeter) · [Download](https://freeter.io/download) · [Community](https://community.freeter.io/)
