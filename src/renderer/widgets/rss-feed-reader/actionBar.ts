import { ActionBarItems } from '@/base/actionBar';
import { markAllReadSvg, refreshSvg } from './icons';
import { markAllRead } from './actions';
import { FeedItem } from '@/widgets/rss-feed-reader/state';

export function createActionBarItems(
  items: readonly FeedItem[],
  setItems: (items: readonly FeedItem[]) => void,
  doRefresh: () => void
): ActionBarItems {
  return [
    {
      enabled: items.some(item => !item.isRead),
      icon: markAllReadSvg,
      id: 'MARK-ALL-READ',
      title: 'Mark All Read',
      doAction: async () => markAllRead(items, setItems)
    },
    {
      enabled: true,
      icon: refreshSvg,
      id: 'REFRESH',
      title: 'Refresh Feeds',
      doAction: async () => doRefresh()
    }
  ];
}
