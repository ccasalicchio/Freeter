import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import styles from './widget.module.scss';
import { Settings } from './settings';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createActionBarItems } from '@/widgets/kanban-board/actionBar';
import { createContextMenuFactory } from '@/widgets/kanban-board/contextMenu';
import { KanbanState } from '@/widgets/kanban-board/state';
import { addCard, moveCard } from '@/widgets/kanban-board/actions';
import clsx from 'clsx';

const dataKey = 'kanban';

function WidgetComp({widgetApi, settings}: WidgetReactComponentProps<Settings>) {
  const {updateActionBar, setContextMenuFactory, dataStorage} = widgetApi;
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<KanbanState>({ cards: [], nextCardId: 1 });
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const getState = useCallback(() => stateRef.current, []);
  const saveState = useCallback(async (newState: KanbanState) => {
    setState(newState);
    await dataStorage.setJson(dataKey, newState);
  }, [dataStorage]);

  useEffect(() => {
    (async () => {
      const loaded = await dataStorage.getJson(dataKey) as KanbanState | undefined;
      if (loaded && typeof loaded === 'object' && 'cards' in loaded && 'nextCardId' in loaded) {
        setState(loaded as KanbanState);
      }
      setIsLoaded(true);
    })();
  }, [dataStorage]);

  const [activeColumnIdx, setActiveColumnIdx] = useState(0);

  useEffect(() => {
    if (isLoaded) {
      updateActionBar(createActionBarItems(settings, getState, saveState, activeColumnIdx));
      setContextMenuFactory(createContextMenuFactory(getState, saveState));
    }
  }, [isLoaded, updateActionBar, setContextMenuFactory, getState, saveState, settings, activeColumnIdx]);

  const handleAddCard = useCallback((colIdx: number) => {
    const title = prompt('Card title:');
    if (title) {
      addCard(colIdx, title, getState, saveState);
    }
  }, [getState, saveState]);

  const handleDragStart = useCallback((e: React.DragEvent, cardId: number) => {
    e.dataTransfer.setData('text/plain', String(cardId));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(colIdx);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, colIdx: number) => {
    e.preventDefault();
    setDragOverColumn(null);
    const cardIdStr = e.dataTransfer.getData('text/plain');
    const cardId = Number(cardIdStr);
    if (!isNaN(cardId)) {
      moveCard(cardId, colIdx, getState, saveState);
    }
  }, [getState, saveState]);

  if (!isLoaded) {
    return <div className={styles['viewport']}><div className={styles['empty-column']}>Loading...</div></div>;
  }

  const columns = settings.columns.length > 0 ? settings.columns : ['To Do', 'In Progress', 'Done'];

  return (
    <div className={styles['viewport']}>
      {columns.map((colName, colIdx) => {
        const colCards = state.cards.filter(c => c.columnIdx === colIdx);
        return (
          <div
            key={colIdx}
            className={styles['column']}
            onDragOver={e => handleDragOver(e, colIdx)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, colIdx)}
          >
            <div className={styles['column-header']}>{colName} ({colCards.length})</div>
            <div className={clsx(styles['card-list'], dragOverColumn === colIdx && styles['is-drag-over'])}>
              {colCards.length === 0 ? (
                <div className={styles['empty-column']} onClick={() => { setActiveColumnIdx(colIdx); handleAddCard(colIdx); }}>
                  + Add card
                </div>
              ) : (
                colCards.map(card => (
                  <div
                    key={card.id}
                    className={styles['card']}
                    style={{ borderLeftColor: card.color }}
                    draggable
                    onDragStart={e => handleDragStart(e, card.id)}
                    onClick={() => { setActiveColumnIdx(colIdx); }}
                    data-widget-context={card.id}
                  >
                    <div className={styles['card-title']}>{card.title}</div>
                    {card.description && <div className={styles['card-desc']}>{card.description}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
