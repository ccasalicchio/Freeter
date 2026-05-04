import { WidgetApi, WidgetContextMenuFactory, WidgetMenuItem } from '@/widgets/appModules';
import { openItemLink, markItemRead } from './actions';
import { FeedItem } from '@/widgets/rss-feed-reader/state';

export function createContextMenuFactory(
  items: readonly FeedItem[],
  setItems: (items: readonly FeedItem[]) => void,
  widgetApi: WidgetApi
): WidgetContextMenuFactory {
  return (contextId) => {
    const menu: WidgetMenuItem[] = [];
    if (contextId !== '') {
      const item = items.find(i => i.id === contextId);
      if (item) {
        menu.push({
          label: 'Open in Browser',
          doAction: async () => openItemLink(item.link, widgetApi)
        });
        if (!item.isRead) {
          menu.push({ type: 'separator' });
          menu.push({
            label: 'Mark as Read',
            doAction: async () => markItemRead(item.id, items, setItems)
          });
        }
      }
    }
    return menu;
  }
}
