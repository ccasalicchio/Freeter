import { Controller } from '@/controllers/controller';
import { ipcExportProfileChannel, IpcExportProfileArgs, IpcExportProfileRes, ipcImportProfileChannel, IpcImportProfileArgs, IpcImportProfileRes } from '@common/ipc/channels';
import { DataStorage } from '@common/application/interfaces/dataStorage';
import { ObjectManager } from '@common/base/objectManager';
import { exportProfile, importProfile } from '@/application/useCases/profile/profile';
import { BrowserWindow } from 'electron';
import * as fs from 'node:fs/promises';

type Deps = {
  appDataStorage: DataStorage;
  widgetDataStorageManager: ObjectManager<DataStorage>;
  getBrowserWindow: () => BrowserWindow | null;
}

function createShowSaveDialog(getBrowserWindow: () => BrowserWindow | null) {
  return async (): Promise<string | undefined> => {
    const win = getBrowserWindow();
    if (!win) {
      return undefined;
    }
    const { canceled, filePath } = await import('electron').then(e => e.dialog.showSaveDialog(win, {
      title: 'Export Freeter Profile',
      defaultPath: `freeter-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'Freeter Backup', extensions: ['json'] }],
    }));
    if (canceled || !filePath) {
      return undefined;
    }
    return filePath;
  };
}

function createShowOpenDialog(getBrowserWindow: () => BrowserWindow | null) {
  return async (): Promise<string | undefined> => {
    const win = getBrowserWindow();
    if (!win) {
      return undefined;
    }
    const { canceled, filePaths } = await import('electron').then(e => e.dialog.showOpenDialog(win, {
      title: 'Import Freeter Profile',
      filters: [
        { name: 'Freeter Backup / Freeter 1 Data', extensions: ['json', 'freeterdata'] },
        { name: 'Freeter Backup', extensions: ['json'] },
        { name: 'Freeter 1 Data File', extensions: ['freeterdata'] }
      ],
      properties: ['openFile'],
    }));
    if (canceled || !filePaths || filePaths.length === 0) {
      return undefined;
    }
    return filePaths[0];
  };
}

export function createProfileControllers({
  appDataStorage,
  widgetDataStorageManager,
  getBrowserWindow,
}: Deps): [
    Controller<IpcExportProfileArgs, IpcExportProfileRes>,
    Controller<IpcImportProfileArgs, IpcImportProfileRes>,
  ] {
  return [{
    channel: ipcExportProfileChannel,
    handle: async () => {
      try {
        return await exportProfile(
          appDataStorage,
          widgetDataStorageManager,
          async (path, data) => fs.writeFile(path, data, 'utf-8'),
          createShowSaveDialog(getBrowserWindow)
        );
      } catch {
        return false;
      }
    }
  }, {
    channel: ipcImportProfileChannel,
    handle: async () => {
      try {
        return await importProfile(
          appDataStorage,
          widgetDataStorageManager,
          async (path) => fs.readFile(path, 'utf-8'),
          createShowOpenDialog(getBrowserWindow)
        );
      } catch {
        return undefined;
      }
    }
  }]
}
