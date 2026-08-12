/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { CreateSettingsState, ReactComponent, SettingBlock, SettingsEditorReactComponentProps } from '@/widgets/appModules';

export interface Settings {
  repo: string;
  token: string;
  refreshSecs: number;
}

export const createSettingsState: CreateSettingsState<Settings> = (settings) => ({
  repo: typeof settings.repo === 'string' ? settings.repo : '',
  token: typeof settings.token === 'string' ? settings.token : '',
  refreshSecs: typeof settings.refreshSecs === 'number' ? settings.refreshSecs : 300,
})

function SettingsEditorComp({settings, settingsApi}: SettingsEditorReactComponentProps<Settings>) {
  const {updateSettings} = settingsApi;

  return (
    <>
      <SettingBlock titleForId='gh-prs-repo' title='Repository' moreInfo='GitHub repository in owner/name form.'>
        <input id='gh-prs-repo' type='text' value={settings.repo} placeholder='owner/name'
          onChange={e => updateSettings({ ...settings, repo: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='gh-prs-token' title='Access Token (optional)' moreInfo='Fine-grained personal access token with Pull requests read permission. Required for private repositories. Stored in the local Freeter profile.'>
        <input id='gh-prs-token' type='password' value={settings.token} placeholder='github_pat_…'
          onChange={e => updateSettings({ ...settings, token: e.target.value.trim() })} />
      </SettingBlock>
      <SettingBlock titleForId='gh-prs-refresh' title='Refresh Every'>
        <select id='gh-prs-refresh' value={settings.refreshSecs} onChange={e => updateSettings({
          ...settings, refreshSecs: Number.parseInt(e.target.value) || 300
        })}>
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
