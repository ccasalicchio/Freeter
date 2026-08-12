/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { MemSaverConfigApp } from '@/base/memSaver';

export interface AutoBackupConfig {
  enabled: boolean;
  folder: string;
  /** also run a backup when the app closes */
  onClose: boolean;
}

export interface McpConfig {
  enabled: boolean;
  port: number;
  token: string;
  /** also accept connections from WSL / other devices (binds all interfaces) */
  allowExternal: boolean;
}

export interface ShortcutsConfig {
  /** modifier for project switching with 1..9 */
  projectSwitch: 'ctrl' | 'ctrl+shift' | 'off';
  /** modifier for workflow switching with 1..9 */
  workflowSwitch: 'alt' | 'alt+shift' | 'off';
  /** edit-mode toggle key */
  editModeToggle: 'ctrl+e' | 'off';
}

export interface AppConfig {
  mainHotkey: string;
  memSaver: MemSaverConfigApp;
  uiTheme: string;
  autoBackup: AutoBackupConfig;
  launchAtStartup: boolean;
  mcp: McpConfig;
  shortcuts: ShortcutsConfig;
  /** per-variable overrides applied on top of the selected theme */
  themeOverrides: Record<string, string>;
}

export function createDefaultAutoBackupConfig(): AutoBackupConfig {
  return { enabled: false, folder: '', onClose: false };
}

export function createDefaultMcpConfig(): McpConfig {
  return { enabled: false, port: 39587, token: '', allowExternal: false };
}

export function createDefaultShortcutsConfig(): ShortcutsConfig {
  return { projectSwitch: 'ctrl', workflowSwitch: 'alt', editModeToggle: 'ctrl+e' };
}
