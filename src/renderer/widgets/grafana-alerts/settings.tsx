/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export type GrafanaAlertsSource = 'grafana' | 'alertmanager';
export type GrafanaAlertsStateFilter = 'firing' | 'all';

// NOTE: the token is a plain widget setting for now — migration to the
// safeStorage widget API (OS keychain encryption) is planned.
export interface Settings {
  baseUrl: string;
  source: GrafanaAlertsSource;
  token: string;
  stateFilter: GrafanaAlertsStateFilter;
  labelFilter: string;
  refreshSecs: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  baseUrl: typeof settings.baseUrl === 'string' ? settings.baseUrl : '',
  source: settings.source === 'alertmanager' ? 'alertmanager' : 'grafana',
  token: typeof settings.token === 'string' ? settings.token : '',
  stateFilter: settings.stateFilter === 'all' ? 'all' : 'firing',
  labelFilter: typeof settings.labelFilter === 'string' ? settings.labelFilter : '',
  refreshSecs: typeof settings.refreshSecs === 'number' && settings.refreshSecs >= 5 ? settings.refreshSecs : 60,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock titleForId='grafana-alerts-source' title='Source' moreInfo='Grafana unified alerting (via its built-in Alertmanager API) or a standalone Alertmanager instance.'>
        <select id='grafana-alerts-source' value={settings.source} onChange={e => updateSettings({
          ...settings, source: e.target.value === 'alertmanager' ? 'alertmanager' : 'grafana'
        })}>
          <option value='grafana'>Grafana</option>
          <option value='alertmanager'>Alertmanager</option>
        </select>
      </SettingBlock>
      <SettingBlock titleForId='grafana-alerts-baseurl' title='Server URL' moreInfo={settings.source === 'grafana'
        ? 'Base URL of the Grafana server, e.g. http://localhost:3000.'
        : 'Base URL of the Alertmanager server, e.g. http://localhost:9093.'}>
        <input id='grafana-alerts-baseurl' type='text' value={settings.baseUrl}
          placeholder={settings.source === 'grafana' ? 'http://localhost:3000' : 'http://localhost:9093'}
          onChange={e => updateSettings({ ...settings, baseUrl: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-alerts-token' title='Token' moreInfo='Optional bearer token (Grafana service-account token). Sent as an Authorization: Bearer header. Stored in the widget settings; encrypted storage (OS keychain) is planned.'>
        <input id='grafana-alerts-token' type='password' value={settings.token}
          onChange={e => updateSettings({ ...settings, token: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-alerts-state' title='Show Alerts' moreInfo='Firing shows only currently active alerts. All also lists suppressed/unprocessed ones.'>
        <select id='grafana-alerts-state' value={settings.stateFilter} onChange={e => updateSettings({
          ...settings, stateFilter: e.target.value === 'all' ? 'all' : 'firing'
        })}>
          <option value='firing'>Firing only</option>
          <option value='all'>All</option>
        </select>
      </SettingBlock>
      <SettingBlock titleForId='grafana-alerts-labels' title='Label Filter' moreInfo='Optional key=value substring to match against alert labels, e.g. severity=critical or team=backend. Leave empty to show everything.'>
        <input id='grafana-alerts-labels' type='text' value={settings.labelFilter} placeholder='severity=critical'
          onChange={e => updateSettings({ ...settings, labelFilter: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-alerts-refresh' title='Refresh Every (seconds)' moreInfo='How often to re-fetch the alerts. Minimum 5 seconds.'>
        <input id='grafana-alerts-refresh' type='number' min={5} value={settings.refreshSecs}
          onChange={e => updateSettings({ ...settings, refreshSecs: Math.max(5, Number.parseInt(e.target.value) || 60) })} />
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
