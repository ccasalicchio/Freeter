/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';
import { MonitorAuthSettings, sanitizeMonitorAuth } from '@/widgets/helpers';

// NOTE: auth credentials are plain widget settings for now — migration to the
// safeStorage widget API (OS keychain encryption) is planned.
export interface Settings extends MonitorAuthSettings {
  url: string;
  jsonPath: string;
  label: string;
  unit: string;
  refreshSecs: number;
  warn: number | null;
  crit: number | null;
  invert: boolean;
  headersJson: string;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  url: typeof settings.url === 'string' ? settings.url : '',
  jsonPath: typeof settings.jsonPath === 'string' ? settings.jsonPath : '',
  label: typeof settings.label === 'string' ? settings.label : '',
  unit: typeof settings.unit === 'string' ? settings.unit : '',
  refreshSecs: typeof settings.refreshSecs === 'number' && settings.refreshSecs >= 5 ? settings.refreshSecs : 60,
  warn: typeof settings.warn === 'number' ? settings.warn : null,
  crit: typeof settings.crit === 'number' ? settings.crit : null,
  invert: settings.invert === true,
  headersJson: typeof settings.headersJson === 'string' ? settings.headersJson : '',
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
      <SettingBlock titleForId='json-stat-url' title='URL' moreInfo='Endpoint returning JSON, e.g. https://example.com/api/stats.'>
        <input id='json-stat-url' type='text' value={settings.url} placeholder='https://example.com/api/stats'
          onChange={e => updateSettings({ ...settings, url: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='json-stat-path' title='JSON Path' moreInfo='Dot/bracket path to the value in the response, e.g. data.stats[0].cpu. Leave empty when the response body is the value itself.'>
        <input id='json-stat-path' type='text' value={settings.jsonPath} placeholder='data.stats[0].cpu'
          onChange={e => updateSettings({ ...settings, jsonPath: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='json-stat-label' title='Label' moreInfo='Optional label shown with the value, e.g. CPU load.'>
        <input id='json-stat-label' type='text' value={settings.label} placeholder='CPU load'
          onChange={e => updateSettings({ ...settings, label: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='json-stat-unit' title='Unit' moreInfo='Optional suffix shown after the value, e.g. %, ms, GB.'>
        <input id='json-stat-unit' type='text' value={settings.unit} placeholder='%'
          onChange={e => updateSettings({ ...settings, unit: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='json-stat-refresh' title='Refresh Every (seconds)' moreInfo='How often to re-fetch the endpoint. Minimum 5 seconds.'>
        <input id='json-stat-refresh' type='number' min={5} value={settings.refreshSecs}
          onChange={e => updateSettings({ ...settings, refreshSecs: Math.max(5, Number.parseInt(e.target.value) || 60) })} />
      </SettingBlock>
      <SettingBlock titleForId='json-stat-warn' title='Warning Threshold' moreInfo='The value turns orange at or above this number (at or below, when inverted). Leave empty to disable.'>
        <input id='json-stat-warn' type='number' value={settings.warn ?? ''}
          onChange={e => updateSettings({ ...settings, warn: parseThreshold(e.target.value) })} />
      </SettingBlock>
      <SettingBlock titleForId='json-stat-crit' title='Critical Threshold' moreInfo='The value turns red at or above this number (at or below, when inverted). Leave empty to disable.'>
        <input id='json-stat-crit' type='number' value={settings.crit ?? ''}
          onChange={e => updateSettings({ ...settings, crit: parseThreshold(e.target.value) })} />
      </SettingBlock>
      <SettingBlock titleForId='json-stat-invert' title='Invert Thresholds' moreInfo='When enabled, lower values are worse (e.g. free disk space).'>
        <label>
          <input id='json-stat-invert' type='checkbox' checked={settings.invert}
            onChange={e => updateSettings({ ...settings, invert: e.target.checked })} />
          Lower is worse
        </label>
      </SettingBlock>
      <SettingBlock titleForId='json-stat-auth' title='Authentication' moreInfo='Credentials are stored in the widget settings; encrypted storage (OS keychain) is planned.'>
        <select id='json-stat-auth' value={settings.authType} onChange={e => updateSettings({
          ...settings, authType: e.target.value === 'basic' ? 'basic' : e.target.value === 'bearer' ? 'bearer' : 'none'
        })}>
          <option value='none'>None</option>
          <option value='basic'>Basic</option>
          <option value='bearer'>Bearer Token</option>
        </select>
      </SettingBlock>
      {settings.authType === 'basic' && (
        <>
          <SettingBlock titleForId='json-stat-username' title='Username'>
            <input id='json-stat-username' type='text' value={settings.username}
              onChange={e => updateSettings({ ...settings, username: e.target.value })} />
          </SettingBlock>
          <SettingBlock titleForId='json-stat-password' title='Password'>
            <input id='json-stat-password' type='password' value={settings.password}
              onChange={e => updateSettings({ ...settings, password: e.target.value })} />
          </SettingBlock>
        </>
      )}
      {settings.authType === 'bearer' && (
        <SettingBlock titleForId='json-stat-token' title='Token'>
          <input id='json-stat-token' type='password' value={settings.token}
            onChange={e => updateSettings({ ...settings, token: e.target.value })} />
        </SettingBlock>
      )}
      <SettingBlock titleForId='json-stat-headers' title='Extra Headers (JSON)' moreInfo='Optional JSON object of extra request headers, e.g. {"X-Api-Key": "abc"}.'>
        <textarea id='json-stat-headers' rows={3} value={settings.headersJson} placeholder='{"X-Api-Key": "abc"}'
          onChange={e => updateSettings({ ...settings, headersJson: e.target.value })} />
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
