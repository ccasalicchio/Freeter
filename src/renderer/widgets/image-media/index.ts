import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'image-media',
  icon: widgetSvg,
  name: 'Image / Media',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Image / Media widget allows you to display an image or animated GIF, with configurable fit mode and slideshow capabilities.',
  maximizable: true,
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['shell']
}

export default widgetType;
