export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  widgetTypeId: string;
  widgetName: string;
  widgetMinW: number;
  widgetMinH: number;
  path: string;
}
