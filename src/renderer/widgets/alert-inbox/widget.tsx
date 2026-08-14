/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { formatSinceTime, usePolling } from '@/widgets/helpers';
import { Settings } from './settings';
import styles from './widget.module.scss';
import clsx from 'clsx';
import { useCallback, useState } from 'react';

const dataKey = 'alerts';
const pollSecs = 5;
const maxBodyChars = 100;

interface AlertEntry {
  title: string;
  body: string;
  severity: string;
  status: string;
  at: string;
}

interface AlertInboxData {
  entries: AlertEntry[];
  unread: number;
}

function parseData(raw: string | undefined): AlertInboxData {
  if (raw !== undefined && raw !== '') {
    try {
      const parsed = JSON.parse(raw) as Partial<AlertInboxData>;
      if (parsed !== null && typeof parsed === 'object' && Array.isArray(parsed.entries)) {
        return {
          entries: parsed.entries,
          unread: typeof parsed.unread === 'number' && parsed.unread >= 0 ? parsed.unread : 0
        };
      }
    } catch {
      // unreadable data: show an empty inbox
    }
  }
  return { entries: [], unread: 0 };
}

function severityClass(severity: string): string {
  return severity === 'critical' ? 'dot-crit' : severity === 'warning' ? 'dot-warn' : 'dot-other';
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { dataStorage, clipboard } = widgetApi;
  const [data, setData] = useState<AlertInboxData | null>(null);

  // the ingest endpoint (main process) writes this storage key; a full renderer
  // reload follows each write, so a light poll keeps the view fresh in between
  const load = useCallback(async () => {
    setData(parseData(await dataStorage.getText(dataKey)));
  }, [dataStorage]);

  usePolling(load, pollSecs);

  const save = useCallback(async (next: AlertInboxData) => {
    setData(next);
    await dataStorage.setText(dataKey, JSON.stringify(next));
  }, [dataStorage]);

  const markRead = useCallback(() => {
    if (data !== null) {
      save({ entries: data.entries, unread: 0 });
    }
  }, [data, save]);

  const clearAll = useCallback(() => {
    save({ entries: [], unread: 0 });
  }, [save]);

  const copyToken = useCallback(() => {
    clipboard.writeText(settings.ingestToken);
  }, [clipboard, settings.ingestToken]);

  if (settings.ingestToken === '') {
    return <div className={styles['not-configured']}>{'Open the widget settings to generate an ingest token'}</div>;
  }

  if (data === null) {
    return <div className={styles['note']}>{'Loading…'}</div>;
  }

  const shown = data.entries.slice(0, Math.max(1, settings.maxShown));

  return (
    <div className={styles['inbox']}>
      <div className={styles['header']}>
        <span className={clsx(styles['badge'], data.unread > 0 ? styles['badge-unread'] : styles['badge-ok'])}>
          {`${data.unread} new`}
        </span>
        <button type='button' className={styles['tool']} title='Copy ingest token' onClick={copyToken}>{'⧉'}</button>
        <button type='button' className={styles['tool']} title='Mark read' onClick={markRead} disabled={data.unread === 0}>{'Mark read'}</button>
        <button type='button' className={styles['tool']} title='Clear' onClick={clearAll} disabled={data.entries.length === 0}>{'Clear'}</button>
      </div>
      {shown.length === 0 && <div className={styles['note']}>{'No alerts received yet'}</div>}
      {shown.length > 0 && (
        <div className={styles['list']}>
          {shown.map((entry, i) => (
            <div key={`${entry.at}-${i}`} className={styles['row']} title={`${entry.title}${entry.body !== '' ? ` — ${entry.body}` : ''}${entry.status !== '' ? ` (${entry.status})` : ''}`}>
              <span className={clsx(styles['dot'], styles[severityClass(entry.severity)])} />
              <span className={styles['name']}>{entry.title}</span>
              {entry.body !== '' && <span className={styles['summary']}>{truncate(entry.body, maxBodyChars)}</span>}
              <span className={styles['since']}>{formatSinceTime(entry.at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
