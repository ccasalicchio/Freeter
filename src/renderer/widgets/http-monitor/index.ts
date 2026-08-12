/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'http-monitor',
  icon: widgetSvg,
  name: 'HTTP Monitor',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The HTTP Monitor widget checks an endpoint on an interval and shows its up/down status, response latency and a history of recent checks.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['http']
}

export default widgetType;
