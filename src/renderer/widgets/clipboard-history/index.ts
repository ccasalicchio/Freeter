import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'clipboard-history',
  icon: widgetSvg,
  name: 'Clipboard History',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Clipboard History widget tracks text you copy to the clipboard, allowing you to search, pin, and re-copy previous entries.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['clipboard', 'dataStorage']
}

export default widgetType;
