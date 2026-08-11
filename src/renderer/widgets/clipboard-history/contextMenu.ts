import { WidgetApi, WidgetContextMenuFactory, WidgetMenuItem } from '@/widgets/appModules';
import { copyToClipboard, togglePin, deleteItem } from './actions';
import { GetClipboardState, SetClipboardState } from '@/widgets/clipboard-history/state';

export function createContextMenuFactory(
  getState: GetClipboardState,
  setState: SetClipboardState,
  widgetApi: WidgetApi
): WidgetContextMenuFactory {
  return (contextId) => {
    const items: WidgetMenuItem[] = [];
    if (contextId !== '') {
      const itemId = Number(contextId);
      if (!isNaN(itemId)) {
        const item = getState().items.find(i => i.id === itemId);
        if (item) {
          items.push({
            label: 'Copy to Clipboard',
            doAction: async () => copyToClipboard(item.text, widgetApi)
          });
          items.push({ type: 'separator' });
          items.push({
            label: item.pinned ? 'Unpin' : 'Pin',
            doAction: async () => togglePin(itemId, getState, setState)
          });
          items.push({ type: 'separator' });
          items.push({
            label: 'Delete',
            doAction: async () => deleteItem(itemId, getState, setState)
          });
        }
      }
    }
    return items;
  }
}
