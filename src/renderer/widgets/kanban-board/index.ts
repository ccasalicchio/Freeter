import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'kanban-board',
  icon: widgetSvg,
  name: 'Kanban Board',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'The Kanban Board widget lets you manage tasks with a drag-and-drop board. Create columns, add cards, and move them between stages.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage']
}

export default widgetType;
