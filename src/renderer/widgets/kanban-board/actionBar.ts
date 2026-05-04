import { ActionBarItems } from '@/base/actionBar';
import { addCardSvg } from './icons';
import { addCard } from './actions';
import { GetKanbanState, SetKanbanState } from '@/widgets/kanban-board/state';
import { Settings } from '@/widgets/kanban-board/settings';

export function createActionBarItems(
  settings: Settings,
  getState: GetKanbanState,
  setState: SetKanbanState,
  activeColumnIdx: number,
): ActionBarItems {
  return [
    {
      enabled: true,
      icon: addCardSvg,
      id: 'ADD-CARD',
      title: `Add Card to "${settings.columns[activeColumnIdx] || 'column'}"`,
      doAction: async () => {
        const title = prompt('Card title:');
        if (title) {
          addCard(activeColumnIdx, title, getState, setState);
        }
      }
    }
  ];
}
