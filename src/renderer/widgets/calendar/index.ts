import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'calendar',
  icon: widgetSvg,
  name: 'Calendar',
  minSize: {
    w: 3,
    h: 3
  },
  description: 'The Calendar widget provides a month view for managing events. Click a day to add or view events.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage']
}

export default widgetType;
