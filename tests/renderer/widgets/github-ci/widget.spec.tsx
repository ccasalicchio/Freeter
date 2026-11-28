/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/github-ci/settings';
import { widgetComp } from '@/widgets/github-ci/widget';
import { act, screen } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut';

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    repo: 'owner/name',
    branch: '',
    token: '',
    refreshSecs: 120,
    ...settings
  }
}

function fixtureHttpResponse() {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: JSON.stringify({
      workflow_runs: [{ id: 1, name: 'CI', head_branch: 'master', status: 'completed', conclusion: 'success', html_url: 'https://github.com/x', run_number: 7 }]
    })
  }
}

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

type RequestCfg = { url: string; headers?: Record<string, string> };

describe('GitHub CI Widget', () => {
  it('should request without auth, when there is no token', async () => {
    const request = jest.fn(async (_cfg: RequestCfg) => fixtureHttpResponse());
    setupSut(fixtureSettings({}), { mockWidgetApi: { http: { request } } });

    expect(await screen.findByText('CI')).toBeInTheDocument();
    expect(request.mock.calls[0][0].headers).not.toHaveProperty('Authorization');
  })

  it('should use a legacy plaintext token as-is, without decrypting', async () => {
    const request = jest.fn(async (_cfg: RequestCfg) => fixtureHttpResponse());
    const decryptString = jest.fn();
    setupSut(fixtureSettings({ token: 'ghp_plain' }), { mockWidgetApi: { http: { request }, safeStorage: { decryptString } } });

    expect(await screen.findByText('CI')).toBeInTheDocument();
    expect(request.mock.calls[0][0].headers?.Authorization).toBe('Bearer ghp_plain');
    expect(decryptString).not.toHaveBeenCalled();
  })

  it('should decrypt an encrypted token before the first request, and never send the ciphertext', async () => {
    let resolveDecrypt: (value: string) => void = () => undefined;
    const decryptString = jest.fn(() => new Promise<string>(resolve => {
      resolveDecrypt = resolve;
    }));
    const request = jest.fn(async (_cfg: RequestCfg) => fixtureHttpResponse());
    setupSut(fixtureSettings({ token: 'enc:v1:Q0lQSEVS' }), { mockWidgetApi: { http: { request }, safeStorage: { decryptString } } });

    // decrypt pending: no request yet
    expect(decryptString).toHaveBeenCalledWith('Q0lQSEVS');
    expect(request).not.toHaveBeenCalled();

    await act(async () => resolveDecrypt('ghp_decrypted'));

    expect(await screen.findByText('CI')).toBeInTheDocument();
    expect(request).toHaveBeenCalled();
    for (const [cfg] of request.mock.calls) {
      expect(cfg.headers?.Authorization).toBe('Bearer ghp_decrypted');
      expect(JSON.stringify(cfg)).not.toContain('enc:v1:');
    }
  })

  it('should show a re-enter error and make no request, when the token can\'t be decrypted', async () => {
    const decryptString = jest.fn(async () => {
      throw new Error('decrypt failed');
    });
    const request = jest.fn(async (_cfg: RequestCfg) => fixtureHttpResponse());
    setupSut(fixtureSettings({ token: 'enc:v1:Rk9SRUlHTg==' }), { mockWidgetApi: { http: { request }, safeStorage: { decryptString } } });

    expect(await screen.findByText(/can't be decrypted on this machine.*re-enter it in settings/i)).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  })
})
