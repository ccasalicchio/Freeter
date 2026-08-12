/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * @fileoverview Widget API interfaces for Freeter widgets.
 * These interfaces define the communication layer between widgets and the Freeter application.
 */

import { EntityId } from '@/base/entity';
import { WidgetContextMenuFactory } from '@/base/widget';
import { ActionBarItems } from './actionBar';
import { ProcessInfo, SystemMetrics } from '@common/base/process';
import { HttpRequestConfig, HttpResponse } from '@common/base/http';
import { ExecFileResult } from '@common/base/exec';
import { OpenDialogResult, OpenDirDialogConfig, OpenFileDialogConfig } from '@common/base/dialog';

/**
 * Common API methods available to all widgets.
 * These are always present regardless of requiresApi configuration.
 */
interface WidgetApiCommon {
  /** Update the action bar items displayed for this widget. */
  readonly updateActionBar: (actionBarItems: ActionBarItems) => void;
  /** Set a factory function that creates context menu items for this widget. */
  readonly setContextMenuFactory: (factory: WidgetContextMenuFactory) => void;
  /**
   * Expose an API object for consumption by other widgets.
   * Other widgets can access this via WidgetAPI.widgets.getWidgetsInCurrentWorkflow().
   */
  readonly exposeApi: <T extends object>(api: T) => void;
}

/**
 * Represents another widget's exposed API, retrieved via WidgetAPI.widgets.
 */
export interface WidgetApiWidget<T extends object = object> {
  id: EntityId;
  name: string;
  /** The API exposed by the widget via exposeApi(). */
  api: Partial<T>;
}

/**
 * API modules available to widgets via the requiresApi configuration.
 * Request access by adding module names to the WidgetType.requiresApi array.
 */
interface WidgetApiModules {
  /** Clipboard operations for reading/writing text and bookmarks. */
  readonly clipboard: {
    /** Write a bookmark (title + URL) to the system clipboard (macOS/Windows). */
    writeBookmark: (title: string, url: string) => Promise<void>;
    /** Write plain text to the system clipboard. */
    writeText: (text: string) => Promise<void>;
    /** Read plain text from the system clipboard. */
    readText: () => Promise<string>;
  };
  /** Per-widget persistent key-value storage. Each widget has isolated storage. */
  readonly dataStorage: {
    getText: (key: string) => Promise<string | undefined>;
    setText: (key: string, value: string) => Promise<void>;
    getJson: (key: string) => Promise<unknown | undefined>;
    setJson: (key: string, value: unknown) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getKeys: () => Promise<string[]>;
  };
  readonly process: {
    getProcessInfo: () => ProcessInfo;
    getSystemMetrics: () => Promise<SystemMetrics>;
    execFile: (cmd: string, args: string[], cwd?: string) => Promise<ExecFileResult>;
  };
  readonly http: {
    request: (config: HttpRequestConfig) => Promise<HttpResponse>;
  };
  readonly shell: {
    openApp: (appPath: string, args?: string[]) => Promise<void>;
    openExternalUrl: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<string>;
  };
  readonly terminal: {
    execCmdLines: (cmdLines: ReadonlyArray<string>, cwd?: string) => void;
  }
  readonly widgets: {
    getWidgetsInCurrentWorkflow<T extends object>(widgetTypeId: string): ReadonlyArray<WidgetApiWidget<T>>;
  }
  readonly safeStorage: {
    encryptString: (plainText: string) => Promise<string>;
    decryptString: (encryptedText: string) => Promise<string>;
  }
}

export type WidgetApiModuleName = keyof WidgetApiModules;

export interface WidgetApi extends WidgetApiCommon, WidgetApiModules { }

export type WidgetApiUpdateActionBarHandler = (actionBarItems: ActionBarItems) => void;
export type WidgetApiSetContextMenuFactoryHandler = (factory: WidgetContextMenuFactory) => void;
export type WidgetApiExposeApiHandler = (api: object) => void;
export type WidgetApiCommonFactory = (
  widgetId: EntityId,
  updateActionBarHandler: WidgetApiUpdateActionBarHandler,
  setContextMenuFactoryHandler: WidgetApiSetContextMenuFactoryHandler,
  exposeApiHandler: WidgetApiExposeApiHandler
) => WidgetApiCommon;
type WidgetApiModuleFactory<N extends WidgetApiModuleName> = (widgetId: EntityId) => WidgetApiModules[N];
export type WidgetApiModuleFactories = {
  [N in WidgetApiModuleName]: WidgetApiModuleFactory<N>;
};

export type WidgetApiFactory = (
  widgetId: EntityId,
  updateActionBarHandler: WidgetApiUpdateActionBarHandler,
  setContextMenuFactoryHandler: WidgetApiSetContextMenuFactoryHandler,
  exposeApiHandler: WidgetApiExposeApiHandler,
  availableModules: WidgetApiModuleName[]
) => WidgetApi;

export function createWidgetApiFactory(commonFactory: WidgetApiCommonFactory, moduleFactories: WidgetApiModuleFactories): WidgetApiFactory {
  return (
    widgetId: EntityId,
    updateActionBarHandler: WidgetApiUpdateActionBarHandler,
    setContextMenuFactoryHandler: WidgetApiSetContextMenuFactoryHandler,
    exposeApiHandler: WidgetApiExposeApiHandler,
    availableModules: WidgetApiModuleName[]
  ) => ({
    ...commonFactory(widgetId, updateActionBarHandler, setContextMenuFactoryHandler, exposeApiHandler),
    ...Object.fromEntries(availableModules.map(featName => ([featName, moduleFactories[featName](widgetId)])))
  } as WidgetApi);
}

export interface WidgetSettingsApi<TSettings> {
  readonly updateSettings: (newSettings: TSettings) => void;
  readonly dialog: {
    showAppManager: () => void;
    showOpenFileDialog: (cfg: OpenFileDialogConfig) => Promise<OpenDialogResult>;
    showOpenDirDialog: (cfg: OpenDirDialogConfig) => Promise<OpenDialogResult>;
  }
}
