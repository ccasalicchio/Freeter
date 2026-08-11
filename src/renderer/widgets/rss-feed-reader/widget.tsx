import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createActionBarItems } from '@/widgets/rss-feed-reader/actionBar';
import { createContextMenuFactory } from '@/widgets/rss-feed-reader/contextMenu';
import { FeedItem } from '@/widgets/rss-feed-reader/state';
import { fetchFeed, createFeedItemId } from '@/widgets/rss-feed-reader/feedParser';
import { openItemLink, markItemRead } from '@/widgets/rss-feed-reader/actions';
import clsx from 'clsx';

const dataKey = 'rss-items';

type FilterMode = 'all' | 'unread';

function WidgetComp({widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {updateActionBar, setContextMenuFactory, dataStorage} = widgetApi;
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState<readonly FeedItem[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const setItemsAndSave = useCallback((newItems: readonly FeedItem[]) => {
    setItems(newItems);
    dataStorage.setJson(dataKey, { items: newItems, lastFetched: Date.now() });
  }, [dataStorage]);

  const doRefresh = useCallback(async () => {
    const { feedUrls, maxItems } = settings;
    if (!feedUrls.length) {
      return;
    }
    setIsRefreshing(true);
    setError('');
    try {
      const fetchedItems: FeedItem[] = [];
      for (const url of feedUrls) {
        try {
          const feed = await fetchFeed(url);
          const existingIds = new Set(itemsRef.current.map(i => i.id));
          for (const parsed of feed.items.slice(0, maxItems)) {
            const id = createFeedItemId(url, parsed.link, parsed.title);
            fetchedItems.push({
              id,
              feedTitle: feed.title,
              title: parsed.title,
              link: parsed.link,
              description: parsed.description,
              pubDate: parsed.pubDate,
              isRead: existingIds.has(id) ? (itemsRef.current.find(i => i.id === id)?.isRead ?? false) : false,
            });
          }
        } catch (err) {
          setError(prev => prev ? `${prev}\nFailed to fetch ${url}` : `Failed to fetch ${url}`);
        }
      }
      setItemsAndSave(fetchedItems);
    } finally {
      setIsRefreshing(false);
    }
  }, [settings, setItemsAndSave]);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getJson(dataKey) as { items: FeedItem[] } | undefined;
      if (loaded && Array.isArray(loaded.items)) {
        setItems(loaded.items);
      }
      setIsLoaded(true);
    })();
  }, [dataStorage]);

  useEffect(() => {
    if (isLoaded) {
      doRefresh();
    }
  }, [isLoaded, doRefresh]);

  useEffect(() => {
    if (!isLoaded || !settings.feedUrls.length) {
      return undefined;
    }
    const interval = setInterval(() => {
      doRefresh();
    }, settings.refreshIntervalMin * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoaded, doRefresh, settings.feedUrls.length, settings.refreshIntervalMin]);

  useEffect(() => {
    updateActionBar(createActionBarItems(items, setItemsAndSave, doRefresh));
    setContextMenuFactory(createContextMenuFactory(items, setItemsAndSave, widgetApi));
  }, [items, updateActionBar, setContextMenuFactory, setItemsAndSave, doRefresh, widgetApi]);

  const filteredItems = useMemo(() => {
    if (filterMode === 'unread') {
      return items.filter(item => !item.isRead);
    }
    return items;
  }, [items, filterMode]);

  const handleItemClick = useCallback((item: FeedItem) => {
    if (!item.isRead) {
      markItemRead(item.id, items, setItemsAndSave);
    }
    openItemLink(item.link, widgetApi);
  }, [items, setItemsAndSave, widgetApi]);

  if (!isLoaded) {
    return <div className={styles['empty-state']}>Loading RSS Feeds...</div>;
  }

  if (!settings.feedUrls.length) {
    return (
      <div className={styles['empty-state']}>
        <div className={styles['empty-state-title']}>No Feeds Configured</div>
        <div className={styles['empty-state-detail']}>Add RSS/Atom feed URLs in widget settings</div>
      </div>
    );
  }

  return (
    <div className={styles['rss-viewport']}>
      <div className={styles['filter-bar']}>
        <button
          className={clsx(styles['filter-btn'], filterMode === 'all' && styles['is-active'])}
          onClick={() => setFilterMode('all')}
        >
          All ({items.length})
        </button>
        <button
          className={clsx(styles['filter-btn'], filterMode === 'unread' && styles['is-active'])}
          onClick={() => setFilterMode('unread')}
        >
          Unread ({items.filter(i => !i.isRead).length})
        </button>
      </div>
      {error && (
        <div className={styles['feed-source']} style={{color: 'var(--freeter-errorColor, #e74c3c)'}}>
          {error}
        </div>
      )}
      {filteredItems.length === 0 ? (
        <div className={styles['empty-state']}>
          {isRefreshing ? 'Refreshing...' : 'No items'}
        </div>
      ) : (
        <ul className={styles['item-list']}>
          {filteredItems.map(item => (
            <li
              key={item.id}
              className={clsx(styles['item'], !item.isRead && styles['is-unread'])}
              onClick={() => handleItemClick(item)}
              data-widget-context={item.id}
            >
              <div className={styles['item-title']}>{item.title}</div>
              <div className={styles['item-meta']}>
                {item.feedTitle}{item.pubDate ? ` · ${item.pubDate}` : ''}
              </div>
              {item.description && (
                <div className={styles['item-desc']}>{item.description.replace(/<[^>]*>/g, '')}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
