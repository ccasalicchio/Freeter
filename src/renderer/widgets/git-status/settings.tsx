/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, CreateSettingsState, ReactComponent, SettingBlock, SettingRow, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  repoPath: string;
  refreshSecs: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  repoPath: typeof settings.repoPath === 'string' ? settings.repoPath : '',
  refreshSecs: typeof settings.refreshSecs === 'number' ? settings.refreshSecs : 60,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings, dialog} = settingsApi;

  return (
    <>
      <SettingBlock
        titleForId='git-repo-path'
        title='Repository Folder'
        moreInfo='Full path of the git repository to watch (e.g. the Root Folder of this project).'
      >
        <SettingRow>
          <input
            id='git-repo-path'
            type='text'
            value={settings.repoPath}
            placeholder='e.g. C:\Projects\my-repo'
            onChange={e => updateSettings({ ...settings, repoPath: e.target.value })}
          />
          <Button caption='Browse…' onClick={async () => {
            const { canceled, filePaths } = await dialog.showOpenDirDialog({ defaultPath: settings.repoPath, multiSelect: false });
            if (!canceled && filePaths[0]) {
              updateSettings({ ...settings, repoPath: filePaths[0] });
            }
          }} />
        </SettingRow>
      </SettingBlock>

      <SettingBlock
        titleForId='git-refresh'
        title='Refresh Every'
      >
        <select id='git-refresh' value={settings.refreshSecs} onChange={e => updateSettings({
          ...settings,
          refreshSecs: Number.parseInt(e.target.value) || 60
        })}>
          <option value={15}>15 seconds</option>
          <option value={30}>30 seconds</option>
          <option value={60}>1 minute</option>
          <option value={300}>5 minutes</option>
        </select>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
