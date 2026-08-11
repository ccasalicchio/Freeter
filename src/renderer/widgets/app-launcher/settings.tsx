/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, CreateSettingsState, IconPicker, ReactComponent, SettingBlock, SettingRow, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  appPath: string;
  args: string;
  glyph: string;
  glyphColor: string;
  customIcon: string;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  appPath: typeof settings.appPath === 'string' ? settings.appPath : '',
  args: typeof settings.args === 'string' ? settings.args : '',
  glyph: typeof settings.glyph === 'string' ? settings.glyph : 'rocket',
  glyphColor: typeof settings.glyphColor === 'string' ? settings.glyphColor : '',
  customIcon: typeof settings.customIcon === 'string' ? settings.customIcon : '',
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings, dialog} = settingsApi;

  return (
    <>
      <SettingBlock
        titleForId='app-launcher-path'
        title='Application'
        moreInfo='Full path of the application executable to launch.'
      >
        <SettingRow>
          <input
            id='app-launcher-path'
            type='text'
            value={settings.appPath}
            placeholder='e.g. C:\Program Files\App\app.exe'
            onChange={e => updateSettings({ ...settings, appPath: e.target.value })}
          />
          <Button caption='Browse…' onClick={async () => {
            const { canceled, filePaths } = await dialog.showOpenFileDialog({ defaultPath: settings.appPath, multiSelect: false });
            if (!canceled && filePaths[0]) {
              updateSettings({ ...settings, appPath: filePaths[0] });
            }
          }} />
        </SettingRow>
      </SettingBlock>

      <SettingBlock
        titleForId='app-launcher-args'
        title='Arguments (optional)'
        moreInfo='Command-line arguments, space-separated. Quote arguments containing spaces.'
      >
        <input
          id='app-launcher-args'
          type='text'
          value={settings.args}
          placeholder='e.g. --profile work'
          onChange={e => updateSettings({ ...settings, args: e.target.value })}
        />
      </SettingBlock>

      <SettingBlock
        title='Icon'
        moreInfo='Pick a gallery icon and color, or set a custom image URL/path.'
      >
        <IconPicker
          glyphId={settings.glyph}
          color={settings.glyphColor}
          onSelectGlyph={glyph => updateSettings({ ...settings, glyph })}
          onSelectColor={glyphColor => updateSettings({ ...settings, glyphColor })}
        />
        <input
          type='text'
          aria-label='Custom icon image'
          value={settings.customIcon}
          placeholder='Custom image URL or local path (optional)'
          onChange={e => updateSettings({ ...settings, customIcon: e.target.value })}
        />
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
