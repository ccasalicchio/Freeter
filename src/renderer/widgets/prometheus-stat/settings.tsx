/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';
import { MonitorAuthSettings, sanitizeMonitorAuth } from '@/widgets/helpers';

export type PrometheusMode = 'instant' | 'range';

// NOTE: auth credentials are plain widget settings for now — migration to the
// safeStorage widget API (OS keychain encryption) is planned.
export interface Settings extends MonitorAuthSettings {
  baseUrl: string;
  query: string;
  mode: PrometheusMode;
  rangeMinutes: number;
  refreshSecs: number;
  unit: string;
  warn: number | null;
  crit: number | null;
  invert: boolean;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  baseUrl: typeof settings.baseUrl === 'string' ? settings.baseUrl : '',
  query: typeof settings.query === 'string' ? settings.query : '',
  mode: settings.mode === 'range' ? 'range' : 'instant',
  rangeMinutes: typeof settings.rangeMinutes === 'number' && settings.rangeMinutes > 0 ? settings.rangeMinutes : 60,
  refreshSecs: typeof settings.refreshSecs === 'number' && settings.refreshSecs >= 5 ? settings.refreshSecs : 30,
  unit: typeof settings.unit === 'string' ? settings.unit : '',
  warn: typeof settings.warn === 'number' ? settings.warn : null,
  crit: typeof settings.crit === 'number' ? settings.crit : null,
  invert: settings.invert === true,
  ...sanitizeMonitorAuth(settings),
})

function parseThreshold(val: string): number | null {
  if (val.trim() === '') {
    return null;
  }
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock titleForId='prom-stat-baseurl' title='Server URL' moreInfo='Base URL of the Prometheus server, e.g. http://localhost:9090. Any Prometheus-compatible API works: VictoriaMetrics, Thanos, Mimir, Cortex.'>
        <input id='prom-stat-baseurl' type='text' value={settings.baseUrl} placeholder='http://localhost:9090'
          onChange={e => updateSettings({ ...settings, baseUrl: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='prom-stat-query' title='PromQL Query' moreInfo='The query to evaluate, e.g. up, or rate(http_requests_total[5m]).'>
        <input id='prom-stat-query' type='text' value={settings.query} placeholder='up'
          onChange={e => updateSettings({ ...settings, query: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='prom-stat-mode' title='Mode' moreInfo='Instant shows the current value. Range also draws a sparkline of the recent history.'>
        <select id='prom-stat-mode' value={settings.mode} onChange={e => updateSettings({
          ...settings, mode: e.target.value === 'range' ? 'range' : 'instant'
        })}>
          <option value='instant'>Instant</option>
          <option value='range'>Range</option>
        </select>
      </SettingBlock>
      {settings.mode === 'range' && (
        <SettingBlock titleForId='prom-stat-range' title='Range (minutes)' moreInfo='How far back the range query looks. ~60 points are fetched across the range.'>
          <input id='prom-stat-range' type='number' min={1} value={settings.rangeMinutes}
            onChange={e => updateSettings({ ...settings, rangeMinutes: Math.max(1, Number.parseInt(e.target.value) || 60) })} />
        </SettingBlock>
      )}
      <SettingBlock titleForId='prom-stat-refresh' title='Refresh Every (seconds)' moreInfo='How often to re-run the query. Minimum 5 seconds.'>
        <input id='prom-stat-refresh' type='number' min={5} value={settings.refreshSecs}
          onChange={e => updateSettings({ ...settings, refreshSecs: Math.max(5, Number.parseInt(e.target.value) || 30) })} />
      </SettingBlock>
      <SettingBlock titleForId='prom-stat-unit' title='Unit' moreInfo='Optional suffix shown after the value, e.g. %, ms, req/s.'>
        <input id='prom-stat-unit' type='text' value={settings.unit} placeholder='%'
          onChange={e => updateSettings({ ...settings, unit: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='prom-stat-warn' title='Warning Threshold' moreInfo='The value turns orange at or above this number (at or below, when inverted). Leave empty to disable.'>
        <input id='prom-stat-warn' type='number' value={settings.warn ?? ''}
          onChange={e => updateSettings({ ...settings, warn: parseThreshold(e.target.value) })} />
      </SettingBlock>
      <SettingBlock titleForId='prom-stat-crit' title='Critical Threshold' moreInfo='The value turns red at or above this number (at or below, when inverted). Leave empty to disable.'>
        <input id='prom-stat-crit' type='number' value={settings.crit ?? ''}
          onChange={e => updateSettings({ ...settings, crit: parseThreshold(e.target.value) })} />
      </SettingBlock>
      <SettingBlock titleForId='prom-stat-invert' title='Invert Thresholds' moreInfo='When enabled, lower values are worse (e.g. free disk space, up).'>
        <label>
          <input id='prom-stat-invert' type='checkbox' checked={settings.invert}
            onChange={e => updateSettings({ ...settings, invert: e.target.checked })} />
          Lower is worse
        </label>
      </SettingBlock>
      <SettingBlock titleForId='prom-stat-auth' title='Authentication' moreInfo='Credentials are stored in the widget settings; encrypted storage (OS keychain) is planned.'>
        <select id='prom-stat-auth' value={settings.authType} onChange={e => updateSettings({
          ...settings, authType: e.target.value === 'basic' ? 'basic' : e.target.value === 'bearer' ? 'bearer' : 'none'
        })}>
          <option value='none'>None</option>
          <option value='basic'>Basic</option>
          <option value='bearer'>Bearer Token</option>
        </select>
      </SettingBlock>
      {settings.authType === 'basic' && (
        <>
          <SettingBlock titleForId='prom-stat-username' title='Username'>
            <input id='prom-stat-username' type='text' value={settings.username}
              onChange={e => updateSettings({ ...settings, username: e.target.value })} />
          </SettingBlock>
          <SettingBlock titleForId='prom-stat-password' title='Password'>
            <input id='prom-stat-password' type='password' value={settings.password}
              onChange={e => updateSettings({ ...settings, password: e.target.value })} />
          </SettingBlock>
        </>
      )}
      {settings.authType === 'bearer' && (
        <SettingBlock titleForId='prom-stat-token' title='Token'>
          <input id='prom-stat-token' type='password' value={settings.token}
            onChange={e => updateSettings({ ...settings, token: e.target.value })} />
        </SettingBlock>
      )}
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
