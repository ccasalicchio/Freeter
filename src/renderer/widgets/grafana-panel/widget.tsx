/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { ReactComponent, WidgetReactComponentProps } from '@/widgets/appModules';
import { usePolling } from '@/widgets/helpers';
import { Settings } from './settings';
import styles from './widget.module.scss';
import { useCallback, useState } from 'react';

const minImageRefreshSecs = 10;
const renderWidth = 1000;
const renderHeight = 500;

function panelQuery(panelId: number, timeRange: string, theme: string): string {
  return `panelId=${panelId}&from=${encodeURIComponent(timeRange)}&to=now&theme=${theme}`;
}

function WidgetComp({settings, widgetApi}: WidgetReactComponentProps<Settings>) {
  const { http } = widgetApi;
  const [imgSrc, setImgSrc] = useState('');
  const [error, setError] = useState('');
  const [asOf, setAsOf] = useState<number | null>(null);

  const { baseUrl, dashboardUid, panelId, mode, timeRange, refreshSecs, token, theme } = settings;
  const base = baseUrl.replace(/\/+$/, '');
  const configured = base !== '' && dashboardUid !== '';

  const refresh = useCallback(async () => {
    if (!configured || mode !== 'image') {
      return;
    }
    const url = `${base}/render/d-solo/${encodeURIComponent(dashboardUid)}/panel?${panelQuery(panelId, timeRange, theme)}&width=${renderWidth}&height=${renderHeight}`;
    const res = await http.request({
      url,
      headers: token !== '' ? { Authorization: `Bearer ${token}` } : {},
      binary: true,
      timeoutMs: 30000,
    });
    if (res.error !== undefined && res.error !== '') {
      setError(res.error);
      return;
    }
    if (!res.ok) {
      setError(`Grafana render API ${res.status}${res.status === 401 || res.status === 403 ? ' — check the token' : res.status === 404 ? ' — is the grafana-image-renderer plugin installed?' : ''}`);
      return;
    }
    if (res.bodyBase64 === undefined || res.bodyBase64 === '') {
      setError('Empty render response');
      return;
    }
    setError('');
    setImgSrc(`data:image/png;base64,${res.bodyBase64}`);
    setAsOf(Date.now());
  }, [http, configured, mode, base, dashboardUid, panelId, timeRange, theme, token]);

  usePolling(refresh, mode === 'image' ? Math.max(minImageRefreshSecs, refreshSecs) : 0);

  if (!configured) {
    return <div className={styles['not-configured']}>{'Grafana URL / dashboard UID not specified'}</div>;
  }

  if (mode === 'iframe') {
    const iframeUrl = `${base}/d-solo/${encodeURIComponent(dashboardUid)}/panel?${panelQuery(panelId, timeRange, theme)}&refresh=${refreshSecs}s&kiosk`;
    return (
      <div className={styles['panel']}>
        <webview
          // eslint-disable-next-line react/no-unknown-property
          partition='persist:app'
          className={styles['webview']}
          src={iframeUrl}
        ></webview>
      </div>
    );
  }

  return (
    <div className={styles['panel']}>
      {error !== '' && <div className={styles['error']}>{error}</div>}
      {error === '' && imgSrc === '' && <div className={styles['note']}>{'Loading…'}</div>}
      {imgSrc !== '' && (
        <div className={styles['image-box']}>
          <img className={styles['image']} src={imgSrc} alt='Grafana panel' />
        </div>
      )}
      <div className={styles['footer']}>
        {asOf !== null && <span className={styles['as-of']}>{`updated ${new Date(asOf).toLocaleTimeString()}`}</span>}
        <button type='button' className={styles['refresh']} title='Refresh now' onClick={refresh}>{'↻'}</button>
      </div>
    </div>
  );
}

export const widgetComp: ReactComponent<WidgetReactComponentProps<Settings>> = {
  type: 'react',
  Comp: WidgetComp
}
