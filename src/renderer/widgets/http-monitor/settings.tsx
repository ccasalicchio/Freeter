/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export type HttpMonitorMethod = 'GET' | 'HEAD';

export interface Settings {
  url: string;
  method: HttpMonitorMethod;
  intervalSecs: number;
  expectStatus: number;
  timeoutSecs: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  url: typeof settings.url === 'string' ? settings.url : '',
  method: settings.method === 'GET' ? 'GET' : 'HEAD',
  intervalSecs: typeof settings.intervalSecs === 'number' && settings.intervalSecs >= 5 ? settings.intervalSecs : 60,
  expectStatus: typeof settings.expectStatus === 'number' && settings.expectStatus > 0 ? settings.expectStatus : 200,
  timeoutSecs: typeof settings.timeoutSecs === 'number' && settings.timeoutSecs > 0 ? settings.timeoutSecs : 10,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock titleForId='http-monitor-url' title='URL' moreInfo='Full URL of the endpoint to monitor, e.g. https://example.com/health.'>
        <input id='http-monitor-url' type='text' value={settings.url} placeholder='https://example.com/health'
          onChange={e => updateSettings({ ...settings, url: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='http-monitor-method' title='Method' moreInfo='HEAD is lighter, but some servers reject it. Switch to GET if the endpoint reports DOWN unexpectedly.'>
        <select id='http-monitor-method' value={settings.method} onChange={e => updateSettings({
          ...settings, method: e.target.value === 'GET' ? 'GET' : 'HEAD'
        })}>
          <option value='HEAD'>HEAD</option>
          <option value='GET'>GET</option>
        </select>
      </SettingBlock>
      <SettingBlock titleForId='http-monitor-interval' title='Check Every (seconds)' moreInfo='How often to check the endpoint. Minimum 5 seconds.'>
        <input id='http-monitor-interval' type='number' min={5} value={settings.intervalSecs}
          onChange={e => updateSettings({ ...settings, intervalSecs: Math.max(5, Number.parseInt(e.target.value) || 60) })} />
      </SettingBlock>
      <SettingBlock titleForId='http-monitor-status' title='Expected Status Code' moreInfo='The HTTP status code that counts as UP. Usually 200.'>
        <input id='http-monitor-status' type='number' min={100} max={599} value={settings.expectStatus}
          onChange={e => updateSettings({ ...settings, expectStatus: Number.parseInt(e.target.value) || 200 })} />
      </SettingBlock>
      <SettingBlock titleForId='http-monitor-timeout' title='Timeout (seconds)' moreInfo='A check counts as DOWN when no response arrives within this time.'>
        <input id='http-monitor-timeout' type='number' min={1} value={settings.timeoutSecs}
          onChange={e => updateSettings({ ...settings, timeoutSecs: Math.max(1, Number.parseInt(e.target.value) || 10) })} />
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
