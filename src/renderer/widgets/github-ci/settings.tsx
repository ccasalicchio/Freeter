/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  repo: string;
  branch: string;
  token: string;
  refreshSecs: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  repo: typeof settings.repo === 'string' ? settings.repo : '',
  branch: typeof settings.branch === 'string' ? settings.branch : '',
  token: typeof settings.token === 'string' ? settings.token : '',
  refreshSecs: typeof settings.refreshSecs === 'number' ? settings.refreshSecs : 120,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock titleForId='gh-ci-repo' title='Repository' moreInfo='GitHub repository in owner/name form, e.g. ccasalicchio/Freeter.'>
        <input id='gh-ci-repo' type='text' value={settings.repo} placeholder='owner/name'
          onChange={e => updateSettings({ ...settings, repo: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='gh-ci-branch' title='Branch (optional)' moreInfo='Only show runs for this branch. Empty shows all branches.'>
        <input id='gh-ci-branch' type='text' value={settings.branch} placeholder='e.g. master'
          onChange={e => updateSettings({ ...settings, branch: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='gh-ci-token' title='Access Token (optional)' moreInfo='Fine-grained personal access token with Actions read permission. Required for private repositories. Stored in the local Freeter profile.'>
        <input id='gh-ci-token' type='password' value={settings.token} placeholder='github_pat_…'
          onChange={e => updateSettings({ ...settings, token: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='gh-ci-refresh' title='Refresh Every'>
        <select id='gh-ci-refresh' value={settings.refreshSecs} onChange={e => updateSettings({
          ...settings, refreshSecs: Number.parseInt(e.target.value) || 120
        })}>
          <option value={60}>1 minute</option>
          <option value={120}>2 minutes</option>
          <option value={300}>5 minutes</option>
          <option value={900}>15 minutes</option>
        </select>
      </SettingBlock>
    </>
  )
}

export const settingsEditorComp: ReactComponent<SettingsEditorReactComponentProps<Settings>> = {
  type: 'react',
  Comp: SettingsEditorComp
}
