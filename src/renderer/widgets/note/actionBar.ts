/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ActionBarItems } from '@/base/actionBar';
import { canCopyFullText, copyFullText, labelCopyFullText } from './actions';
import { WidgetApi } from '@/widgets/appModules';
import { copyFullTextSvg, editNoteSvg, viewNoteSvg } from './icons';

export type NoteViewMode = 'view' | 'edit';

export function createActionBarItems(
  noteText: string,
  widgetApi: WidgetApi,
  markdownOn: boolean,
  viewMode: NoteViewMode,
  setViewMode: (mode: NoteViewMode) => void
): ActionBarItems {
  return [
    ...(markdownOn ? [
      viewMode === 'view'
        ? {
          enabled: true,
          icon: editNoteSvg,
          id: 'EDIT-NOTE',
          title: 'Edit Note',
          doAction: async () => setViewMode('edit')
        }
        : {
          enabled: true,
          icon: viewNoteSvg,
          id: 'VIEW-NOTE',
          title: 'View Rendered Note',
          doAction: async () => setViewMode('view')
        }
    ] : []),
    {
      enabled: canCopyFullText(),
      icon: copyFullTextSvg,
      id: 'COPY-FULL-TEXT',
      title: labelCopyFullText,
      doAction: async () => copyFullText(noteText, widgetApi)
    }
  ];
}
