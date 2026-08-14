/*
 * Copyright: (c) 2024, Alex Kaul
 * GNU General Public License v3.0 or later (see COPYING or https://www.gnu.org/licenses/gpl-3.0.txt)
 */

import { Settings } from '@/widgets/grafana-alerts/settings';
import { widgetComp } from '@/widgets/grafana-alerts/widget'
import { screen } from '@testing-library/react';
import { SetupWidgetSutOptional, setupWidgetSut } from '@tests/widgets/setupSut'

function fixtureSettings(settings: Partial<Settings>): Settings {
  return {
    baseUrl: 'http://grafana.local:3000',
    source: 'grafana',
    token: '',
    stateFilter: 'firing',
    labelFilter: '',
    refreshSecs: 60,
    ...settings
  }
}

const fixtureAlerts = [
  {
    labels: { alertname: 'HighCPU', severity: 'critical', team: 'backend' },
    annotations: { summary: 'CPU usage above 90%' },
    status: { state: 'active' },
    startsAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    labels: { alertname: 'DiskAlmostFull', severity: 'warning', team: 'infra' },
    annotations: { summary: 'Disk usage above 80%' },
    status: { state: 'active' },
    startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    labels: { alertname: 'SilencedAlert', severity: 'warning' },
    annotations: {},
    status: { state: 'suppressed' },
    startsAt: new Date().toISOString()
  }
]

function fixtureHttpResponse(overrides?: Partial<{ ok: boolean; status: number; body: string; error?: string }>) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    body: JSON.stringify(fixtureAlerts),
    ...overrides
  }
}

function setupSut(settings: Settings, optional?: SetupWidgetSutOptional) {
  return setupWidgetSut(widgetComp, settings, optional);
}

describe('Grafana Alerts Widget', () => {
  it('should render a "not specified" note, if baseUrl is empty', () => {
    setupSut(fixtureSettings({ baseUrl: '' }));

    expect(screen.getByText(/url not specified/i)).toBeInTheDocument();
  })

  it('should render the firing alerts with name, summary and severity dot', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    expect(await screen.findByText('HighCPU')).toBeInTheDocument();
    expect(screen.getByText('DiskAlmostFull')).toBeInTheDocument();
    expect(screen.getByText('CPU usage above 90%')).toBeInTheDocument();
    expect(screen.queryByText('SilencedAlert')).not.toBeInTheDocument();
  })

  it('should render a red count badge with the number of firing alerts', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    const badge = await screen.findByText('2 firing');
    expect(badge).toHaveClass('badge-firing');
  })

  it('should render a green "0 firing" badge when nothing is firing', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ body: '[]' })) }
      }
    });

    const badge = await screen.findByText('0 firing');
    expect(badge).toHaveClass('badge-ok');
    expect(screen.getByText(/no firing alerts/i)).toBeInTheDocument();
  })

  it('should show non-firing alerts too when stateFilter is all', async () => {
    setupSut(fixtureSettings({ stateFilter: 'all' }), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    expect(await screen.findByText('SilencedAlert')).toBeInTheDocument();
  })

  it('should filter alerts by a key=value label filter', async () => {
    setupSut(fixtureSettings({ labelFilter: 'team=backend' }), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) }
      }
    });

    expect(await screen.findByText('HighCPU')).toBeInTheDocument();
    expect(screen.queryByText('DiskAlmostFull')).not.toBeInTheDocument();
    expect(screen.getByText('1 firing')).toBeInTheDocument();
  })

  it('should call the grafana alerts endpoint with a bearer token', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    setupSut(fixtureSettings({ token: 'sa-token' }), {
      mockWidgetApi: { http: { request } }
    });

    await screen.findByText('HighCPU');

    expect(request).toBeCalledWith(expect.objectContaining({
      url: 'http://grafana.local:3000/api/alertmanager/grafana/api/v2/alerts',
      headers: expect.objectContaining({ Authorization: 'Bearer sa-token' })
    }));
  })

  it('should call the standalone alertmanager endpoint when source is alertmanager', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    setupSut(fixtureSettings({ source: 'alertmanager', baseUrl: 'http://am.local:9093' }), {
      mockWidgetApi: { http: { request } }
    });

    await screen.findByText('HighCPU');

    expect(request).toBeCalledWith(expect.objectContaining({
      url: 'http://am.local:9093/api/v2/alerts'
    }));
  })

  it('should open the alert list in the browser on a row click', async () => {
    const openExternalUrl = jest.fn();
    const { userEvent } = setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse()) },
        shell: { openExternalUrl }
      }
    });

    await userEvent.click(await screen.findByText('HighCPU'));

    expect(openExternalUrl).toBeCalledWith('http://grafana.local:3000/alerting/list');
  })

  it('should render an error state on a non-ok HTTP status', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ ok: false, status: 401 })) }
      }
    });

    expect(await screen.findByText(/alerts api 401/i)).toBeInTheDocument();
  })

  it('should render an error state on a request error', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ ok: false, status: 0, error: 'Unable to connect' })) }
      }
    });

    expect(await screen.findByText('Unable to connect')).toBeInTheDocument();
  })

  it('should render an error state on a non-JSON response body', async () => {
    setupSut(fixtureSettings({}), {
      mockWidgetApi: {
        http: { request: jest.fn(async () => fixtureHttpResponse({ body: '<html>login</html>' })) }
      }
    });

    expect(await screen.findByText(/not an alertmanager/i)).toBeInTheDocument();
  })

  it('should re-fetch on the Refresh button click', async () => {
    const request = jest.fn(async () => fixtureHttpResponse());
    const { userEvent } = setupSut(fixtureSettings({}), {
      mockWidgetApi: { http: { request } }
    });

    await screen.findByText('HighCPU');
    const callsAfterMount = request.mock.calls.length;

    await userEvent.click(screen.getByTitle(/refresh/i));

    expect(request.mock.calls.length).toBe(callsAfterMount + 1);
  })
})
