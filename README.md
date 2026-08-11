<p align="center">
  <img src="https://raw.githubusercontent.com/FreeterApp/Freeter/master/resources/linux/freeter-icons/256x256.png" width="128" height="128"/>
</p>

<h1 align="center">Freeter</h1>

<p align="center">
  <strong>Organizer For Those Who Do</strong><br/>
  Free, open-source productivity dashboard built with Electron + React + TypeScript
</p>

<p align="center">
  <a href="#current-features-v271">Current Features</a> •
  <a href="#v3-upgrade-plan">v3 Upgrade Plan</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#building-from-source">Building</a> •
  <a href="#license">License</a>
</p>

---

> **This fork** tracks the official [FreeterApp/Freeter](https://github.com/FreeterApp/Freeter) and layers a v3 upgrade roadmap on top.  
> Branch `upgrade/v3-roadmap` contains this document and is the base for all feature branches.

---

## Current Features (v2.7.1)

### Core Concepts

| Concept | Description |
|---|---|
| **Projects** | Top-level containers — one per client, product, or area of responsibility |
| **Workflows** | Named tabs inside a project — e.g. "Dev", "Marketing", "Support" |
| **Widgets** | Draggable, resizable tiles placed freely on the workflow canvas |
| **Shelf** | Persistent top-bar strip — pin any widget for instant access across all workflows |
| **Global Shortcut** | `Ctrl/Cmd+Shift+F` — summon or hide the Freeter window from anywhere |
| **System Tray** | Tray icon with menu: show app, switch projects, exit |

---

### Widget Library — Full Detail

#### Webpage Widget
Embeds a full Chromium `<webview>` for in-app browsing.

| Setting | Options |
|---|---|
| URL | Any http/https URL |
| Session Scope | Application · Project · Workflow · Widget |
| Session Persistence | Persistent (survives app restart) · Temporary (cleared on exit) |
| Auto-Reload | Disabled / 10 s / 30 s / 1 min / 5 min / 10 min / 60 min |
| Inject CSS | Arbitrary CSS injected after each page load |
| Inject JS | Arbitrary JS executed after DOM-ready |
| User Agent | Override the browser User-Agent string |

Action bar: **Back · Forward · Reload/Stop · Home · Open in Browser**  
Context menu: additional navigation options + Zoom controls  
Exposes API (`openUrl`, `getUrl`) consumed by Web Query widget in Webpages mode

---

#### Note Widget
Persistent text editor with optional Markdown rendering.

| Setting | Detail |
|---|---|
| Markdown mode | Toggle on/off; rendered by [tiny-markdown-editor](https://github.com/jefago/tiny-markdown-editor) |
| Spell check | Toggle on/off |

Action bar: **Copy Full Text**  
Context menu: cut / copy / paste / select all  
Data persisted locally via widget data storage (key `note`)

---

#### To-Do List Widget
Interactive checklist with drag-and-drop reordering.

| Feature | Detail |
|---|---|
| Add item | Input at top or bottom of list |
| Edit item | Click to edit in-place |
| Reorder | Drag-and-drop between items |
| Complete | Check/uncheck individual items |
| Delete | Per-item delete with confirmation |
| Bulk uncheck | "Uncheck All" action bar button |

Action bar: **Add Task · Uncheck All**  
Data persisted as JSON (key `todo`) with item IDs, text, and `isDone` flag

---

#### Timer Widget
Countdown timer with configurable duration and end sound.

| Setting | Options |
|---|---|
| Duration | 5 min → 90 min in 5-minute steps |
| End sound | 35+ MP3 files (8-bit, bells, guitar, synth, drums, voice…) or No Sound |
| End sound volume | 0 % → 100 % in 10 % steps |

Play/Pause/Reset controls; preview sound in settings ("Test Sound" action)

---

#### Commander Widget
Execute one or more shell command-lines in the system terminal.

| Setting | Detail |
|---|---|
| Command lines | Multi-line list of commands executed in order |
| Working directory | Optional CWD for the terminal session |

Single-click execution — opens OS default terminal app and runs the commands

---

#### File Opener Widget
Open a file or folder with the OS default application.

| Setting | Detail |
|---|---|
| Path | File or folder path |
| Open as | File (default app) · Folder (file manager) |

---

#### Link Opener Widget
Open a URL in the default OS browser.

| Setting | Detail |
|---|---|
| URL | Any URL (validated with sanitizeUrl) |
| Label | Display label on the button |

---

#### Web Query Widget
URL-template search bar — type a query and open results.

| Setting | Options |
|---|---|
| Mode | **Browser App** (opens in OS browser) · **Webpages** (routes query to Webpage widgets in the same workflow via `QUERY` placeholder) |
| Engine | 21 built-in engines (see below) · Custom (URL template) |
| Description | Short label shown in the input field |
| Query Template | Pre-fill part of the query with a template (e.g. `site:freeter.io QUERY`) |

**Built-in engines:**  
Bing · Bing Images · Bing Maps · Bing News · Bing Videos ·  
DuckDuckGo · DuckDuckGo Lite · DuckDuckGo Images · DuckDuckGo Maps · DuckDuckGo News · DuckDuckGo Videos ·  
Google · Google Images · Google Maps · Google News · Google Videos ·  
Openverse (All) · Openverse Audio · Openverse Images ·  
Wikipedia · Wolfram|Alpha

---

### Application Features — Full Detail

#### Project Management
- Create, rename, delete, reorder, clone projects
- Project Manager panel: list, add, edit name, toggle deletion, reorder
- Project Switcher: click to switch active project

#### Workflow Management
- Create, rename, delete, reorder, clone, paste workflows
- Workflow Settings panel: edit name
- Workflow Switcher tabs: click to activate a workflow tab
- Memory Saver: configurable deactivation of inactive workflows to reduce resource usage (scheduled deactivation + delayed reset)

#### Widget Layout
- Free-form drag-and-drop positioning on a grid canvas
- Resize from any edge/corner (resize handles)
- Ghost preview while dragging/resizing
- Add widget from Palette (categorized widget picker)
- Clone widget (duplicate with settings)
- Copy / Paste widget (across workflows)
- Delete widget (with confirmation)
- Core widget settings: display name, icon

#### Top Bar Shelf
- Pin any widget to the persistent top shelf
- Reorder shelf items by drag-and-drop
- Add from palette or drag from worktable
- Remove from shelf

#### Edit Mode
- Toggle edit mode to lock/unlock layout changes
- Edit mode toggle button (configurable position: top-bar or top-right corner of worktable)

#### Global Shortcut & Tray
- Configurable global shortcut (default: `Ctrl/Cmd+Shift+F`) — show/hide app window
- System tray icon: left-click shows window; right-click menu with project list + exit
- Configurable hotkey options (registered via Electron `globalShortcut`)

#### App Menu
- Full native menu bar
- Auto-hide menu bar option (toggle from menu)
- All CRUD actions accessible from menu

#### Widget Settings
- Per-widget settings panel (type-specific settings + core settings)
- Core settings: label, icon (SVG)
- Settings saved on close

#### Context Menus
- Right-click widget → widget-specific OS context menu
- Right-click worktable → layout actions

#### App Manager
- Configure the terminal application used by Commander widget
- Add, duplicate, delete, reorder, rename terminal app profiles
- Switch active terminal app

#### Application Settings
- General application preferences panel
- Configure main shortcut, menu bar behaviour, etc.

#### About & Sponsorship
- About dialog: version, credits
- Sponsorship URL (opens browser)

#### Data Storage
- All settings stored as JSON text files in the OS app-data directory
- Widget data stored per widget ID in separate subdirectories
- Window state (position, size, maximized) persisted across restarts

---

## v3 Upgrade Plan

> **Version target:** 3.0.0  
> **Strategy:** one feature branch per section, merged into `upgrade/v3-roadmap` then `master`  
> **Principle:** every v2 feature is preserved and enhanced — nothing is removed

---

### Phase 0 — Foundation / Stack Upgrade

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
| Styles | SCSS Modules | **CSS Modules + PostCSS** | Drop Sass; native CSS nesting supported in Chromium 112+ |
| Packaging | electron-builder 26 | electron-builder (keep) | Already well configured |
| CI | GitHub Actions | GitHub Actions (keep + update) | Bump node/OS matrix |

#### Migration steps
1. Replace `webpack.*.config.js` with `vite.config.ts` using `electron-vite` presets for main/preload/renderer.
2. Migrate `jest.config.js` → `vitest.config.ts`; tests are DOM-neutral.
3. Convert `.module.scss` → `.module.css` (use `postcss-nesting`).
4. Migrate Zustand stores to Zustand 5 API (no breaking change to state shape).
5. Run full test suite and visual smoke test before merging.

---

### Phase 1 — Backup & Restore (JSON)

> Enhances v2 data storage — all existing data is portable after this phase.

The current file-based storage is already text/JSON internally. v3 adds a user-facing **export/import** flow.

#### Backup format (`.freeter-backup.json`)

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

- **Human-readable JSON** — diff-friendly, version-controllable, no binary blobs
- Widget data (note text, todo list JSON, etc.) embedded inline per widget
- Vault / passwords always excluded; vault has its own passphrase-protected export
- Import supports **replace-all** or **merge** (add new projects, skip UUID duplicates)

#### IPC additions

```ts
ipcExportProfileChannel   // serialize full state + widget data → JSON → save-file dialog
ipcImportProfileChannel   // open-file dialog → validate schema → preview → apply
```

#### UI

- **File → Export Profile…** → save dialog → `.freeter-backup.json`
- **File → Import Profile…** → open dialog → show list of projects to import → confirm
- **Auto-backup** in Application Settings: folder path + trigger (daily / on close)
- All existing v2 data migration handled automatically on first v3 launch

---

### Phase 2 — Theme System & Icon Library

> Formalises v2 CSS variables into a full design token system.

#### CSS token system

Replace implicit SCSS variables with a canonical `tokens.css`:

```css
/* src/renderer/ui/styles/tokens.css */
:root {
  --color-bg-primary: #1a1a2e;
  --color-bg-secondary: #16213e;
  --color-bg-widget: #0f3460;
  --color-accent: #4e9af1;
  --color-accent-hover: #6cb0ff;
  --color-text-primary: #e0e0e0;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #606060;
  --color-border: #2a2a4a;
  --color-danger: #e74c3c;
  --color-success: #2ecc71;
  --color-warning: #f39c12;
  /* + ~30 more semantic tokens */
}
```

All existing `--freeter-*` variables remapped to semantic tokens; backwards-compat aliases kept for one version.

#### Built-in themes

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

Themes stored as JSON token-override files; users can author and share themes.

#### Theme editor (Application Settings panel)

- Color pickers for each semantic token
- Live preview of the running UI
- Export as `.freeter-theme.json` / Import theme file

#### OS auto-theme

- Detect `prefers-color-scheme` via Electron `nativeTheme.shouldUseDarkColors`
- Automatically switch between designated Dark and Light themes
- Configurable in Application Settings: Auto / Always Dark / Always Light

#### Icon library

Replace per-widget single SVG with **Phosphor Icons** (~7 000 icons, MIT):

- Widget icon picker: searchable grid of all Phosphor icons
- Custom icon upload: drag a PNG/SVG onto the picker
- Per-project accent color (color picker → tints the project tab and widget borders)
- All existing v2 SVG icons remapped to equivalent Phosphor icons

---

### Phase 3 — Markdown Editor (Note Widget — Enhanced)

> Fully replaces `tiny-markdown-editor` while preserving all v2 Note widget behaviour.

#### v2 features preserved
- Plain-text mode (no markdown)
- Markdown mode (toggle in settings)
- Spell check toggle
- Copy Full Text action
- Context menu: cut/copy/paste/select all
- Persistent local storage

#### v3 enhancements

Replace `tiny-markdown-editor` with **[CodeMirror 6](https://codemirror.net/)** + `@codemirror/lang-markdown`:

| Feature | Detail |
|---|---|
| Live syntax highlighting | Inside the editor: bold, italic, headings, code spans, fences highlighted |
| Split preview pane | Side-by-side editor + rendered HTML (toggle button) |
| Rendered preview | [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify) |
| Toolbar | Bold · Italic · H1-H3 · Link · Image · Code · Fenced Block · Blockquote · Lists · Horizontal rule · Undo/Redo |
| Theme matching | CodeMirror theme follows active Freeter theme |
| Export | Action bar: export as `.md` file via save dialog |
| Status bar | Word count · character count · cursor position |
| Table support | GFM tables rendered and editable |
| Scroll sync | Editor and preview scroll in sync |

Settings additions: `renderMode` (source / preview / split), `fontSize`, `lineHeight`

---

### Phase 4 — Code Highlighting Widget (New)

A dedicated **Code Snippet** widget for storing and displaying code.

#### Widget design

```
CodeSnippetWidget
  settings: { language, theme, showLineNumbers, wrapLines, label, readOnly }
  storage:  dataStorage.setText('code', rawSource)
```

#### Features

| Feature | Implementation |
|---|---|
| Editor mode | CodeMirror 6 with the target language loaded |
| View mode | [Shiki](https://github.com/shikijs/shiki) static HTML render (200+ languages, TextMate grammars) |
| Languages (day-1) | `typescript` `javascript` `python` `rust` `go` `sql` `bash` `json` `yaml` `html` `css` `csharp` `java` |
| Themes | 10 Shiki/CodeMirror themes (GitHub Light, GitHub Dark, Dracula, Nord, …) |

Action bar: **Copy to Clipboard · Open in External Editor · Export as File**  
Settings: language selector, theme, line numbers toggle, wrap lines toggle

---

### Phase 5 — Password Vault Widget (New)

Store credentials locally, encrypted at rest via the OS Keychain.

#### Security model

- Secrets encrypted with **`safeStorage.encryptString`** (Electron built-in)
  - Windows: DPAPI tied to Windows user session
  - macOS: Keychain Access
  - Linux: libsecret (GNOME Keyring / KWallet)
- No master password stored — encryption is tied to the OS user session
- Vault manifest (entry names, usernames, URLs, notes — **no** passwords) stored as plain JSON in `appDataStorage`
- Passwords fetched on demand; never held in renderer memory beyond a copy-to-clipboard call
- After copying, clipboard is cleared automatically after 30 seconds

#### IPC additions

```ts
ipcSafeStorageEncryptChannel   // main: safeStorage.encryptString(plain) → Base64 cipher
ipcSafeStorageDecryptChannel   // main: safeStorage.decryptString(cipher) → plaintext
```

#### Widget features

- List of credential entries: **site name · username · URL · notes**
- **Copy Username** / **Copy Password** (auto-clear clipboard after 30 s)
- **Reveal Password** — show for 10 s then re-mask
- Add / Edit / Delete entries
- Search/filter by name or URL
- **Password Generator**: configurable length (8–64), uppercase, digits, symbols, no-ambiguous-chars
- Import: CSV (LastPass / Bitwarden format) · JSON
- Export: JSON encrypted with a user-chosen passphrase (AES-256-GCM via Node.js `crypto`)

---

### Phase 6 — Enhanced Webpage / Browser Widget

> All v2 Webpage widget features are preserved; the following are added.

#### v2 features preserved
- URL setting, session scope, session persistence
- Auto-reload with all existing intervals
- CSS injection, JS injection, user-agent override
- Back · Forward · Reload/Stop · Home · Open-in-Browser action bar
- Zoom via context menu
- `openUrl` / `getUrl` API for Web Query integration

#### v3 enhancements

| Feature | Implementation |
|---|---|
| **Address bar** | Editable URL field in the action bar; press Enter to navigate |
| **Navigation history** | Back/Forward buttons visually disabled when at boundary; wired to `canGoBack`/`canGoForward` |
| **Find in page** | `Ctrl+F` → `webview.findInPage(text)` with match counter, next/prev, dismiss |
| **Download manager** | `will-download` event → toast notification with filename + progress |
| **New-window handling** | `new-window` event → open in OS browser or in a new Freeter Webpage widget |
| **Permission prompts** | `permission-request` event → allow / block / remember per-origin |
| **Certificate error UI** | `certificate-error` → inline warning with override option |
| **Dev Tools** | Open Chromium DevTools for the webview (dev builds; action bar button) |
| **Zoom controls** | `setZoomFactor` / `getZoomFactor` — slider or +/- buttons in action bar |
| **Mute audio** | `setAudioMuted` toggle in action bar |
| **Print** | `webview.print()` action bar button |
| **Screenshot** | `webview.capturePage()` → PNG saved via save-file dialog |
| **Reader mode** | Inject [Readability.js](https://github.com/mozilla/readability) + minimal CSS on demand |
| **Keyboard shortcut** | `Ctrl+R` reload · `Ctrl+L` focus address bar · `Ctrl+F` find |

Settings additions: `homePage`, `openLinksIn` (same webview / browser / new Webpage widget), `blockAds` (toggle uBlock-style network filter)

---

### Phase 7 — Timer Widget (Enhanced)

> All v2 Timer features preserved.

#### v2 features preserved
- Countdown from 5–90 min in 5-minute steps
- 35+ end sounds with volume control
- Test Sound in settings
- Play/Pause/Reset controls

#### v3 enhancements

| Feature | Detail |
|---|---|
| **Stopwatch mode** | Count up from 00:00 |
| **Custom duration** | Free-form input (not just 5-min steps) |
| **Multiple timers** | Add up to N named timers in one widget (stack view) |
| **Desktop notification** | Electron `Notification` API when timer ends (configurable) |
| **Pomodoro mode** | 25/5 min work/break cycling; long break after 4 pomodoros |
| **Progress ring** | Visual arc showing remaining time % |
| **Keyboard shortcut** | Space to start/pause, R to reset |

---

### Phase 8 — To-Do List Widget (Enhanced)

> All v2 To-Do List features preserved.

#### v2 features preserved
- Add / edit / reorder (drag-and-drop) / delete items
- Check / uncheck / Uncheck All
- Add at top or bottom

#### v3 enhancements

| Feature | Detail |
|---|---|
| **Due dates** | Optional date picker per task; overdue shown in red |
| **Priority labels** | High / Medium / Low badge |
| **Sub-tasks** | One level of nested tasks under a parent |
| **Tags/Labels** | Colour-coded free-text tags |
| **Filter view** | Show: All / Active / Completed / Overdue / By-tag |
| **Export** | Export as Markdown checklist or JSON |
| **Keyboard shortcuts** | `Enter` = add item, `Ctrl+Enter` = complete, `Delete` = remove |

---

### Phase 9 — Commander Widget (Enhanced)

> All v2 Commander features preserved.

#### v2 features preserved
- Multi-line command list executed in order
- Configurable CWD
- Opens OS default terminal

#### v3 enhancements

| Feature | Detail |
|---|---|
| **Multiple presets** | Several named command groups in one widget; select from dropdown |
| **Inline terminal** | Optional embedded xterm.js terminal in the widget (no OS window) |
| **Environment variables** | Per-widget `ENV=value` overrides |
| **Run on schedule** | Optional cron-style trigger |
| **Status indicator** | Last exit code shown on widget |

---

### Phase 10 — Web Query Widget (Enhanced)

> All v2 Web Query features preserved.

#### v2 features preserved
- Browser App and Webpages modes
- 21 built-in search engines + custom URL template
- Description, query template

#### v3 enhancements

| Feature | Detail |
|---|---|
| **More engines** | GitHub, GitLab, npm, PyPI, MDN, Stack Overflow, Reddit, YouTube, Twitter/X, Hacker News |
| **Quick switch** | Keyboard shortcut to cycle between engines |
| **Instant results** | Optional preview panel showing a Webpage widget with results inline |
| **Search history** | Last N queries stored locally; accessible via dropdown |

---

### Phase 11 — New Widgets

#### 11.1 Code Snippet Widget
*(See Phase 4)*

#### 11.2 Password Vault Widget
*(See Phase 5)*

#### 11.3 Calendar / Agenda Widget

- Month / week / day view (toggle)
- Events stored locally as JSON in `dataStorage`
- iCal `.ics` file import
- Webcal deep-link for OS calendar sync
- Repeating events (daily / weekly / monthly)
- Click event → edit/delete modal

#### 11.4 RSS Feed Reader Widget

- Subscribe to one or more RSS 2.0 / Atom feeds (add URL)
- Show latest N items (configurable, default 10)
- Click item → open in a Webpage widget or OS browser
- Configurable refresh interval: 1 min → 24 h
- Per-item read state stored locally
- Mark all read; filter unread

#### 11.5 System Monitor Widget

- Real-time metrics: CPU %, RAM used/total, Disk I/O, Network I/O
- Polled via Node.js `os` module + [`systeminformation`](https://github.com/sebhildebrandt/systeminformation) package
- Sparkline graphs (last 60 seconds)
- Configurable update interval (1 s · 2 s · 5 s)
- Configurable metrics to display

#### 11.6 Clipboard History Widget

- Main process listens for clipboard changes (`clipboard.readText` polling or native hook)
- Stores last N text items (configurable, default 50)
- Click entry to copy back to clipboard
- Search/filter; pin items to prevent eviction
- Clear history action

#### 11.7 Kanban / Sticky Board Widget

- Multiple columns with custom labels (e.g. To Do / In Progress / Done)
- Cards: title + optional description
- Drag cards between columns
- Card colours (6 options)
- Export board as JSON

#### 11.8 API / HTTP Request Widget

- Request builder: method (GET/POST/PUT/PATCH/DELETE), URL, headers, body (JSON/text)
- Execute and display: status code, response headers, body with code highlighting
- Save named requests; load from dropdown
- Basic auth and Bearer token helpers
- Useful for hitting local dev servers / REST APIs

#### 11.9 Image / Media Widget

- Display a local image or animated GIF
- Configurable fit mode: cover / contain / fill / none
- Slideshow mode: rotate through a folder of images at configurable interval
- Click to open original in OS viewer

---

### Phase 12 — UX & Application Features

#### Command Palette

- `Ctrl+P` / `Cmd+P` opens a fuzzy-search overlay
- Searches: all projects, all workflows, all widget names, app actions (new project, settings, export…)
- Navigate to any workflow in one keystroke
- Execute app commands directly from the palette

#### Project Switcher enhancements

- Per-project **accent color** (color picker → tints the project tab and active widget borders)
- Per-project **icon** (from Phosphor icon picker)

#### Global Search

- `Ctrl+Shift+F` within the app: search across all note widget content
- Results show project / workflow / widget name; click to navigate

#### Multiple Windows

- File → New Window → open a second Freeter window showing any project (for dual-monitor setups)

#### Keyboard Shortcut per Workflow

- Each workflow can have an optional global shortcut (e.g. `Ctrl+Shift+1`) to activate it directly

#### Memory Saver (enhanced)

- v2 deactivation logic preserved and extended
- Configurable idle timeout per workflow
- Visual indicator on inactive workflow tabs

---

### Phase 13 — Plugin / Extension API

Define a stable widget interface so third-party widgets can be distributed as npm packages.

#### Widget package contract

```ts
// A Freeter plugin package exports a widgetType:
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

#### Plugin discovery

Scan `~/.freeter/plugins/` for directories with a `package.json` containing `"freeterPlugin": true`.  
Load via Electron's sandboxed renderer using a plugin host iframe.

---

### Phase 14 — Developer Experience

| Item | Detail |
|---|---|
| **Storybook** | Isolated UI component development; story per widget |
| **Playwright E2E** | End-to-end smoke tests for golden paths per widget |
| **Renovate** | Automated dependency update PRs |
| **Changesets** | Semantic versioning + auto-generated `CHANGELOG.md` |
| **TSDoc** | All IPC channels and widget interfaces documented |
| **Widget dev guide** | `docs/widget-development.md`: step-by-step tutorial |
| **Plugin starter** | `npx create-freeter-plugin` scaffold |

---

## Implementation Phases Summary

| Phase | Version | Scope |
|---|---|---|
| **0** | 3.0.0-alpha.1 | Vite, Vitest, CSS Modules, Zustand 5 — full v2 parity |
| **1** | 3.0.0-alpha.2 | Backup/Restore (JSON) |
| **2** | 3.0.0-beta.1 | Theme system, CSS tokens, Phosphor icons, OS auto-theme |
| **3** | 3.0.0-beta.2 | Note widget: full CodeMirror Markdown editor |
| **4** | 3.0.0-beta.3 | Code Snippet widget (Shiki + CodeMirror) |
| **5** | 3.0.0-beta.4 | Password Vault widget (safeStorage + OS Keychain) |
| **6** | 3.0.0-beta.5 | Webpage widget: address bar, find, downloads, zoom, reader mode |
| **7** | 3.0.0-beta.6 | Timer+, To-Do List+, Commander+, Web Query+ enhancements |
| **8** | 3.0.0-rc.1 | New widgets: Calendar, RSS, System Monitor, Clipboard History |
| **9** | 3.0.0-rc.2 | New widgets: Kanban, API Client, Image/Media |
| **10** | 3.0.0-rc.3 | UX: Command palette, global search, multi-window, per-project color |
| **11** | 3.0.0-rc.4 | Plugin API, plugin discovery |
| **12** | 3.0.0 | Storybook, Playwright E2E, docs, Changesets, plugin scaffold |

---

## Competitor Analysis

Research of Notion, Obsidian, Franz, Station, Wavebox, Rambox, Coda, Dasheroo, Databox, Linear, Height.

| Feature | Source | Phase | Priority |
|---|---|---|---|
| Command palette (`Ctrl+P`) | VS Code, Obsidian | 12 | High |
| Global content search | Obsidian, Notion | 12 | High |
| Dark/light OS auto-switch | All modern apps | 2 | High |
| Widget templates / presets | Notion, Coda | 12 | Medium |
| Per-project accent color | Linear, Height | 12 | Medium |
| Keyboard shortcut per workflow | Station | 12 | Medium |
| Multiple windows (dual monitor) | Wavebox | 12 | Medium |
| Plugin / extension API | Obsidian | 13 | Medium |
| Pomodoro integration | Forest, Focus Bear | 7 | Medium |
| Password manager built-in | — | 5 | Medium |
| In-app code editor | VS Code, Coda | 4 | Medium |
| RSS reader | — | 11 | Medium |
| System status tiles | Datadog, Dasheroo | 11 | Medium |
| Clipboard manager | Alfred, Raycast | 11 | Medium |
| Kanban board | Trello, Notion | 11 | Medium |
| HTTP client | Postman, Insomnia | 11 | Medium |
| Mobile companion (read-only) | Notion | — | Low (long-term) |
| Collaboration / cloud sync | Notion, Coda | — | Low (long-term) |

---

## Tech Stack

| Layer | v2 | v3 |
|---|---|---|
| Shell | Electron 36 | Electron 37+ |
| UI | React 19 + TypeScript 5.5 | React 19 + TypeScript 5.7 |
| State | Zustand 4.5 | Zustand 5 |
| Build | Webpack 5 | **Vite + electron-vite** |
| Styles | SCSS Modules | **CSS Modules + PostCSS** |
| Tests | Jest 29 + Testing Library | **Vitest + Testing Library** |
| Icons | Per-widget SVG | **Phosphor Icons** |
| MD Editor | tiny-markdown-editor | **CodeMirror 6** |
| Code render | — | **Shiki** |
| Packaging | electron-builder 26 | electron-builder (latest) |

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

# Tests
yarn test

# Type-check all layers
yarn test:typecheck
```

---

## Supported Platforms

| OS | Arch |
|---|---|
| Windows 10+ | x64 |
| macOS 10.15+ | x64, Apple Silicon |
| Linux (most distros) | x64 |

---

## License

Freeter is free software licensed under the [GNU General Public License v3.0 or later](COPYING).

Original work © 2024 Alex Kaul. This fork maintained by [@ccasalicchio](https://github.com/ccasalicchio).

[Official homepage](https://freeter.io/) · [Original repository](https://github.com/FreeterApp/Freeter) · [Download](https://freeter.io/download) · [Community](https://community.freeter.io/) · [Roadmap](https://community.freeter.io/topic/2/planned-features)
