/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

/**
 * @fileoverview
 * IPC channel definitions for Freeter.
 * Each channel has typed Args (arguments sent from renderer to main)
 * and Res (response value sent from main to renderer).
 * All channels are prefixed with 'freeter:' by makeIpcChannelName().
 */

import { MenuItemsIpc } from '@common/base/menu';
import { ProcessInfo, SystemMetrics } from '@common/base/process';
import { PluginManifest } from '@common/base/plugin';
import { makeIpcChannelName } from '@common/ipc/ipc';
import { HttpRequestConfig, HttpResponse } from '@common/base/http';
import { ExecFileResult } from '@common/base/exec';
import { MessageBoxConfig, MessageBoxResult, OpenDialogResult, OpenDirDialogConfig, OpenFileDialogConfig, SaveDialogResult, SaveFileDialogConfig } from '@common/base/dialog';

/** Get a text value from application-level data storage. */
export const ipcAppDataStorageGetTextChannel = makeIpcChannelName('app-data-storage-get-text');
export type IpcAppDataStorageGetTextArgs = [key: string];
export type IpcAppDataStorageGetTextRes = string | undefined;

/** Set a text value in application-level data storage. */
export const ipcAppDataStorageSetTextChannel = makeIpcChannelName('app-data-storage-set-text');
export type IpcAppDataStorageSetTextArgs = [key: string, text: string];
export type IpcAppDataStorageSetTextRes = void;

export const ipcAppDataStorageDeleteChannel = makeIpcChannelName('app-data-storage-delete');
export type IpcAppDataStorageDeleteArgs = [key: string];
export type IpcAppDataStorageDeleteRes = void;

export const ipcAppDataStorageClearChannel = makeIpcChannelName('app-data-storage-clear');
export type IpcAppDataStorageClearArgs = [];
export type IpcAppDataStorageClearRes = void;

export const ipcAppDataStorageGetKeysChannel = makeIpcChannelName('app-data-storage-get-keys');
export type IpcAppDataStorageGetKeysArgs = [];
export type IpcAppDataStorageGetKeysRes = string[];

export const ipcWidgetDataStorageGetTextChannel = makeIpcChannelName('widget-data-storage-get-text');
export type IpcWidgetDataStorageGetTextArgs = [widgetId: string, key: string];
export type IpcWidgetDataStorageGetTextRes = string | undefined;

export const ipcWidgetDataStorageSetTextChannel = makeIpcChannelName('widget-data-storage-set-text');
export type IpcWidgetDataStorageSetTextArgs = [widgetId: string, key: string, text: string];
export type IpcWidgetDataStorageSetTextRes = void;

export const ipcWidgetDataStorageDeleteChannel = makeIpcChannelName('widget-data-storage-delete');
export type IpcWidgetDataStorageDeleteArgs = [widgetId: string, key: string];
export type IpcWidgetDataStorageDeleteRes = void;

export const ipcWidgetDataStorageClearChannel = makeIpcChannelName('widget-data-storage-clear');
export type IpcWidgetDataStorageClearArgs = [widgetId: string];
export type IpcWidgetDataStorageClearRes = void;

export const ipcWidgetDataStorageGetKeysChannel = makeIpcChannelName('widget-data-storage-get-keys');
export type IpcWidgetDataStorageGetKeysArgs = [widgetId: string];
export type IpcWidgetDataStorageGetKeysRes = string[];

export const ipcCopyWidgetDataStorageChannel = makeIpcChannelName('copt-widget-data-storage');
export type IpcCopyWidgetDataStorageArgs = [srcWidgetId: string, toWidgetId: string];
export type IpcCopyWidgetDataStorageRes = boolean;

export const ipcPopupOsContextMenuChannel = makeIpcChannelName('popup-os-context-menu');
export type IpcPopupOsContextMenuArgs = [menuItems: MenuItemsIpc];
export type IpcPopupOsContextMenuRes = number | undefined;

export const ipcShellOpenAppChannel = makeIpcChannelName('shell-open-app');
export type IpcShellOpenAppArgs = [appPath: string, args?: string[]];
export type IpcShellOpenAppRes = void;

export const ipcShellOpenExternalUrlChannel = makeIpcChannelName('shell-open-external-url');
export type IpcShellOpenExternalUrlArgs = [url: string];
export type IpcShellOpenExternalUrlRes = void;

export const ipcShellOpenPathChannel = makeIpcChannelName('shell-open-path');
export type IpcShellOpenPathArgs = [path: string];
export type IpcShellOpenPathRes = string;

export const ipcWriteBookmarkIntoClipboardChannel = makeIpcChannelName('write-bookmark-into-clipboard');
export type IpcWriteBookmarkIntoClipboardArgs = [title: string, url: string];
export type IpcWriteBookmarkIntoClipboardRes = void;

export const ipcWriteTextIntoClipboardChannel = makeIpcChannelName('write-text-into-clipboard');
export type IpcWriteTextIntoClipboardArgs = [text: string];
export type IpcWriteTextIntoClipboardRes = void;

export const ipcReadTextFromClipboardChannel = makeIpcChannelName('read-text-from-clipboard');
export type IpcReadTextFromClipboardArgs = [];
export type IpcReadTextFromClipboardRes = string;

export const ipcGetProcessInfoChannel = makeIpcChannelName('get-process-info');
export type IpcGetProcessInfoArgs = [];
export type IpcGetProcessInfoRes = ProcessInfo;

export const ipcGetSystemMetricsChannel = makeIpcChannelName('get-system-metrics');
export type IpcGetSystemMetricsArgs = [];
export type IpcGetSystemMetricsRes = SystemMetrics;

