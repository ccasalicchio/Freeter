/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  ports: string;
  host: string;
  refreshSecs: number;
  notifyOnChange: boolean;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  ports: typeof settings.ports === 'string' ? settings.ports : '',
  host: typeof settings.host === 'string' && settings.host !== '' ? settings.host : '127.0.0.1',
  refreshSecs: typeof settings.refreshSecs === 'number' && settings.refreshSecs >= 5 ? settings.refreshSecs : 30,
  notifyOnChange: typeof settings.notifyOnChange === 'boolean' ? settings.notifyOnChange : false,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock titleForId='port-watcher-ports' title='Ports' moreInfo='Comma-separated list of TCP ports to watch, e.g. "3000, 5432, 8080".'>
        <input id='port-watcher-ports' type='text' value={settings.ports} placeholder='3000, 5432, 8080'
          onChange={e => updateSettings({ ...settings, ports: e.target.value })} />
      </SettingBlock>
      <SettingBlock titleForId='port-watcher-host' title='Host' moreInfo='Display label for the watched host. The widget checks listening ports on the local machine.'>
        <input id='port-watcher-host' type='text' value={settings.host} placeholder='127.0.0.1'
          onChange={e => updateSettings({ ...settings, host: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='port-watcher-refresh' title='Refresh Every (seconds)' moreInfo='How often to re-check the ports. Minimum 5 seconds.'>
        <input id='port-watcher-refresh' type='number' min={5} value={settings.refreshSecs}
          onChange={e => updateSettings({ ...settings, refreshSecs: Math.max(5, Number.parseInt(e.target.value) || 30) })} />
      </SettingBlock>
      <SettingBlock titleForId='port-watcher-notify' title='Notify on Change' moreInfo='Show a desktop notification when a port starts or stops listening.'>
        <label>
          <input id='port-watcher-notify' type='checkbox' checked={settings.notifyOnChange}
            onChange={e => updateSettings({ ...settings, notifyOnChange: e.target.checked })} />
          {' Show a desktop notification when a port state changes'}
        </label>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
