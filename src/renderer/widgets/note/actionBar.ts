/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ActionBarItems } from '@/base/actionBar';
import { canCopyFullText, copyFullText, labelCopyFullText } from './actions';
import { WidgetApi } from '@/widgets/appModules';
import { copyFullTextSvg, editNoteSvg, splitNoteSvg, viewNoteSvg } from './icons';

export type NoteViewMode = 'view' | 'edit' | 'split';

const nextMode: Record<NoteViewMode, NoteViewMode> = {
  view: 'edit',
  edit: 'split',
  split: 'view'
};

const modeIcon: Record<NoteViewMode, string> = {
  view: viewNoteSvg,
  edit: editNoteSvg,
  split: splitNoteSvg
};

const modeTitle: Record<NoteViewMode, string> = {
  view: 'Switch to Rendered View',
  edit: 'Switch to Editor',
  split: 'Switch to Split View'
};

export function createActionBarItems(
  noteText: string,
  widgetApi: WidgetApi,
  markdownOn: boolean,
  viewMode: NoteViewMode,
  setViewMode: (mode: NoteViewMode) => void
): ActionBarItems {
  const next = nextMode[viewMode];
  return [
    ...(markdownOn ? [{
      enabled: true,
      icon: modeIcon[next],
      id: 'TOGGLE-NOTE-VIEW',
      title: modeTitle[next],
      doAction: async () => setViewMode(next)
    }] : []),
    {
      enabled: canCopyFullText(),
      icon: copyFullTextSvg,
      id: 'COPY-FULL-TEXT',
      title: labelCopyFullText,
      doAction: async () => copyFullText(noteText, widgetApi)
    }
  ];
}
