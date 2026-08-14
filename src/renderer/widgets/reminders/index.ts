/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'reminders',
  icon: widgetSvg,
  name: 'Reminders',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Reminders widget keeps a list of timed reminders and shows a desktop notification when each one comes due.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage', 'notification']
}

export default widgetType;
