import { GetClipboardState, SetClipboardState, ClipboardItem } from '@/widgets/clipboard-history/state';
import { WidgetApi, addItemToList, removeItemFromList } from '@/widgets/appModules';

export async function copyToClipboard(text: string, widgetApi: WidgetApi) {
  await widgetApi.clipboard.writeText(text);
}

export function togglePin(itemId: number, getState: GetClipboardState, setState: SetClipboardState) {
  const state = getState();
  setState({
    ...state,
    items: state.items.map(item => (item.id === itemId ? { ...item, pinned: !item.pinned } : item))
  });
}

export function deleteItem(itemId: number, getState: GetClipboardState, setState: SetClipboardState) {
  const state = getState();
  const idx = state.items.findIndex(item => item.id === itemId);
  if (idx > -1) {
    setState({
      ...state,
      items: removeItemFromList(state.items, idx)
    });
  }
}

export function clearHistory(getState: GetClipboardState, setState: SetClipboardState) {
  const state = getState();
  setState({
    ...state,
    items: state.items.filter(item => item.pinned)
  });
}

export function addNewItem(text: string, maxItems: number, getState: GetClipboardState, setState: SetClipboardState) {
  if (!text) {
    return;
  }
  const state = getState();
  const existingIdx = state.items.findIndex(item => item.text === text);
  if (existingIdx > -1) {
    const existingItem = state.items[existingIdx];
    let updItems = removeItemFromList(state.items, existingIdx);
    updItems = addItemToList(updItems, { ...existingItem, timestamp: Date.now() }, 0);
    setState({ ...state, items: updItems });
    return;
  }
  const newItem: ClipboardItem = {
    id: state.nextItemId,
    text,
    pinned: false,
    timestamp: Date.now(),
  };
  const newItems = addItemToList(state.items, newItem, 0);
  if (newItems.length > maxItems) {
    const removals = newItems.length - maxItems;
    let trimmed = newItems;
    let removed = 0;
    for (let i = newItems.length - 1; i >= 0; i--) {
      if (!newItems[i].pinned && removed < removals) {
        const idx = trimmed.indexOf(newItems[i]);
        if (idx !== -1) {
          trimmed = removeItemFromList(trimmed, idx);
        }
        removed++;
        if (removed >= removals) {
          break;
        }
      }
    }
    setState({ ...state, items: trimmed, nextItemId: state.nextItemId + 1 });
    return;
  }
  setState({ ...state, items: newItems, nextItemId: state.nextItemId + 1 });
}
