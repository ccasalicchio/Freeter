import { List } from '@/base/list';

export interface FeedItem {
  id: string;
  feedTitle: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  isRead: boolean;
}

export interface RssState {
  items: List<FeedItem>;
  lastFetched: number;
}