export const ipcShowOsMessageBoxChannel = makeIpcChannelName('show-os-message-box');
export type IpcShowOsMessageBoxArgs = [config: MessageBoxConfig];
export type IpcShowOsMessageBoxRes = MessageBoxResult;

export const ipcShowOsOpenFileDialogChannel = makeIpcChannelName('show-os-open-file-dialog');
export type IpcShowOsOpenFileDialogArgs = [config: OpenFileDialogConfig];
export type IpcShowOsOpenFileDialogRes = OpenDialogResult;

export const ipcShowOsSaveFileDialogChannel = makeIpcChannelName('show-os-save-file-dialog');
export type IpcShowOsSaveFileDialogArgs = [config: SaveFileDialogConfig];
export type IpcShowOsSaveFileDialogRes = SaveDialogResult;

export const ipcShowOsOpenDirDialogChannel = makeIpcChannelName('show-os-open-dir-dialog');
export type IpcShowOsOpenDirDialogArgs = [config: OpenDirDialogConfig];
export type IpcShowOsOpenDirDialogRes = OpenDialogResult;

export const ipcSetAppMenuChannel = makeIpcChannelName('set-app-menu');
export type IpcSetAppMenuArgs = [menuItems: MenuItemsIpc];
export type IpcSetAppMenuRes = void;


export const ipcSetAppMenuAutoHideChannel = makeIpcChannelName('set-app-menu-auto-hide');
export type IpcSetAppMenuAutoHideArgs = [autoHide: boolean];
export type IpcSetAppMenuAutoHideRes = void;

export const ipcClickAppMenuActionChannel = makeIpcChannelName('click-app-menu-action');
export type IpcClickAppMenuActionArgs = [actionId: number];

export const ipcSetMainShortcutChannel = makeIpcChannelName('set-main-shortcut');
export type IpcSetMainShortcutArgs = [accelerator: string];
export type IpcSetMainShortcutRes = boolean;

export const ipcSetTrayMenuChannel = makeIpcChannelName('set-tray-menu');
export type IpcSetTrayMenuArgs = [menuItems: MenuItemsIpc];
export type IpcSetTrayMenuRes = void;

export const ipcClickTrayMenuActionChannel = makeIpcChannelName('click-tray-menu-action');
export type IpcClickTrayMenuActionArgs = [actionId: number];

export const ipcShowBrowserWindowChannel = makeIpcChannelName('show-browser-window');
export type IpcShowBrowserWindowArgs = [];
export type IpcShowBrowserWindowRes = void;


export const ipcExecCmdLinesInTerminalChannel = makeIpcChannelName('exec-cmd-lines-in-terminal');
export type IpcExecCmdLinesInTerminalArgs = [cmdLines: ReadonlyArray<string>, cwd?: string];
export type IpcExecCmdLinesInTerminalRes = void;

export const ipcSafeStorageEncryptChannel = makeIpcChannelName('safe-storage-encrypt');
export type IpcSafeStorageEncryptArgs = [plainText: string];
export type IpcSafeStorageEncryptRes = string;

export const ipcSafeStorageDecryptChannel = makeIpcChannelName('safe-storage-decrypt');
export type IpcSafeStorageDecryptArgs = [encryptedText: string];
export type IpcSafeStorageDecryptRes = string;

export const ipcGetPluginsChannel = makeIpcChannelName('get-plugins');
export type IpcGetPluginsArgs = [];
export type IpcGetPluginsRes = PluginManifest[];

export const ipcLoadPluginChannel = makeIpcChannelName('load-plugin');
export type IpcLoadPluginArgs = [pluginPath: string];
export type IpcLoadPluginRes = string | undefined;

export const ipcExportProfileChannel = makeIpcChannelName('export-profile');
export type IpcExportProfileArgs = [];
export type IpcExportProfileRes = boolean;

export const ipcImportProfileChannel = makeIpcChannelName('import-profile');
export type IpcImportProfileArgs = [];
export type IpcImportProfileRes = string | undefined;

/** Find text on the current page (native Chromium find with highlights). */
export const ipcFindInPageChannel = makeIpcChannelName('find-in-page');
export type IpcFindInPageArgs = [text: string, forward: boolean, findNext: boolean];
export type IpcFindInPageRes = void;

export const ipcStopFindInPageChannel = makeIpcChannelName('stop-find-in-page');
export type IpcStopFindInPageArgs = [];
export type IpcStopFindInPageRes = void;

/** Perform an HTTP request from the main process (no renderer CSP/CORS limits). */
export const ipcHttpRequestChannel = makeIpcChannelName('http-request');
export type IpcHttpRequestArgs = [config: HttpRequestConfig];
export type IpcHttpRequestRes = HttpResponse;

/** Execute a program and capture its output (no shell; args passed directly). */
export const ipcExecFileChannel = makeIpcChannelName('exec-file');
export type IpcExecFileArgs = [cmd: string, args: string[], cwd?: string];
export type IpcExecFileRes = ExecFileResult;

/** Apply MCP server config (start/stop/restart the localhost MCP endpoint). */
export const ipcSetMcpConfigChannel = makeIpcChannelName('set-mcp-config');
export type IpcSetMcpConfigArgs = [config: { enabled: boolean; port: number; token: string; allowExternal?: boolean }];
export type IpcSetMcpConfigRes = void;

/** Enable/disable launching Freeter at OS startup. */
export const ipcSetLoginItemSettingsChannel = makeIpcChannelName('set-login-item-settings');
export type IpcSetLoginItemSettingsArgs = [openAtLogin: boolean];
export type IpcSetLoginItemSettingsRes = void;
