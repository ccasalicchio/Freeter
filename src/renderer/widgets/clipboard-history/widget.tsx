import { Button, ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createActionBarItems } from '@/widgets/clipboard-history/actionBar';
import { createContextMenuFactory } from '@/widgets/clipboard-history/contextMenu';
import { copyToClipboard, deleteItem, togglePin, addNewItem } from '@/widgets/clipboard-history/actions';
import { ClipboardState } from '@/widgets/clipboard-history/state';
import { clearHistorySvg, pinSvg, copySvg } from '@/widgets/clipboard-history/icons';
import clsx from 'clsx';

const dataKey = 'clipboard-history';

function WidgetComp({widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {updateActionBar, setContextMenuFactory, dataStorage, clipboard} = widgetApi;
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [state, setState] = useState<ClipboardState>({ items: [], nextItemId: 1 });
  const lastClipboardText = useRef('');
  const stateRef = useRef(state);
  stateRef.current = state;

  const getState = useCallback(() => stateRef.current, []);
  const saveState = useCallback(async (newState: ClipboardState) => {
    setState(newState);
    await dataStorage.setJson(dataKey, newState);
  }, [dataStorage]);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getJson(dataKey) as ClipboardState | undefined;
      if (loaded && typeof loaded === 'object' && 'items' in loaded && 'nextItemId' in loaded) {
        setState(loaded as ClipboardState);
      }
      setIsLoaded(true);
    })();
  }, [dataStorage]);

  useEffect(() => {
    if (isLoaded) {
      updateActionBar(createActionBarItems(getState, saveState));
      setContextMenuFactory(createContextMenuFactory(getState, saveState, widgetApi));
    }
  }, [isLoaded, updateActionBar, setContextMenuFactory, getState, saveState, widgetApi]);

  useEffect(() => {
    if (!isLoaded) {
      return undefined;
    }
    const interval = setInterval(async () => {
      try {
        const text = await clipboard.readText();
        if (text && text !== lastClipboardText.current) {
          lastClipboardText.current = text;
          addNewItem(text, settings.maxItems, getState, saveState);
        }
      } catch { /* ignore clipboard read errors */ }
    }, settings.pollIntervalMs);
    return () => clearInterval(interval);
  }, [isLoaded, clipboard, getState, saveState, settings.maxItems, settings.pollIntervalMs]);

  const filteredItems = searchQuery
    ? state.items.filter(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : state.items;

  const handleCopy = useCallback(async (text: string) => {
    await copyToClipboard(text, widgetApi);
  }, [widgetApi]);

  const handleTogglePin = useCallback((itemId: number) => {
    togglePin(itemId, getState, saveState);
  }, [getState, saveState]);

  const handleDelete = useCallback((itemId: number) => {
    deleteItem(itemId, getState, saveState);
  }, [getState, saveState]);

  if (!isLoaded) {
    return <div className={styles['empty-state']}>Loading Clipboard History...</div>;
  }

  return (
    <div className={styles['clipboard-viewport']}>
      <div className={styles['search-bar']}>
        <input
          type="text"
          placeholder="Search clipboard history..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      {filteredItems.length === 0 ? (
        <div className={styles['empty-state']}>
          {searchQuery ? 'No matching items found' : 'Clipboard history is empty'}
        </div>
      ) : (
        <ul className={styles['item-list']}>
          {filteredItems.map(item => (
            <li
              key={item.id}
              className={clsx(styles['item'], item.pinned && styles['is-pinned'])}
              onClick={() => handleCopy(item.text)}
              data-widget-context={item.id}
            >
              <div className={styles['item-text']}>{item.text}</div>
              <div className={styles['item-actions']} onClick={e => e.stopPropagation()}>
                <Button
                  onClick={() => handleTogglePin(item.id)}
                  iconSvg={pinSvg}
                  title={item.pinned ? 'Unpin' : 'Pin'}
                  size="S"
                />
                <Button
                  onClick={() => handleCopy(item.text)}
                  iconSvg={copySvg}
                  title="Copy"
                  size="S"
                />
                <Button
                  onClick={() => handleDelete(item.id)}
                  iconSvg={clearHistorySvg}
                  title="Delete"
                  size="S"
                />
              </div>
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
