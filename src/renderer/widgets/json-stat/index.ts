/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'json-stat',
  icon: widgetSvg,
  name: 'JSON Stat',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The JSON Stat widget fetches a JSON endpoint on an interval, extracts a value by path and shows it as a colored stat — a catch-all for any reporting tool with a JSON API (Datadog, New Relic, Zabbix, Netdata, custom health endpoints).',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['http']
}

export default widgetType;
