/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export type GrafanaPanelMode = 'image' | 'iframe';
export type GrafanaPanelTheme = 'dark' | 'light';

// NOTE: the token is a plain widget setting for now — migration to the
// safeStorage widget API (OS keychain encryption) is planned.
export interface Settings {
  baseUrl: string;
  dashboardUid: string;
  panelId: number;
  mode: GrafanaPanelMode;
  timeRange: string;
  refreshSecs: number;
  token: string;
  theme: GrafanaPanelTheme;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  baseUrl: typeof settings.baseUrl === 'string' ? settings.baseUrl : '',
  dashboardUid: typeof settings.dashboardUid === 'string' ? settings.dashboardUid : '',
  panelId: typeof settings.panelId === 'number' && settings.panelId > 0 ? Math.floor(settings.panelId) : 1,
  mode: settings.mode === 'iframe' ? 'iframe' : 'image',
  timeRange: typeof settings.timeRange === 'string' && settings.timeRange.trim() !== '' ? settings.timeRange : 'now-6h',
  refreshSecs: typeof settings.refreshSecs === 'number' && settings.refreshSecs >= 5 ? settings.refreshSecs : 60,
  token: typeof settings.token === 'string' ? settings.token : '',
  theme: settings.theme === 'light' ? 'light' : 'dark',
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock titleForId='grafana-panel-baseurl' title='Grafana URL' moreInfo='Base URL of the Grafana server, e.g. http://localhost:3000.'>
        <input id='grafana-panel-baseurl' type='text' value={settings.baseUrl} placeholder='http://localhost:3000'
          onChange={e => updateSettings({ ...settings, baseUrl: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-panel-uid' title='Dashboard UID' moreInfo='The dashboard UID from its URL: /d/<uid>/<slug>.'>
        <input id='grafana-panel-uid' type='text' value={settings.dashboardUid}
          onChange={e => updateSettings({ ...settings, dashboardUid: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-panel-panelid' title='Panel ID' moreInfo='The numeric panel id, visible in the panel "Share" dialog or the viewPanel URL parameter.'>
        <input id='grafana-panel-panelid' type='number' min={1} value={settings.panelId}
          onChange={e => updateSettings({ ...settings, panelId: Math.max(1, Number.parseInt(e.target.value) || 1) })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-panel-mode' title='Mode' moreInfo='Image fetches a server-rendered PNG on an interval — it requires the grafana-image-renderer plugin installed server-side, and works headless with a service-account token. Iframe embeds the live panel — it requires allow_embedding=true in grafana.ini and an active Grafana session in the embedded view.'>
        <select id='grafana-panel-mode' value={settings.mode} onChange={e => updateSettings({
          ...settings, mode: e.target.value === 'iframe' ? 'iframe' : 'image'
        })}>
          <option value='image'>Image (server-rendered PNG)</option>
          <option value='iframe'>Iframe (live embed)</option>
        </select>
      </SettingBlock>
      <SettingBlock titleForId='grafana-panel-range' title='Time Range' moreInfo='The "from" of the panel time range, in Grafana relative-time syntax, e.g. now-6h, now-30m, now-7d. "to" is always now.'>
        <input id='grafana-panel-range' type='text' value={settings.timeRange} placeholder='now-6h'
          onChange={e => updateSettings({ ...settings, timeRange: e.target.value.trim() || 'now-6h' })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-panel-refresh' title='Refresh Every (seconds)' moreInfo='How often to re-render the panel. Minimum 10 seconds in image mode.'>
        <input id='grafana-panel-refresh' type='number' min={settings.mode === 'image' ? 10 : 5} value={settings.refreshSecs}
          onChange={e => updateSettings({ ...settings, refreshSecs: Math.max(5, Number.parseInt(e.target.value) || 60) })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-panel-token' title='Token' moreInfo='Optional Grafana service-account token, sent as an Authorization: Bearer header in image mode. Stored in the widget settings; encrypted storage (OS keychain) is planned.'>
        <input id='grafana-panel-token' type='password' value={settings.token}
          onChange={e => updateSettings({ ...settings, token: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='grafana-panel-theme' title='Theme'>
        <select id='grafana-panel-theme' value={settings.theme} onChange={e => updateSettings({
          ...settings, theme: e.target.value === 'light' ? 'light' : 'dark'
        })}>
          <option value='dark'>Dark</option>
          <option value='light'>Light</option>
        </select>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
