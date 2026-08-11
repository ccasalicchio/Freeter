import { WidgetApi } from '@/widgets/appModules';
import { FeedItem } from '@/widgets/rss-feed-reader/state';

export async function openItemLink(link: string, widgetApi: WidgetApi) {
  if (link) {
    await widgetApi.shell.openExternalUrl(link);
  }
}

export function markItemRead(itemId: string, items: readonly FeedItem[], setItems: (items: readonly FeedItem[]) => void) {
  setItems(items.map(item => item.id === itemId ? { ...item, isRead: true } : item));
}

export function markAllRead(items: readonly FeedItem[], setItems: (items: readonly FeedItem[]) => void) {
  setItems(items.map(item => ({ ...item, isRead: true })));
}
