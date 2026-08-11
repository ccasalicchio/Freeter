/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'app-launcher',
  icon: widgetSvg,
  name: 'App Launcher',
  minSize: {
    w: 1,
    h: 1
  },
  description: 'The App Launcher widget starts an application (with optional arguments) in a single click — a shortcut tile for your daily tools.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['shell']
}

export default widgetType;
