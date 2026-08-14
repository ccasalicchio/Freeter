/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'prometheus-stat',
  icon: widgetSvg,
  name: 'Prometheus Stat',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Prometheus Stat widget runs a PromQL query on an interval and shows the result as a big colored stat with optional sparkline. Works with any Prometheus-compatible API: Prometheus, VictoriaMetrics, Thanos, Mimir, Cortex.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['http']
}

export default widgetType;
