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

export interface AppConfig {
  mainHotkey: string;
  memSaver: MemSaverConfigApp;
  uiTheme: string;
  autoBackup: AutoBackupConfig;
  /** per-variable overrides applied on top of the selected theme */
  themeOverrides: Record<string, string>;
}

export function createDefaultAutoBackupConfig(): AutoBackupConfig {
  return { enabled: false, folder: '', onClose: false };
}
