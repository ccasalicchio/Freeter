/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Settings } from './settings';
import styles from './widget.module.scss';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

const maxHistory = 30;

interface CheckResult {
  at: number;
  ok: boolean;
  /** HTTP status code; 0 when the request failed without a response (network error / timeout) */
  status: number;
  latencyMs: number;
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http } = widgetApi;
  const [history, setHistory] = useState<CheckResult[]>([]);
  const checkInProgress = useRef(false);

  const check = useCallback(async () => {
    if (!settings.url || checkInProgress.current) {
      return;
    }
    checkInProgress.current = true;
    const started = performance.now();
    let result: CheckResult;
    try {
      const res = await http.request({
        url: settings.url,
        method: settings.method,
        timeoutMs: Math.max(1, settings.timeoutSecs) * 1000
      });
      const latencyMs = Math.round(performance.now() - started);
      result = res.error
        ? { at: Date.now(), ok: false, status: 0, latencyMs }
        : { at: Date.now(), ok: res.status === settings.expectStatus, status: res.status, latencyMs };
    } catch {
      result = { at: Date.now(), ok: false, status: 0, latencyMs: Math.round(performance.now() - started) };
    }
    checkInProgress.current = false;
    setHistory(prev => [...prev, result].slice(-maxHistory));
  }, [settings.url, settings.method, settings.timeoutSecs, settings.expectStatus, http]);

  useEffect(() => {
    setHistory([]);
  }, [settings.url])

  useEffect(() => {
    if (!settings.url) {
      return undefined;
    }
    check();
    const interval = setInterval(check, Math.max(5, settings.intervalSecs) * 1000);
    return () => clearInterval(interval);
  }, [check, settings.url, settings.intervalSecs]);

  if (!settings.url) {
    return <div className={styles['not-configured']}>{'URL not specified'}</div>;
  }

  const last = history.length > 0 ? history[history.length - 1] : null;
  const state = last === null ? 'unknown' : last.ok ? 'up' : 'down';

  return (
    <div className={styles['monitor']}>
      <div className={styles['status-row']}>
        <span className={clsx(styles['dot'], styles[`dot-${state}`])} />
        <span className={styles['state-label']}>{state === 'up' ? 'UP' : state === 'down' ? 'DOWN' : 'CHECKING…'}</span>
        {last && <span className={styles['meta']}>
          {`${last.status > 0 ? last.status : 'ERR'} · ${last.latencyMs} ms`}
        </span>}
        <button type='button' className={styles['refresh']} title='Check now' onClick={check}>{'↻'}</button>
      </div>
      {last && <div className={styles['checked-at']}>{`Last checked ${new Date(last.at).toLocaleTimeString()}`}</div>}
      <div className={styles['history']} aria-label={`Last ${history.length} checks`}>
        {history.map(item => (
          <span
            key={item.at}
            className={clsx(styles['bar'], item.ok ? styles['bar-ok'] : styles['bar-fail'])}
            title={`${new Date(item.at).toLocaleTimeString()} — ${item.ok ? 'UP' : 'DOWN'} (${item.status > 0 ? item.status : 'no response'}, ${item.latencyMs} ms)`}
          />
        ))}
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
