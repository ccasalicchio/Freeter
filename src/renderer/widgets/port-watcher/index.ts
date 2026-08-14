/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'port-watcher',
  icon: widgetSvg,
  name: 'Port Watcher',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Port Watcher widget checks a list of local TCP ports on an interval and shows whether each one is listening, optionally notifying when a port state changes.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['process', 'notification']
}

export default widgetType;
