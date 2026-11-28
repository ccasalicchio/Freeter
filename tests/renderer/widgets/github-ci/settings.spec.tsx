/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings, settingsEditorComp } from '@/widgets/github-ci/settings';
import { screen } from '@testing-library/react';
import { setupSettingsSut } from '@tests/widgets/setupSut';

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    repo: 'owner/name',
    branch: '',
    token: '',
    refreshSecs: 120,
    ...settings
  }
}

describe('GitHub CI Settings', () => {
  it('should show a plaintext token in the password input', () => {
    setupSettingsSut(settingsEditorComp, fixtureSettings({ token: 'ghp_plain' }));

    expect(screen.getByLabelText(/access token/i)).toHaveValue('ghp_plain');
    expect(screen.queryByText(/saved \(encrypted/i)).not.toBeInTheDocument();
  })

  it('should not show an encrypted token as the value, but a "saved (encrypted)" hint', () => {
    setupSettingsSut(settingsEditorComp, fixtureSettings({ token: 'enc:v1:Q0lQSEVS' }));

    expect(screen.getByLabelText(/access token/i)).toHaveValue('');
    expect(screen.getByText(/saved \(encrypted/i)).toBeInTheDocument();
  })

  it('should keep the encrypted token unless a new one is typed', async () => {
    const { userEvent, getSettings } = setupSettingsSut(settingsEditorComp, fixtureSettings({ token: 'enc:v1:Q0lQSEVS' }));

    await userEvent.type(screen.getByLabelText(/repository/i), 'x');
    expect(getSettings().token).toBe('enc:v1:Q0lQSEVS');

    await userEvent.type(screen.getByLabelText(/access token/i), 'ghp_new');
    expect(getSettings().token).toBe('ghp_new');
  })

  it('should clear an encrypted token with the Clear button', async () => {
    const { userEvent, getSettings } = setupSettingsSut(settingsEditorComp, fixtureSettings({ token: 'enc:v1:Q0lQSEVS' }));

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(getSettings().token).toBe('');
  })
})
