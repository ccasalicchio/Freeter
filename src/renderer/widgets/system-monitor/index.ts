import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'system-monitor',
  icon: widgetSvg,
  name: 'System Monitor',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The System Monitor widget displays real-time system metrics including CPU usage and memory usage with sparkline charts.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['process']
}

export default widgetType;
