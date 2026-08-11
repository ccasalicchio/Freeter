import { WidgetContextMenuFactory, WidgetMenuItem } from '@/widgets/appModules';
import { deleteCard, updateCard } from './actions';
import { GetKanbanState, SetKanbanState, cardColors } from '@/widgets/kanban-board/state';

export function createContextMenuFactory(
  getState: GetKanbanState,
  setState: SetKanbanState,
): WidgetContextMenuFactory {
  return (contextId) => {
    const items: WidgetMenuItem[] = [];
    if (contextId !== '') {
      const cardId = Number(contextId);
      if (!isNaN(cardId)) {
        const card = getState().cards.find(c => c.id === cardId);
        if (card) {
          items.push({
            label: 'Edit Title',
            doAction: async () => {
              const title = prompt('Edit title:', card.title);
              if (title) {
                updateCard(cardId, { title: title.trim() }, getState, setState);
              }
            }
          });
          items.push({
            label: 'Edit Description',
            doAction: async () => {
              const desc = prompt('Edit description:', card.description);
              if (desc !== null) {
                updateCard(cardId, { description: desc }, getState, setState);
              }
            }
          });
          items.push({ type: 'separator' });
          items.push({
            label: 'Change Color',
            doAction: async () => {
              const colors = cardColors;
              const currentIdx = colors.indexOf(card.color);
              const nextColor = colors[(currentIdx + 1) % colors.length];
              updateCard(cardId, { color: nextColor }, getState, setState);
            }
          });
          items.push({ type: 'separator' });
          items.push({
            label: 'Delete Card',
            doAction: async () => deleteCard(cardId, getState, setState)
          });
        }
      }
    }
    return items;
  }
}
