# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Context

Freeter is a free, open-source productivity dashboard app (Electron + React + TypeScript). This repo is a **fork** of [FreeterApp/Freeter](https://github.com/FreeterApp/Freeter) carrying a v3 upgrade (`3.0.0-alpha.1`). The v3 roadmap lives in `README.md` and `v3-plan.md`; the guiding principle is that **every v2 feature is preserved** — nothing is removed. Base branch for feature work is `upgrade/v3-roadmap`.

License is GPL-3.0-or-later; source files carry a copyright header comment — include it in new files.

## Commands

```bash
yarn dev                # Run app in dev mode with HMR (electron-vite)
yarn prod               # Production build to dist/
yarn prod:run           # Run the production build
yarn package            # Package installers (electron-builder)

yarn test               # Vitest (watch mode in a TTY)
yarn vitest run         # Single test-suite pass
yarn vitest run tests/renderer/base/list.spec.ts       # Single file
yarn vitest run -t "test name"                         # Single test by name
yarn test:typecheck     # tsc --noEmit for renderer, main, and common test projects

yarn lint               # ESLint over all areas
yarn lint:renderer      # Per-area: lint:common, lint:main, lint:renderer,
                        # lint:tests:{common,main,renderer,utils}; add :fix to autofix
```

CI (Node 20, yarn) runs `test` → `prod` → `lint` → `test:typecheck`; all four must pass for a change to be green.

Both `yarn.lock` and `package-lock.json` are tracked, but yarn is the package manager (CI uses `yarn install`).

## Architecture

### Electron process split

Three build targets defined in `electron.vite.config.ts`:

- `src/main` — Electron main process. Entry `src/main/index.ts`.
- `src/renderer/preload` — preload script bridging main and renderer.
- `src/renderer` — React 19 UI. Entry `src/renderer/index.tsx` → `init.ts`.
- `src/common` — code shared by both processes.

Path aliases: `@` resolves to the current process root (`src/main` in main, `src/renderer` in renderer/preload), `@common` → `src/common`. Tests add `@tests`, `@testscommon`, `@utils`.

### Clean architecture layering (both main and renderer)

Each process follows the same layered structure; dependencies point inward:

- `base/` — pure domain models and functions (entities, `widget`, `workflow`, `project`, state shape). No I/O, no React.
- `application/interfaces/` — abstract provider/storage interfaces (e.g. `dataStorage`, `shellProvider`, `store`).
- `application/useCases/` — one factory-created use case per action (e.g. `createSwitchProjectUseCase`), taking interfaces as dependencies.
- `infra/` — concrete implementations of the interfaces (IPC-backed providers in renderer; Electron API wrappers in main).
- `data/` — storage/store creation.
- Renderer-only: `ui/` (components, hooks, view-models) and `widgets/`.

Everything is wired by hand-rolled dependency injection in composition roots: `src/renderer/init.ts` builds use cases → view-model hooks → components via `create*` factories; `src/main/index.ts` wires controllers to infra. When adding a feature, follow this chain — a new use case must be created and injected in the composition root, not imported directly by a component.

### IPC

All channels are declared with typed `Args`/`Res` pairs in `src/common/ipc/channels.ts` (prefixed `freeter:`). Main-process handlers live in `src/main/controllers/*`; the renderer never touches `ipcRenderer` directly — it goes through preload plus `src/renderer/infra/*` providers implementing the `application/interfaces` contracts. To add an IPC capability: channel types in common → controller in main → infra provider in renderer → interface in `application/interfaces`.

### State management

A single Zustand vanilla store (`src/renderer/data/appStore`) holds the whole app state, whose shape is defined in `src/renderer/base/state/` (`entities`, `ui`, `shared`). Components read it through the custom `useAppState` hook (`src/renderer/ui/hooks/appState.ts`, shallow-equality by default). State mutations happen only inside use cases via the action helpers in `base/state/actions` — never directly in components. Persistence is JSON text files in the OS app-data directory through the `dataStorage` abstraction; widget data is stored per widget ID.

### Widgets

Each widget is a self-contained module in `src/renderer/widgets/<name>/` with `index.ts` (a `WidgetType` definition), `settings.tsx`, `widget.tsx`, and `icons/`; it is registered in `src/renderer/widgets/index.ts`. Widgets import shared app types/components **only** from `@/widgets/appModules` and reach system capabilities through the `WidgetApi` granted by `requiresApi`. Use `_template/` as a starter and see `docs/widget-development.md` for the full guide. An external-plugin scaffold lives in `packages/create-freeter-plugin`.

### Tests

`tests/{common,main,renderer}` mirror the `src` structure with `*.spec.ts(x)` files; shared fixtures/builders are in `tests/utils`. Each test area has its own `tsconfig.json` and ESLint config, checked by `yarn test:typecheck` and `yarn lint:tests:*`.

## Gotchas

- **Trust `package.json` over the README for commands.** The README's "Building from Source" section documents scripts that no longer exist (e.g. `yarn dev:no-react-devtools`).
- **Non-functional scaffolding exists** — don't assume these work: `e2e/` + `playwright.config.ts` (`@playwright/test` is not a dependency, and nothing serves the configured `baseURL` localhost:4000), `.storybook/` (no Storybook dependencies or scripts), `.changeset/` (no changesets dependency), and `jest.config.js` (v2 leftover; Vitest via `vitest.config.ts` is the test runner).
