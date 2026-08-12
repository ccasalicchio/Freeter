/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { WidgetType } from '@/widgets/appModules';
import { settingsEditorComp, Settings, createSettingsState } from './settings';
import { widgetComp } from './widget';
import { widgetSvg } from './icons';

const widgetType: WidgetType<Settings> = {
  id: 'git-status',
  icon: widgetSvg,
  name: 'Git Status',
  minSize: {
    w: 2,
    h: 1
  },
  description: 'The Git Status widget shows the current branch, ahead/behind counts and dirty-file summary of a repository, refreshed automatically.',
  createSettingsState,
  settingsEditorComp,
  widgetComp,
  requiresApi: ['process']
}

export default widgetType;
