# Widget Development Guide

This guide explains how to create a custom widget for Freeter v3.

## Overview

A Freeter widget is a self-contained module that defines:
- A **React component** for the widget's UI
- A **settings editor** React component
- A **settings state** factory
- An **icon** (SVG)

## Project Structure

```
my-widget/
├── icons/
│   ├── index.ts        # Export SVG icons
│   └── widget.svg      # Widget icon (24x24 viewBox)
├── index.ts            # WidgetType definition
├── settings.tsx        # Settings interface + editor component
├── widget.tsx          # Widget component
└── widget.module.scss  # Styles (optional)
```

## Step-by-Step

### 1. Create the Widget Type definition

`index.ts`:
```ts
import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'my-widget-id',          // Unique identifier
  icon: widgetSvg,             // SVG icon string
  name: 'My Widget',           // Display name
  minSize: { w: 2, h: 2 },    // Minimum grid size
  description: 'Description of what my widget does.',
  maximizable: true,           // Can be maximized
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage'] // API modules needed
}

export default widgetType;
```

### 2. Define Settings

`settings.tsx`:
```ts
import { CreateSettingsState, ReactComponent, SettingBlock,
  SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  text: string;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  text: typeof settings.text === 'string' ? settings.text : 'default',
})

function SettingsEditorComp({settings, settingsApi}) {
  return (
    <SettingBlock title='Text'>
      <input value={settings.text}
        onChange={e => settingsApi.updateSettings({text: e.target.value})} />
    </SettingBlock>
  );
}

export const settingsEditorComp = { type: 'react', Comp: SettingsEditorComp };
```

### 3. Create the Widget Component

`widget.tsx`:
```ts
import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';

function WidgetComp({ settings }: WidgetReactComponentProps<Settings>) {
  return <div>{settings.text}</div>;
}

export const widgetComp = { type: 'react', Comp: WidgetComp };
```

### 4. Register the Widget

Add your widget to `src/renderer/widgets/index.ts`:
```ts
import myWidget from './my-widget';

const widgetTypes = [
  // ... existing widgets ...
  myWidget,
];
```

## Widget API

Widgets receive the following props:

```ts
interface WidgetReactComponentProps<TSettings> {
  id: string;           // Unique widget instance ID
  env: WidgetEnv;       // Area (shelf/workflow) + project/workflow IDs
  settings: TSettings;  // Widget settings (your Settings type)
  widgetApi: WidgetApi; // API for clipboard, dataStorage, etc.
  sharedState: SharedState; // Shared app state
}
```

## Available API Modules

Use `requiresApi` in your WidgetType to request access:

| Module | Methods |
|--------|---------|
| `clipboard` | `writeText()`, `writeBookmark()`, `readText()` |
| `dataStorage` | `getText()`, `setText()`, `getJson()`, `setJson()`, `remove()`, `clear()`, `getKeys()` |
| `process` | `getProcessInfo()`, `getSystemMetrics()` |
| `shell` | `openApp()`, `openExternalUrl()`, `openPath()` |
| `terminal` | `execCmdLines()` |
| `widgets` | `getWidgetsInCurrentWorkflow()` |
| `safeStorage` | `encryptString()`, `decryptString()` |

## Testing

Widget tests are in `tests/renderer/widgets/<widget-name>/`:
```ts
import { setupWidgetSut } from '@tests/widgets/setupSut';

it('should render correctly', async () => {
  const { widgetApi } = setupWidgetSut(widgetComp, { text: 'hello' });
  // ... assertions ...
});
```

## Publishing as a Plugin

See the [Plugin API docs](#) for distributing widgets as external plugins.
