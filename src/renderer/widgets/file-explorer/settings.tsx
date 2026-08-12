/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Button, CreateSettingsState, ReactComponent, SettingBlock, SettingRow, SettingsEditorReactComponentProps } from '@/widgets/appModules';

const sortByValues = ['name', 'modified'] as const;
export type SortBy = typeof sortByValues[number];

export interface Settings {
  folderPath: string;
  showHidden: boolean;
  sortBy: SortBy;
  refreshSecs: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  folderPath: typeof settings.folderPath === 'string' ? settings.folderPath : '',
  showHidden: typeof settings.showHidden === 'boolean' ? settings.showHidden : false,
  sortBy: sortByValues.indexOf(settings.sortBy as SortBy) > -1 ? settings.sortBy as SortBy : 'name',
  refreshSecs: typeof settings.refreshSecs === 'number' ? settings.refreshSecs : 0,
})

function SettingsEditorComp({ settings, settingsApi }: SettingsEditorReactComponentProps<Settings>) {
  const { updateSettings, dialog } = settingsApi;

  return (
    <>
      <SettingBlock
        titleForId='file-explorer-folder-path'
        title='Folder'
        moreInfo='Full path of the folder to list.'
      >
        <SettingRow>
          <input
            id='file-explorer-folder-path'
            type='text'
            value={settings.folderPath}
            placeholder='e.g. C:\Projects'
            onChange={e => updateSettings({ ...settings, folderPath: e.target.value })}
          />
          <Button caption='Browse…' onClick={async () => {
            const { canceled, filePaths } = await dialog.showOpenDirDialog({ defaultPath: settings.folderPath, multiSelect: false });
            if (!canceled && filePaths[0]) {
              updateSettings({ ...settings, folderPath: filePaths[0] });
            }
          }} />
        </SettingRow>
      </SettingBlock>

      <SettingBlock
        titleForId='file-explorer-show-hidden'
        title='Hidden Files'
      >
        <label>
          <input
            id='file-explorer-show-hidden'
            type='checkbox'
            checked={settings.showHidden}
            onChange={e => updateSettings({ ...settings, showHidden: e.target.checked })}
          />
          Show hidden files
        </label>
      </SettingBlock>

      <SettingBlock
        titleForId='file-explorer-sort-by'
        title='Sort By'
      >
        <select id='file-explorer-sort-by' value={settings.sortBy} onChange={e => updateSettings({
          ...settings,
          sortBy: sortByValues.indexOf(e.target.value as SortBy) > -1 ? e.target.value as SortBy : 'name'
        })}>
          <option value='name'>Name</option>
          <option value='modified'>Last Modified</option>
        </select>
      </SettingBlock>

      <SettingBlock
        titleForId='file-explorer-refresh'
        title='Refresh Every'
      >
        <select id='file-explorer-refresh' value={settings.refreshSecs} onChange={e => updateSettings({
          ...settings,
          refreshSecs: Number.parseInt(e.target.value) || 0
        })}>
          <option value={0}>Manually</option>
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
