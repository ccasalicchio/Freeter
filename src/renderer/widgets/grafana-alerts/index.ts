/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'grafana-alerts',
  icon: widgetSvg,
  name: 'Grafana Alerts',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Grafana Alerts widget lists the alerts firing on a Grafana server (unified alerting) or a standalone Alertmanager, with a count badge, severity colors, and a click-through to the alert list.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['http', 'shell']
}

export default widgetType;
