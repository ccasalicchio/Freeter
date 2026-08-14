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

const maxSummaryChars = 80;

interface AmAlert {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  status?: { state?: string };
  startsAt?: string;
}

// Alertmanager v2 uses 'active' for firing alerts; accept 'firing' too for safety.
function isFiring(alert: AmAlert): boolean {
  const state = alert.status?.state;
  return state === 'active' || state === 'firing';
}

function matchesLabelFilter(alert: AmAlert, filter: string): boolean {
  const trimmed = filter.trim();
  if (trimmed === '') {
    return true;
  }
  return Object.entries(alert.labels ?? {}).some(([k, v]) => `${k}=${v}`.includes(trimmed));
}

function severityClass(alert: AmAlert): string {
  const severity = alert.labels?.severity;
  return severity === 'critical' ? 'dot-crit' : severity === 'warning' ? 'dot-warn' : 'dot-other';
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http, shell } = widgetApi;
  const [alerts, setAlerts] = useState<AmAlert[] | null>(null);
  const [error, setError] = useState('');
  const [asOf, setAsOf] = useState<number | null>(null);

  const { baseUrl, source, token, stateFilter, labelFilter, refreshSecs } = settings;
  const base = baseUrl.replace(/\/+$/, '');

  const refresh = useCallback(async () => {
    if (base === '') {
      return;
    }
    const path = source === 'alertmanager' ? '/api/v2/alerts' : '/api/alertmanager/grafana/api/v2/alerts';
    const res = await http.request({
      url: `${base}${path}`,
      headers: token !== '' ? { Authorization: `Bearer ${token}` } : {},
      timeoutMs: 15000,
    });
    if (res.error !== undefined && res.error !== '') {
      setError(res.error);
      return;
    }
    if (!res.ok) {
      setError(`Alerts API ${res.status}${res.status === 401 || res.status === 403 ? ' — check the token' : ''}`);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(res.body);
    } catch {
      setError('Unexpected response — not an Alertmanager v2 API?');
      return;
    }
    if (!Array.isArray(parsed)) {
      setError('Unexpected response — expected an alert array');
      return;
    }
    setError('');
    setAlerts(parsed as AmAlert[]);
    setAsOf(Date.now());
  }, [http, base, source, token]);

  usePolling(refresh, refreshSecs);

  const openAlerts = useCallback(() => {
    shell.openExternalUrl(source === 'alertmanager' ? base : `${base}/alerting/list`);
  }, [shell, source, base]);

  if (base === '') {
    return <div className={styles['not-configured']}>{'Server URL not specified'}</div>;
  }

  const filtered = alerts !== null ? alerts.filter(a => matchesLabelFilter(a, labelFilter)) : null;
  const firingCount = filtered !== null ? filtered.filter(isFiring).length : 0;
  const shown = filtered !== null ? (stateFilter === 'firing' ? filtered.filter(isFiring) : filtered) : null;

  return (
    <div className={styles['alerts']}>
      <div className={styles['header']}>
        <span className={clsx(styles['badge'], firingCount > 0 ? styles['badge-firing'] : styles['badge-ok'])}>
          {`${firingCount} firing`}
        </span>
        {asOf !== null && <span className={styles['as-of']}>{`checked ${new Date(asOf).toLocaleTimeString()}`}</span>}
        <button type='button' className={styles['refresh']} title='Refresh now' onClick={refresh}>{'↻'}</button>
      </div>
      {error !== '' && <div className={styles['error']}>{error}</div>}
      {error === '' && shown === null && <div className={styles['note']}>{'Loading…'}</div>}
      {error === '' && shown !== null && shown.length === 0 && (
        <div className={styles['note']}>{stateFilter === 'firing' ? 'No firing alerts' : 'No alerts'}</div>
      )}
      {error === '' && shown !== null && shown.length > 0 && (
        <div className={styles['list']}>
          {shown.map((alert, i) => {
            const name = alert.labels?.alertname ?? '(no name)';
            const summary = alert.annotations?.summary ?? '';
            const since = alert.startsAt !== undefined ? formatSinceTime(alert.startsAt) : '';
            return (
              <button type='button' key={i} className={styles['row']} title={`${name}${summary !== '' ? ` — ${summary}` : ''}`} onClick={openAlerts}>
                <span className={clsx(styles['dot'], styles[severityClass(alert)])} />
                <span className={styles['name']}>{name}</span>
                {summary !== '' && <span className={styles['summary']}>{truncate(summary, maxSummaryChars)}</span>}
                {since !== '' && <span className={styles['since']}>{since}</span>}
              </button>
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
