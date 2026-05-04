import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'code-snippet',
  icon: widgetSvg,
  name: 'Code Snippet',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'The Code Snippet widget lets you store and edit code snippets with language-specific display, line numbers, and copy-to-clipboard support.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['clipboard', 'dataStorage']
}

export default widgetType;
