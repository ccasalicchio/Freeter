/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { usePolling } from '@/widgets/helpers';
import { Settings } from './settings';
import { formatUntilTime } from './time';
import styles from './widget.module.scss';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';

const dataKey = 'reminders';
const pollSecs = 30;

interface ReminderItem {
  id: number;
  text: string;
  atIso: string;
  done: boolean;
  notified: boolean;
}

interface RemindersData {
  items: ReminderItem[];
  nextId: number;
}

function parseData(raw: unknown): RemindersData {
  if (raw !== null && typeof raw === 'object') {
    const parsed = raw as Partial<RemindersData>;
    if (Array.isArray(parsed.items)) {
      const items = parsed.items.filter((item): item is ReminderItem => (
        item !== null && typeof item === 'object' &&
        typeof item.id === 'number' &&
        typeof item.text === 'string' &&
        typeof item.atIso === 'string' &&
        typeof item.done === 'boolean' &&
        typeof item.notified === 'boolean'
      ));
      return {
        items,
        nextId: typeof parsed.nextId === 'number' && parsed.nextId > 0
          ? parsed.nextId
          : items.reduce((max, item) => Math.max(max, item.id), 0) + 1
      };
    }
  }
  return { items: [], nextId: 1 };
}

function sortedByTime(items: ReminderItem[]): ReminderItem[] {
  return [...items].sort((a, b) => Date.parse(a.atIso) - Date.parse(b.atIso));
}

function WidgetComp({widgetApi}: WidgetReactComponentProps<Settings>) {
  const { dataStorage, notification } = widgetApi;
  const [data, setData] = useState<RemindersData | null>(null);
  const dataRef = useRef<RemindersData | null>(null);
  const [text, setText] = useState('');
  const [at, setAt] = useState('');

  const save = useCallback(async (next: RemindersData) => {
    dataRef.current = next;
    setData(next);
    await dataStorage.setJson(dataKey, next);
  }, [dataStorage]);

  // load on mount, then check for due reminders every poll tick
  const tick = useCallback(async () => {
    const cur = dataRef.current ?? parseData(await dataStorage.getJson(dataKey));
    const now = Date.now();
    let anyDue = false;
    const items = cur.items.map(item => {
      const t = Date.parse(item.atIso);
      if (!item.done && !item.notified && !Number.isNaN(t) && t <= now) {
        anyDue = true;
        notification.show('Reminder', item.text);
        return { ...item, notified: true };
      }
      return item;
    });
    if (anyDue) {
      await save({ ...cur, items });
    } else {
      dataRef.current = cur;
      setData(cur);
    }
  }, [dataStorage, notification, save]);

  usePolling(tick, pollSecs);

  const addReminder = useCallback(() => {
    const cur = dataRef.current;
    const atMs = Date.parse(at);
    if (cur === null || text.trim() === '' || Number.isNaN(atMs)) {
      return;
    }
    const item: ReminderItem = {
      id: cur.nextId,
      text: text.trim(),
      atIso: new Date(atMs).toISOString(),
      done: false,
      notified: false
    };
    save({ items: [...cur.items, item], nextId: cur.nextId + 1 });
    setText('');
    setAt('');
  }, [at, text, save]);

  const toggleDone = useCallback((id: number) => {
    const cur = dataRef.current;
    if (cur === null) {
      return;
    }
    save({ ...cur, items: cur.items.map(item => item.id === id ? { ...item, done: !item.done } : item) });
  }, [save]);

  const deleteReminder = useCallback((id: number) => {
    const cur = dataRef.current;
    if (cur === null) {
      return;
    }
    save({ ...cur, items: cur.items.filter(item => item.id !== id) });
  }, [save]);

  if (data === null) {
    return <div className={styles['note']}>{'Loading…'}</div>;
  }

  const now = Date.now();

  return (
    <div className={styles['reminders']}>
      <div className={styles['add-row']}>
        <input type='text' className={styles['add-text']} placeholder='Remind me to…' value={text} aria-label='Reminder text'
          onChange={e => setText(e.target.value)} />
        <input type='datetime-local' className={styles['add-at']} value={at} aria-label='Reminder time'
          onChange={e => setAt(e.target.value)} />
        <button type='button' className={styles['add-btn']} onClick={addReminder}
          disabled={text.trim() === '' || Number.isNaN(Date.parse(at))}>{'Add'}</button>
      </div>
      {data.items.length === 0 && <div className={styles['note']}>{'No reminders yet'}</div>}
      {data.items.length > 0 && (
        <div className={styles['list']}>
          {sortedByTime(data.items).map(item => {
            const overdue = !item.done && Date.parse(item.atIso) <= now;
            return (
              <div key={item.id} className={clsx(styles['row'], overdue && styles['row-overdue'], item.done && styles['row-done'])}>
                <input type='checkbox' checked={item.done} aria-label={`Done: ${item.text}`}
                  onChange={() => toggleDone(item.id)} />
                <span className={styles['text']} title={`${item.text} — ${new Date(item.atIso).toLocaleString()}`}>{item.text}</span>
                <span className={styles['when']}>{formatUntilTime(item.atIso, now)}</span>
                <button type='button' className={styles['delete']} title={`Delete: ${item.text}`}
                  onClick={() => deleteReminder(item.id)}>{'×'}</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
