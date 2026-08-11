/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, IconPicker, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  url: string;
  method: 'POST' | 'GET' | 'PUT';
  body: string;
  glyph: string;
  glyphColor: string;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  url: typeof settings.url === 'string' ? settings.url : '',
  method: (settings.method === 'GET' || settings.method === 'PUT') ? settings.method : 'POST',
  body: typeof settings.body === 'string' ? settings.body : '',
  glyph: typeof settings.glyph === 'string' ? settings.glyph : 'tb-bolt',
  glyphColor: typeof settings.glyphColor === 'string' ? settings.glyphColor : '',
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock
        titleForId='webhook-url'
        title='Webhook URL'
        moreInfo='The URL to call when the button is clicked — e.g. an n8n/Zapier webhook, a Slack incoming webhook, or any HTTP endpoint.'
      >
        <input
          id='webhook-url'
          type='text'
          value={settings.url}
          placeholder='https://hooks.example.com/…'
          onChange={e => updateSettings({ ...settings, url: e.target.value })}
        />
      </SettingBlock>

      <SettingBlock
        titleForId='webhook-method'
        title='Method'
      >
        <select id='webhook-method' value={settings.method} onChange={e => updateSettings({
          ...settings,
          method: (e.target.value === 'GET' || e.target.value === 'PUT') ? e.target.value : 'POST'
        })}>
          <option value='POST'>POST</option>
          <option value='GET'>GET</option>
          <option value='PUT'>PUT</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='webhook-body'
        title='JSON Payload (optional)'
        moreInfo='Request body sent with POST/PUT calls (Content-Type: application/json).'
      >
        <textarea
          id='webhook-body'
          rows={5}
          value={settings.body}
          placeholder='{"message": "Hello from Freeter"}'
          onChange={e => updateSettings({ ...settings, body: e.target.value })}
        />
      </SettingBlock>

      <SettingBlock
        title='Icon'
      >
        <IconPicker
          glyphId={settings.glyph}
          color={settings.glyphColor}
          onSelectGlyph={glyph => updateSettings({ ...settings, glyph })}
          onSelectColor={glyphColor => updateSettings({ ...settings, glyphColor })}
        />
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
