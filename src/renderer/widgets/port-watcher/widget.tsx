/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { usePolling } from '@/widgets/helpers';
import { Settings } from './settings';
import { parseNetstatListening, parsePortsList, parseSsListening } from './parse';
import styles from './widget.module.scss';
import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { process, notification } = widgetApi;
  const [listening, setListening] = useState<Set<number> | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [error, setError] = useState('');
  const checkInProgress = useRef(false);
  const prevStates = useRef<Map<number, boolean>>(new Map());

  const ports = useMemo(() => parsePortsList(settings.ports), [settings.ports]);
  const { notifyOnChange } = settings;

  const check = useCallback(async () => {
    if (ports.length === 0 || checkInProgress.current) {
      return;
    }
    checkInProgress.current = true;
    try {
      const isWin = process.getProcessInfo().isWin;
      const res = isWin
        ? await process.execFile('netstat', ['-ano', '-p', 'TCP'])
        : await process.execFile('ss', ['-ltn']);
      if (res.error || res.code !== 0) {
        setError(res.stderr.trim() || res.error || `Failed to run ${isWin ? 'netstat' : 'ss'}`);
        return;
      }
      const listeningPorts = isWin ? parseNetstatListening(res.stdout) : parseSsListening(res.stdout);
      setError('');
      setListening(listeningPorts);
      setCheckedAt(Date.now());
      for (const port of ports) {
        const isListening = listeningPorts.has(port);
        const wasListening = prevStates.current.get(port);
        if (notifyOnChange && wasListening !== undefined && wasListening !== isListening) {
          notification.show(`Port ${port}`, isListening ? 'now listening' : 'no longer listening');
        }
        prevStates.current.set(port, isListening);
      }
    } finally {
      checkInProgress.current = false;
    }
  }, [ports, notifyOnChange, process, notification]);

  usePolling(check, Math.max(5, settings.refreshSecs));

  if (ports.length === 0) {
    return <div className={styles['not-configured']}>{'Ports not specified'}</div>;
  }
  if (error) {
    return <div className={styles['error']} onClick={check} title='Click to retry'>{error}</div>;
  }

  return (
    <div className={styles['watcher']}>
      <div className={styles['header']}>
        <span className={styles['host']}>{settings.host}</span>
        <button type='button' className={styles['refresh']} title='Refresh now' onClick={check}>{'↻'}</button>
      </div>
      <div className={styles['list']}>
        {ports.map(port => {
          const state = listening === null ? 'unknown' : listening.has(port) ? 'open' : 'closed';
          return (
            <div key={port} className={styles['row']}>
              <span className={clsx(styles['dot'], styles[`dot-${state}`])} />
              <span className={styles['label']}>
                {`${port} ${state === 'unknown' ? 'checking…' : state === 'open' ? 'listening' : 'closed'}`}
              </span>
            </div>
          );
        })}
      </div>
      {checkedAt !== null && <div className={styles['checked-at']}>{`Last checked ${new Date(checkedAt).toLocaleTimeString()}`}</div>}
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
