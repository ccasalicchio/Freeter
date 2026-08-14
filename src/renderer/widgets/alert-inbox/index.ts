/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'alert-inbox',
  icon: widgetSvg,
  name: 'Alert Inbox',
  minSize: {
    w: 2,
    h: 2
  },
  description: 'The Alert Inbox widget receives alerts pushed to Freeter by Grafana/Alertmanager webhooks (or any JSON POST) via the built-in ingest endpoint, keeps a ring buffer of the latest 100, and shows desktop notifications for firing alerts.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['dataStorage', 'clipboard']
}

export default widgetType;
