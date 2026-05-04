import { DataStorage } from '@common/application/interfaces/dataStorage';
import { ObjectManager } from '@common/base/objectManager';

interface WidgetDataBackup {
  [key: string]: string;
}

interface WidgetBackup {
  id: string;
  data: WidgetDataBackup;
}

interface ProfileBackup {
  version: number;
  exportedAt: string;
  freeterVersion: string;
  appSettings: unknown;
  projects: unknown[];
  shelf: unknown;
  widgetsData: WidgetBackup[];
}

async function collectWidgetData(widgetIds: string[], widgetDataStorageManager: ObjectManager<DataStorage>): Promise<WidgetBackup[]> {
  const result: WidgetBackup[] = [];
  for (const id of widgetIds) {
    try {
      const storage = await widgetDataStorageManager.getObject(id);
      const keys = await storage.getKeys();
      const data: WidgetDataBackup = {};
      for (const key of keys) {
        const val = await storage.getText(key);
        if (val !== undefined) {
          data[key] = val;
        }
      }
      if (Object.keys(data).length > 0) {
        result.push({ id, data });
      }
    } catch {
      // skip widgets whose storage can't be read
    }
  }
  return result;
}

function extractWidgetIds(appSettingsJson: string): string[] {
  try {
    const parsed = JSON.parse(appSettingsJson);
    const data = parsed?.data;
    if (!data) {
      return [];
    }
    const entities = data.entities || data;
    const widgets = entities.widgets || {};
    return Object.keys(widgets);
  } catch {
    return [];
  }
}

export async function exportProfile(
  appDataStorage: DataStorage,
  widgetDataStorageManager: ObjectManager<DataStorage>,
  writeFile: (path: string, data: string) => Promise<void>,
  showSaveDialog: () => Promise<string | undefined>
): Promise<boolean> {
  const appSettingsJson = await appDataStorage.getText('app');
  if (!appSettingsJson) {
    return false;
  }

  const filePath = await showSaveDialog();
  if (!filePath) {
    return false;
  }

  const widgetIds = extractWidgetIds(appSettingsJson);
  const widgetsData = await collectWidgetData(widgetIds, widgetDataStorageManager);

  let appSettings: unknown;
  try {
    appSettings = JSON.parse(appSettingsJson);
  } catch {
    appSettings = appSettingsJson;
  }

  const backup: ProfileBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    freeterVersion: '3.0.0',
    appSettings,
    projects: [],
    shelf: null,
    widgetsData,
  };

  await writeFile(filePath, JSON.stringify(backup, null, 2));
  return true;
}

export async function importProfile(
  appDataStorage: DataStorage,
  widgetDataStorageManager: ObjectManager<DataStorage>,
  readFile: (path: string) => Promise<string>,
  showOpenDialog: () => Promise<string | undefined>
): Promise<string | undefined> {
  const filePath = await showOpenDialog();
  if (!filePath) {
    return undefined;
  }

  const content = await readFile(filePath);
  let backup: ProfileBackup;
  try {
    backup = JSON.parse(content);
  } catch {
    return undefined;
  }

  if (!backup || backup.version !== 1) {
    return undefined;
  }

  if (backup.widgetsData) {
    for (const wb of backup.widgetsData) {
      try {
        const storage = await widgetDataStorageManager.getObject(wb.id);
        for (const [key, val] of Object.entries(wb.data)) {
          await storage.setText(key, val);
        }
      } catch {
        // skip widgets that can't be written
      }
    }
  }

  if (backup.appSettings) {
    const appJson = typeof backup.appSettings === 'string'
      ? backup.appSettings
      : JSON.stringify(backup.appSettings);
    await appDataStorage.setText('app', appJson);
  }

  return content;
}
