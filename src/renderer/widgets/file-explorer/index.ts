/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'file-explorer',
  icon: widgetSvg,
  name: 'File Explorer',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The File Explorer widget shows a read-only listing of a folder, letting you browse into subfolders and open files or folders with the default apps.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['fs', 'shell']
}

export default widgetType;
