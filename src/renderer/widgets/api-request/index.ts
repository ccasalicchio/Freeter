import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'api-request',
  icon: widgetSvg,
  name: 'API Request',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'The API Request widget lets you send HTTP requests to REST APIs and view responses. Supports GET, POST, PUT, PATCH, DELETE with custom headers and body.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage', 'http']
}

export default widgetType;
