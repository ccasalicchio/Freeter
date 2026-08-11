
import { PluginManager, createPluginManager } from '@/infra/pluginProvider/pluginProvider';
import { loadPluginWidgetType } from '@/infra/pluginProvider/pluginLoader';
import { registerWidgetType } from '@/widgets';

let pluginManager: PluginManager | null = null;

export function initPluginManager(): PluginManager {
  if (!pluginManager) {
    pluginManager = createPluginManager();
  }
  return pluginManager;
}

export async function loadAndRegisterPlugins(): Promise<void> {
  const mgr = initPluginManager();
  try {
    const manifests = await mgr.getPlugins();
    for (const manifest of manifests) {
      const pluginWidget = await loadPluginWidgetType(manifest, (path) => mgr.loadPluginCode(path));
      if (pluginWidget) {
        registerWidgetType(pluginWidget.widgetType);
      }
    }
  } catch {
    // Plugin loading errors are non-fatal
  }
}
