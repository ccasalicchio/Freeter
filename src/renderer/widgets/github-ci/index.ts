/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'github-ci',
  icon: widgetSvg,
  name: 'GitHub CI Status',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'The GitHub CI Status widget shows the latest GitHub Actions runs of a repository with pass/fail state, refreshed automatically.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['http', 'shell']
}

export default widgetType;
