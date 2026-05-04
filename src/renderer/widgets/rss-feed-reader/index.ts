import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'rss-feed-reader',
  icon: widgetSvg,
  name: 'RSS Feed Reader',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The RSS Feed Reader widget lets you subscribe to RSS 2.0 and Atom feeds, displaying the latest items with read/unread tracking.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['shell', 'dataStorage']
}

export default widgetType;
