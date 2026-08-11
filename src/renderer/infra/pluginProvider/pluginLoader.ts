import { PluginManifest } from '@common/base/plugin';
import { WidgetType } from '@/base/widgetType';
import { WidgetSettings } from '@/base/widget';

export interface PluginWidgetType {
  manifest: PluginManifest;
  widgetType: WidgetType<WidgetSettings>;
}

export async function loadPluginWidgetType(
  manifest: PluginManifest,
  loadCode: (path: string) => Promise<string | undefined>
): Promise<PluginWidgetType | null> {
  try {
    const code = await loadCode(manifest.path);
    if (!code) return null;

    const module = { exports: {} as Record<string, unknown> };
    const fn = new Function('module', 'exports', 'require', code);
    fn(module, module.exports, (_id: string) => {
      throw new Error('require() not available in plugins');
    });

    const widgetType = module.exports.default || module.exports.widgetType;
    if (!widgetType || !widgetType.id || !widgetType.widgetComp) {
      return null;
    }

    return {
      manifest,
      widgetType: {
        ...widgetType,
        id: manifest.widgetTypeId,
        name: manifest.widgetName,
        minSize: { w: manifest.widgetMinW, h: manifest.widgetMinH },
      } as WidgetType<WidgetSettings>,
    };
  } catch {
    return null;
  }
}
