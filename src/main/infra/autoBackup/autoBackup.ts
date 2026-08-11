/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { DataStorage } from '@common/application/interfaces/dataStorage';
import { ObjectManager } from '@common/base/objectManager';
import { buildProfileBackup } from '@/application/useCases/profile/profile';
import { logToFile } from '@/infra/logger/fileLog';

interface AutoBackupConfig {
  enabled: boolean;
  folder: string;
  onClose: boolean;
}

const checkIntervalMsec = 60 * 60 * 1000; // hourly check
const backupDueMsec = 24 * 60 * 60 * 1000; // daily backups
const markerFile = '.freeter-last-backup';

export interface AutoBackup {
  start: () => void;
  stop: () => void;
  /** returns true if an on-close backup was written */
  runOnCloseIfEnabled: () => Promise<boolean>;
}

export function createAutoBackup(
  appDataStorage: DataStorage,
  widgetDataStorageManager: ObjectManager<DataStorage>
): AutoBackup {
  let timer: NodeJS.Timeout | null = null;

  async function readConfig(): Promise<AutoBackupConfig | null> {
    try {
      const appJson = await appDataStorage.getText('app');
      if (!appJson) {
        return null;
      }
      const cfg = JSON.parse(appJson)?.obj?.ui?.appConfig?.autoBackup;
      if (cfg && typeof cfg === 'object' && typeof cfg.folder === 'string') {
        return { enabled: !!cfg.enabled, folder: cfg.folder, onClose: !!cfg.onClose };
      }
      return null;
    } catch {
      return null;
    }
  }

  async function writeBackup(folder: string): Promise<void> {
    const backup = await buildProfileBackup(appDataStorage, widgetDataStorageManager);
    if (!backup) {
      return;
    }
    await fs.mkdir(folder, { recursive: true });
    const name = `freeter-backup-${new Date().toISOString().slice(0, 10)}.json`;
    await fs.writeFile(join(folder, name), JSON.stringify(backup, null, 2), 'utf-8');
    await fs.writeFile(join(folder, markerFile), new Date().toISOString(), 'utf-8');
    logToFile('info', `auto-backup written: ${name}`);
  }

  async function isDue(folder: string): Promise<boolean> {
    try {
      const stat = await fs.stat(join(folder, markerFile));
      return Date.now() - stat.mtimeMs > backupDueMsec;
    } catch {
      return true; // no marker yet
    }
  }

  async function checkAndRun(): Promise<void> {
    try {
      const cfg = await readConfig();
      if (cfg?.enabled && cfg.folder && await isDue(cfg.folder)) {
        await writeBackup(cfg.folder);
      }
    } catch (err) {
      logToFile('warn', `auto-backup failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    start: () => {
      if (!timer) {
        // first check shortly after startup, then hourly
        setTimeout(checkAndRun, 30_000);
        timer = setInterval(checkAndRun, checkIntervalMsec);
      }
    },
    stop: () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    runOnCloseIfEnabled: async () => {
      try {
        const cfg = await readConfig();
        if (cfg?.enabled && cfg.onClose && cfg.folder) {
          await writeBackup(cfg.folder);
          return true;
        }
      } catch (err) {
        logToFile('warn', `on-close backup failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      return false;
    }
  }
}
