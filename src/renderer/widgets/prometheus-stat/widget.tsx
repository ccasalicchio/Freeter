/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Sparkline, Thresholds, formatStatValue, monitorAuthHeaders, thresholdColor, usePolling } from '@/widgets/helpers';
import { Settings } from './settings';
import styles from './widget.module.scss';
import clsx from 'clsx';
import { useCallback, useState } from 'react';

const maxExtraSeries = 4;
const maxLabelChars = 60;

interface Series {
  labels: Record<string, string>;
  value: number;
  points?: number[];
}

interface PromInstantResult {
  metric: Record<string, string>;
  value: [number, string];
}

interface PromRangeResult {
  metric: Record<string, string>;
  values: [number, string][];
}

interface PromResponse {
  status: string;
  error?: string;
  data?: {
    resultType: string;
    result: unknown;
  };
}

function compactLabels(labels: Record<string, string>): string {
  const json = JSON.stringify(labels);
  if (json === '{}') {
    return '';
  }
  return json.length > maxLabelChars ? `${json.slice(0, maxLabelChars)}…` : json;
}

function parseSeries(resp: PromResponse): Series[] | null {
  if (resp.data === undefined) {
    return null;
  }
  const { resultType, result } = resp.data;
  if (resultType === 'vector') {
    return (result as PromInstantResult[]).map(r => ({
      labels: r.metric ?? {},
      value: Number.parseFloat(r.value[1]),
    }));
  }
  if (resultType === 'matrix') {
    return (result as PromRangeResult[]).map(r => {
      const points = r.values.map(v => Number.parseFloat(v[1]));
      return {
        labels: r.metric ?? {},
        value: points.length > 0 ? points[points.length - 1] : Number.NaN,
        points,
      };
    });
  }
  if (resultType === 'scalar') {
    const [, val] = result as [number, string];
    return [{ labels: {}, value: Number.parseFloat(val) }];
  }
  return null;
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http } = widgetApi;
  const [series, setSeries] = useState<Series[] | null>(null);
  const [error, setError] = useState('');
  const [asOf, setAsOf] = useState<number | null>(null);

  const { baseUrl, query, mode, rangeMinutes, refreshSecs, unit, warn, crit, invert, authType, username, password, token } = settings;

  const refresh = useCallback(async () => {
    if (baseUrl === '' || query === '') {
      return;
    }
    const base = baseUrl.replace(/\/+$/, '');
    let url: string;
    if (mode === 'range') {
      const end = Math.floor(Date.now() / 1000);
      const start = end - rangeMinutes * 60;
      const step = Math.max(1, Math.round((rangeMinutes * 60) / 60)); // ~60 points
      url = `${base}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`;
    } else {
      url = `${base}/api/v1/query?query=${encodeURIComponent(query)}`;
    }
    const res = await http.request({
      url,
      headers: monitorAuthHeaders({ authType, username, password, token }),
      timeoutMs: 15000,
    });
    if (res.error !== undefined && res.error !== '') {
      setError(res.error);
      return;
    }
    if (!res.ok) {
      setError(`Prometheus API ${res.status}${res.status === 401 ? ' — check credentials' : ''}`);
      return;
    }
    let resp: PromResponse;
    try {
      resp = JSON.parse(res.body);
    } catch {
      setError('Unexpected response — not a Prometheus API?');
      return;
    }
    if (resp.status !== 'success') {
      setError(resp.error || 'Query failed');
      return;
    }
    const parsed = parseSeries(resp);
    if (parsed === null) {
      setError('Unsupported result type — use a query returning a vector or matrix');
      return;
    }
    setError('');
    setSeries(parsed);
    setAsOf(Date.now());
  }, [http, baseUrl, query, mode, rangeMinutes, authType, username, password, token]);

  usePolling(refresh, refreshSecs);

  if (baseUrl === '' || query === '') {
    return <div className={styles['not-configured']}>{'Server URL / query not specified'}</div>;
  }

  const thresholds: Thresholds = { warn: warn ?? undefined, crit: crit ?? undefined, invert };
  const first = series !== null && series.length > 0 ? series[0] : null;
  const level = first !== null ? thresholdColor(first.value, thresholds) : 'ok';

  return (
    <div className={styles['stat']}>
      {error !== '' && <div className={styles['error']}>{error}</div>}
      {error === '' && series !== null && first === null && <div className={styles['not-configured']}>{'No data'}</div>}
      {error === '' && series === null && <div className={styles['not-configured']}>{'Loading…'}</div>}
      {error === '' && first !== null && (
        <>
          <div className={styles['value-row']}>
            <span className={clsx(styles['value'], level !== 'ok' && styles[`value-${level}`])}>{formatStatValue(first.value)}</span>
            {unit !== '' && <span className={styles['unit']}>{unit}</span>}
          </div>
          {compactLabels(first.labels) !== '' && <div className={styles['labels']}>{compactLabels(first.labels)}</div>}
          {mode === 'range' && first.points !== undefined && <Sparkline points={first.points} width={160} height={30} />}
          {series !== null && series.length > 1 && (
            <div className={styles['extra-series']}>
              {series.slice(1, 1 + maxExtraSeries).map((s, i) => (
                <div key={i} className={styles['extra-row']}>
                  <span className={styles['extra-labels']}>{compactLabels(s.labels) || '—'}</span>
                  <span className={clsx(styles['extra-value'], styles[`extra-value-${thresholdColor(s.value, thresholds)}`])}>{formatStatValue(s.value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div className={styles['footer']}>
        {asOf !== null && <span className={styles['as-of']}>{`as of ${new Date(asOf).toLocaleTimeString()}`}</span>}
        <button type='button' className={styles['refresh']} title='Refresh now' onClick={refresh}>{'↻'}</button>
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
