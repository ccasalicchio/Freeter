/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { Thresholds, formatStatValue, getJsonPath, monitorAuthHeaders, thresholdColor, usePolling } from '@/widgets/helpers';
import { Settings } from './settings';
import styles from './widget.module.scss';
import clsx from 'clsx';
import { useCallback, useState } from 'react';

function parseHeadersJson(headersJson: string): Record<string, string> | null {
  if (headersJson.trim() === '') {
    return {};
  }
  try {
    const parsed = JSON.parse(headersJson);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(parsed)) {
      headers[key] = String(val);
    }
    return headers;
  } catch {
    return null;
  }
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http } = widgetApi;
  const [value, setValue] = useState<unknown>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [asOf, setAsOf] = useState<number | null>(null);

  const { url, jsonPath, label, unit, refreshSecs, warn, crit, invert, authType, username, password, token, headersJson } = settings;

  const refresh = useCallback(async () => {
    if (url === '') {
      return;
    }
    const extraHeaders = parseHeadersJson(headersJson);
    if (extraHeaders === null) {
      setError('Invalid extra headers — must be a JSON object');
      return;
    }
    const res = await http.request({
      url,
      headers: {
        ...extraHeaders,
        ...monitorAuthHeaders({ authType, username, password, token }),
      },
      timeoutMs: 15000,
    });
    if (res.error !== undefined && res.error !== '') {
      setError(res.error);
      return;
    }
    if (!res.ok) {
      setError(`HTTP ${res.status}${res.status === 401 ? ' — check credentials' : ''}`);
      return;
    }
    let body: unknown;
    try {
      body = JSON.parse(res.body);
    } catch {
      setError('Response is not valid JSON');
      return;
    }
    const extracted = getJsonPath(body, jsonPath);
    if (extracted === undefined) {
      setError(`No value at path "${jsonPath}"`);
      return;
    }
    setError('');
    setValue(extracted);
    setLoaded(true);
    setAsOf(Date.now());
  }, [http, url, jsonPath, headersJson, authType, username, password, token]);

  usePolling(refresh, refreshSecs);

  if (url === '') {
    return <div className={styles['not-configured']}>{'URL not specified'}</div>;
  }

  const thresholds: Thresholds = { warn: warn ?? undefined, crit: crit ?? undefined, invert };
  const numValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  const isNumeric = Number.isFinite(numValue);
  const level = isNumeric ? thresholdColor(numValue, thresholds) : 'ok';
  const display = isNumeric
    ? formatStatValue(numValue)
    : typeof value === 'object' ? JSON.stringify(value) : String(value);

  return (
    <div className={styles['stat']}>
      {error !== '' && <div className={styles['error']}>{error}</div>}
      {error === '' && !loaded && <div className={styles['not-configured']}>{'Loading…'}</div>}
      {error === '' && loaded && (
        <>
          {label !== '' && <div className={styles['label']}>{label}</div>}
          <div className={styles['value-row']}>
            <span className={clsx(styles['value'], level !== 'ok' && styles[`value-${level}`])}>{display}</span>
            {unit !== '' && <span className={styles['unit']}>{unit}</span>}
          </div>
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
