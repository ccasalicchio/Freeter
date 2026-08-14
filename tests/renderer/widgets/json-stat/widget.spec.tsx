/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/json-stat/settings';
import { widgetComp } from '@/widgets/json-stat/widget'
import { screen } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    url: 'https://example.com/api/stats',
    jsonPath: 'data.stats[0].cpu',
    label: '',
    unit: '',
    refreshSecs: 60,
    warn: null,
    crit: null,
    invert: false,
    authType: 'none',
    username: '',
    password: '',
    token: '',
    headersJson: '',
    ...settings
  }
}

function fixtureHttpResponse(overrides?: Partial<{ ok: boolean; status: number; body: string; error?: string }>) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: JSON.stringify({ data: { stats: [{ cpu: 42.5 }] } }),
    ...overrides
  }
}

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

describe('JSON Stat Widget', () => {
  it('should render a "not specified" note, if url is empty', () => {
    setupSut(fixtureSettings({ url: '' }));

    expect(screen.getByText(/url not specified/i)).toBeInTheDocument();
  })

  it('should render the value extracted by jsonPath, with the unit suffix', async () => {
    setupSut(fixtureSettings({ unit: '%' }), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    expect(await screen.findByText('42.5')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  })

  it('should render the label when set', async () => {
    setupSut(fixtureSettings({ label: 'CPU load' }), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    expect(await screen.findByText('CPU load')).toBeInTheDocument();
  })

  it('should color the value by thresholds', async () => {
    setupSut(fixtureSettings({ warn: 10, crit: 40 }), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    const value = await screen.findByText('42.5');
    expect(value).toHaveClass('value-crit');
  })

  it('should render an error state on a non-ok HTTP status', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ ok: false, status: 500 })) }
      }
    });

    expect(await screen.findByText(/HTTP 500/)).toBeInTheDocument();
  })

  it('should render an error state on a request error', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ ok: false, status: 0, error: 'Unable to connect' })) }
      }
    });

    expect(await screen.findByText('Unable to connect')).toBeInTheDocument();
  })

  it('should render an error state when the path resolves to nothing', async () => {
    setupSut(fixtureSettings({ jsonPath: 'data.nope' }), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    expect(await screen.findByText(/no value at path/i)).toBeInTheDocument();
  })

  it('should render an error state on a non-JSON response body', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ body: '<html>nope</html>' })) }
      }
    });

    expect(await screen.findByText(/not valid json/i)).toBeInTheDocument();
  })

  it('should send auth and extra headers with the request', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    setupSut(fixtureSettings({ authType: 'bearer', token: 'tok123', headersJson: '{"X-Api-Key": "abc"}' }), {
      mockWidgetApi: { http: { request } }
    });

    await screen.findByText('42.5');

    expect(request).toBeCalledWith(expect.objectContaining({
      url: 'https://example.com/api/stats',
      headers: expect.objectContaining({
        Authorization: 'Bearer tok123',
        'X-Api-Key': 'abc'
      })
    }));
  })

  it('should re-fetch on the Refresh button click', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    const { userEvent } = setupSut(fixtureSettings({}), {
      mockWidgetApi: { http: { request } }
    });

    await screen.findByText('42.5');
    const callsAfterMount = request.mock.calls.length;

    await userEvent.click(screen.getByTitle(/refresh/i));

    expect(request.mock.calls.length).toBe(callsAfterMount + 1);
  })
})
