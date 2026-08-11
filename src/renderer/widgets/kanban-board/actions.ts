import { GetKanbanState, SetKanbanState, KanbanCard } from '@/widgets/kanban-board/state';
import { addItemToList, removeItemFromList } from '@/widgets/appModules';

export function addCard(columnIdx: number, title: string, getState: GetKanbanState, setState: SetKanbanState) {
  if (!title.trim()) {
    return;
  }
  const state = getState();
  const card: KanbanCard = {
    id: state.nextCardId,
    title: title.trim(),
    description: '',
    color: '#4e9af1',
    columnIdx,
  };
  setState({
    ...state,
    cards: addItemToList(state.cards, card),
    nextCardId: state.nextCardId + 1,
  });
}

export function deleteCard(cardId: number, getState: GetKanbanState, setState: SetKanbanState) {
  const state = getState();
  const idx = state.cards.findIndex(c => c.id === cardId);
  if (idx > -1) {
    setState({ ...state, cards: removeItemFromList(state.cards, idx) });
  }
}

export function updateCard(cardId: number, updates: Partial<KanbanCard>, getState: GetKanbanState, setState: SetKanbanState) {
  const state = getState();
  setState({
    ...state,
    cards: state.cards.map(c => c.id === cardId ? { ...c, ...updates } : c),
  });
}

export function moveCard(cardId: number, toColumnIdx: number, getState: GetKanbanState, setState: SetKanbanState) {
  updateCard(cardId, { columnIdx: toColumnIdx }, getState, setState);
}
