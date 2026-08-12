/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'github-prs',
  icon: widgetSvg,
  name: 'GitHub Pull Requests',
  minSize: {
    w: 3,
    h: 2
  },
  description: 'The GitHub Pull Requests widget lists the open pull requests of a repository, refreshed automatically.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['http', 'shell']
}

export default widgetType;
