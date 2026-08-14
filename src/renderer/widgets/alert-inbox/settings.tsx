/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';
import { useEffect } from 'react';

export interface Settings {
  /** random per-widget token authenticating POST /ingest/{token} requests */
  ingestToken: string;
  notifyDesktop: boolean;
  maxShown: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  ingestToken: typeof settings.ingestToken === 'string' ? settings.ingestToken : '',
  notifyDesktop: typeof settings.notifyDesktop === 'boolean' ? settings.notifyDesktop : true,
  maxShown: typeof settings.maxShown === 'number' && settings.maxShown >= 1 ? settings.maxShown : 20,
})

function generateToken(): string {
  return crypto.randomUUID();
}

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  // a widget without a token cannot receive anything: generate one on first open
  useEffect(() => {
    if (settings.ingestToken === '') {
      updateSettings({ ...settings, ingestToken: generateToken() });
    }
  }, [settings, updateSettings]);

  return (
    <>
      <SettingBlock
        titleForId='alert-inbox-token'
        title='Ingest Token'
        moreInfo={'The token authenticating incoming webhooks. Point Grafana/Alertmanager webhook contact points at http://<host>:<port>/ingest/<token>, where host/port are the MCP server address from Application Settings > AI / MCP (default 127.0.0.1:39587; the MCP server must be enabled). Regenerating the token revokes the old URL.'}
      >
        <input id='alert-inbox-token' type='text' readOnly value={settings.ingestToken} />
        <div>
          <button type='button' onClick={() => updateSettings({ ...settings, ingestToken: generateToken() })}>
            Regenerate
          </button>
          {' '}
          <button type='button' onClick={() => navigator.clipboard.writeText(settings.ingestToken)}>
            Copy Token
          </button>
        </div>
      </SettingBlock>
      <SettingBlock
        titleForId='alert-inbox-notify'
        title='Desktop Notifications'
        moreInfo='Show an OS toast for each firing alert received (max 3 per webhook request).'
      >
        <label>
          <input id='alert-inbox-notify' type='checkbox' checked={settings.notifyDesktop}
            onChange={e => updateSettings({ ...settings, notifyDesktop: e.target.checked })} />
          Notify on firing alerts
        </label>
      </SettingBlock>
      <SettingBlock
        titleForId='alert-inbox-max-shown'
        title='Alerts Shown'
        moreInfo='How many of the stored alerts (newest first, up to 100 kept) to show in the widget.'
      >
        <input id='alert-inbox-max-shown' type='number' min={1} max={100} value={settings.maxShown}
          onChange={e => updateSettings({ ...settings, maxShown: Math.max(1, Number.parseInt(e.target.value) || 20) })} />
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
