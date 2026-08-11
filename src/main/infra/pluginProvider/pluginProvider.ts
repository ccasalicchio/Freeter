import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { app } from 'electron';
import { PluginManifest } from '@common/base/plugin';

const pluginsDir = path.join(app.getPath('appData'), 'freeter2', 'plugins');

export interface PluginProvider {
  getPlugins: () => Promise<PluginManifest[]>;
  loadPluginCode: (pluginPath: string) => Promise<string | undefined>;
}

async function scanPluginsDir(): Promise<PluginManifest[]> {
  const results: PluginManifest[] = [];
  try {
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const pkgPath = path.join(pluginsDir, entry.name, 'package.json');
      try {
        const pkgRaw = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgRaw);
        if (pkg.freeterPlugin && pkg.freeterWidget) {
          results.push({
            name: pkg.name || entry.name,
            version: pkg.version || '1.0.0',
            description: pkg.description || '',
            widgetTypeId: pkg.freeterWidget.typeId || `plugin-${entry.name}`,
            widgetName: pkg.freeterWidget.name || entry.name,
            widgetMinW: pkg.freeterWidget.minW || 2,
            widgetMinH: pkg.freeterWidget.minH || 2,
            path: path.join(pluginsDir, entry.name),
          });
        }
      } catch {
        // skip invalid plugin packages
      }
    }
  } catch {
    // plugins directory doesn't exist yet
  }
  return results;
}

export function createPluginProvider(): PluginProvider {
  return {
    getPlugins: async () => scanPluginsDir(),
    loadPluginCode: async (pluginPath: string) => {
      try {
        const indexPath = path.join(pluginPath, 'index.js');
        return await fs.readFile(indexPath, 'utf-8');
      } catch {
        const indexPath = path.join(pluginPath, 'index.mjs');
        try {
          return await fs.readFile(indexPath, 'utf-8');
        } catch {
          return undefined;
        }
      }
    },
  };
}
