/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'grafana-panel',
  icon: widgetSvg,
  name: 'Grafana Panel',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'The Grafana Panel widget embeds a single Grafana dashboard panel, either as a server-rendered image refreshed on an interval (requires the grafana-image-renderer plugin) or as a live iframe embed (requires allow_embedding=true in grafana.ini).',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['http']
}

export default widgetType;
